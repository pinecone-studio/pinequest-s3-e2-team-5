import { and, eq, inArray } from 'drizzle-orm';
import { announcedExamGrades } from '../../db/schemas/announcedExamGrades.schema';
import { announcedExams } from '../../db/schemas/announcedExams.schema';
import { choices } from '../../db/schemas/choices.schema';
import { exams } from '../../db/schemas/exam.schema';
import { questions } from '../../db/schemas/question.schema';
import { students } from '../../db/schemas/student.schema';
import type { GraphQLContext } from '../../server';
import { legacyChoices, supportsChoiceMediaColumns } from './choices-table.helpers';
import { badUserInputError, notFoundError, unauthorizedError } from '../errors';

const PRE_START_VISIBLE_WINDOW_MS = 10 * 60_000;

const ULAANBAATAR_UTC_OFFSET_HOURS = 8;

function parseScheduleDateTime(scheduledDate: string, startTime: string) {
	const normalizedDate = scheduledDate.trim().split('T')[0]?.replaceAll('/', '-');
	const normalizedTime = startTime
		.trim()
		.split('T')
		.pop()
		?.replace('Z', '')
		.split('.')[0]
		.replace(/[+-]\d{2}:\d{2}$/, '');
	const dateMatch = normalizedDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	const timeMatch = normalizedTime?.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);

	if (!dateMatch || !timeMatch) {
		return null;
	}

	const [, year, month, day] = dateMatch;
	const [, hour, minute, second] = timeMatch;

	// Announced exam times are entered as Ulaanbaatar wall time. Build the instant
	// in UTC so visibility checks stay correct regardless of the worker runtime timezone.
	const startsAt = new Date(
		Date.UTC(
			Number(year),
			Number(month) - 1,
			Number(day),
			Number(hour) - ULAANBAATAR_UTC_OFFSET_HOURS,
			Number(minute),
			Number(second ?? '0'),
			0,
		),
	);

	if (Number.isNaN(startsAt.getTime())) {
		return null;
	}

	return startsAt;
}

export function isExamOpenNow(params: { openStatus: boolean; scheduledDate: string; startTime: string; duration: number }) {
	const startsAt = parseScheduleDateTime(params.scheduledDate, params.startTime);
	if (!startsAt) {
		return false;
	}

	if (!params.openStatus) {
		return false;
	}

	const durationMinutes = Math.max(0, params.duration);
	const closesAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
	const currentTime = new Date();

	return currentTime >= startsAt && currentTime < closesAt;
}

export function isExamVisibleForStudent(params: { openStatus: boolean; scheduledDate: string; startTime: string; duration: number }) {
	const startsAt = parseScheduleDateTime(params.scheduledDate, params.startTime);
	if (!startsAt) {
		return false;
	}

	if (!params.openStatus) {
		return false;
	}

	const durationMinutes = Math.max(0, params.duration);
	const closesAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
	const visibleFrom = new Date(startsAt.getTime() - PRE_START_VISIBLE_WINDOW_MS);
	const currentTime = new Date();

	return currentTime >= visibleFrom && currentTime < closesAt;
}

export function getExamPreStartLockState(params: { scheduledDate: string; startTime: string }) {
	const startsAt = parseScheduleDateTime(params.scheduledDate, params.startTime);
	if (!startsAt) {
		return {
			isLocked: false,
			minutesUntilStart: 0,
			startsAtMs: null as number | null,
		};
	}

	const nowMs = Date.now();
	const startsAtMs = startsAt.getTime();
	const lockStartsAtMs = startsAtMs - PRE_START_VISIBLE_WINDOW_MS;
	const isLocked = nowMs >= lockStartsAtMs && nowMs < startsAtMs;
	const minutesUntilStart = isLocked ? Math.max(1, Math.ceil((startsAtMs - nowMs) / 60_000)) : 0;

	return {
		isLocked,
		minutesUntilStart,
		startsAtMs,
	};
}

