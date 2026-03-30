import { and, eq, inArray } from "drizzle-orm";
import { announcedExamGrades } from "../../db/schemas/announcedExamGrades.schema";
import { announcedExams } from "../../db/schemas/announcedExams.schema";
import { choices } from "../../db/schemas/choices.schema";
import { exams } from "../../db/schemas/exam.schema";
import { questions } from "../../db/schemas/question.schema";
import { students } from "../../db/schemas/student.schema";
import type { GraphQLContext } from "../../server";
import {
	legacyChoices,
	supportsChoiceMediaColumns,
} from "./choices-table.helpers";
import { notFoundError } from "../errors";

export async function requireStudentRecord(context: GraphQLContext) {
	if (!context.auth.userId || !context.auth.isAuthenticated) {
		throw new Error("Unauthorized");
	}

	const student = await context.db
		.select()
		.from(students)
		.where(eq(students.id, context.auth.userId))
		.get();

	if (!student) {
		throw new Error("Student profile not found.");
	}

	return student;
}

export async function getAccessibleExamForStudent(
	context: GraphQLContext,
	examId: string,
) {
	const student = await requireStudentRecord(context);
	const examRecord = await context.db
		.select()
		.from(announcedExamGrades)
		.innerJoin(announcedExams, eq(announcedExamGrades.announcedExamId, announcedExams.id))
		.innerJoin(exams, eq(announcedExams.examId, exams.id))
		.where(
			and(
				eq(exams.id, examId),
				eq(announcedExamGrades.classroomId, student.classroomId),
				eq(announcedExams.openStatus, true),
			),
		)
		.get();

	if (!examRecord) {
		throw notFoundError("Exam not found.");
	}

	return {
		student,
		exam: {
			...examRecord.exams,
			scheduledDate: examRecord.announced_exams.scheduledDate,
			startTime: examRecord.announced_exams.startTime,
			openStatus: examRecord.announced_exams.openStatus,
		},
	};
}

export async function loadQuestionsWithChoices(
	context: GraphQLContext,
	examId: string,
) {
	const examQuestions = await context.db
		.select()
		.from(questions)
		.where(eq(questions.examId, examId))
		.all();

	const sortedQuestions = [...examQuestions].sort(
		(left, right) => left.indexOnExam - right.indexOnExam,
	);

	if (sortedQuestions.length === 0) {
		return [];
	}

	const questionIds = sortedQuestions.map((question) => question.id);
	const mediaColumnsSupported = await supportsChoiceMediaColumns(context);
	const questionChoices = mediaColumnsSupported
		? await context.db
				.select()
				.from(choices)
				.where(inArray(choices.questionId, questionIds))
				.all()
		: (
				await context.db
					.select()
					.from(legacyChoices)
					.where(inArray(legacyChoices.questionId, questionIds))
					.all()
			).map((choice) => ({
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