export function getSubmissionResultLockState(params: {
	scheduledDate?: string | null;
	startTime?: string | null;
	duration: number;
}) {
	if (!params.scheduledDate || !params.startTime) {
		return {
			isLocked: false,
			secondsUntilUnlock: 0,
			unlockAtMs: null as number | null,
		};
	}

	const startsAt = parseScheduleDateTime(params.scheduledDate, params.startTime);
	if (!startsAt) {
		return {
			isLocked: false,
			secondsUntilUnlock: 0,
			unlockAtMs: null as number | null,
		};
	}

	const nowMs = Date.now();
	const unlockAtMs = startsAt.getTime() + Math.max(0, params.duration) * 60_000;
	const isLocked = nowMs < unlockAtMs;
	const secondsUntilUnlock = isLocked ? Math.max(1, Math.ceil((unlockAtMs - nowMs) / 1000)) : 0;

	return {
		isLocked,
		secondsUntilUnlock,
		unlockAtMs,
	};
}

export function canSubmitExamAttempt(params: {
	openStatus: boolean;
	scheduledDate: string;
	startTime: string;
	duration: number;
	startedAt?: number | null;
}) {
	const startsAt = parseScheduleDateTime(params.scheduledDate, params.startTime);
	if (!startsAt || !params.openStatus) {
		return false;
	}

	const startsAtMs = startsAt.getTime();
	const closesAtMs = startsAtMs + Math.max(0, params.duration) * 60_000;
	const effectiveStartedAt = params.startedAt ?? Date.now();
	const nowMs = Date.now();

	return effectiveStartedAt >= startsAtMs && effectiveStartedAt <= closesAtMs && nowMs >= startsAtMs;
}

export function isExamScheduledForFuture(params: { openStatus: boolean; scheduledDate: string; startTime: string }) {
	const startsAt = parseScheduleDateTime(params.scheduledDate, params.startTime);
	if (!startsAt) {
		return false;
	}

	if (!params.openStatus) {
		return false;
	}

	return startsAt.getTime() - PRE_START_VISIBLE_WINDOW_MS > Date.now();
}

export async function requireStudentRecord(context: GraphQLContext) {
	if (!context.auth.userId || !context.auth.isAuthenticated) {
		throw unauthorizedError();
	}

	const student = await context.db.select().from(students).where(eq(students.id, context.auth.userId)).get();

	if (!student) {
		throw notFoundError('Student profile not found.');
	}

	return student;
}

export async function getAccessibleExamForStudent(context: GraphQLContext, announcedExamId: string) {
	const student = await requireStudentRecord(context);
	const examRecord = await context.db
		.select()
		.from(announcedExamGrades)
		.innerJoin(announcedExams, eq(announcedExamGrades.announcedExamId, announcedExams.id))
		.innerJoin(exams, eq(announcedExams.examId, exams.id))
		.where(
			and(
				eq(announcedExams.id, announcedExamId),
				eq(announcedExamGrades.classroomId, student.classroomId),
				eq(announcedExams.openStatus, true),
			),
		)
		.get();

	if (!examRecord) {
		throw notFoundError('Exam not found.');
	}

	if (
		!isExamOpenNow({
			openStatus: examRecord.announced_exams.openStatus,
			scheduledDate: examRecord.announced_exams.scheduledDate,
			startTime: examRecord.announced_exams.startTime,
			duration: examRecord.exams.duration,
		})
	) {
		throw badUserInputError('Exam is not open at this time.');
	}

	return {
		student,
		exam: {
			...examRecord.exams,
			announcedExamId: examRecord.announced_exams.id,
			scheduledDate: examRecord.announced_exams.scheduledDate,
			startTime: examRecord.announced_exams.startTime,
			openStatus: examRecord.announced_exams.openStatus,
		},
	};
}

export async function loadQuestionsWithChoices(context: GraphQLContext, examId: string) {
	const examQuestions = await context.db.select().from(questions).where(eq(questions.examId, examId)).all();

	const sortedQuestions = [...examQuestions].sort((left, right) => left.indexOnExam - right.indexOnExam);

	if (sortedQuestions.length === 0) {
		return [];
	}

	const questionIds = sortedQuestions.map((question) => question.id);
	const mediaColumnsSupported = await supportsChoiceMediaColumns(context);
	const questionChoices = mediaColumnsSupported
		? await context.db.select().from(choices).where(inArray(choices.questionId, questionIds)).all()
		: (await context.db.select().from(legacyChoices).where(inArray(legacyChoices.questionId, questionIds)).all()).map((choice) => ({
				...choice,
				imageUrl: null,
				videoUrl: null,
			}));

	return sortedQuestions.map((question, index) => ({
		...question,
		question: question.question,
		order: index + 1,
		choices: questionChoices
			.filter((choice) => choice.questionId === question.id)
			.sort((left, right) => left.label.localeCompare(right.label)),
	}));
}
