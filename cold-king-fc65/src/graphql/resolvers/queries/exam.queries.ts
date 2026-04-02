import { and, eq, inArray } from 'drizzle-orm';
import { GraphQLContext } from '../../../server';
import { classrooms } from '../../../db/schemas/classroom.schema';
import { exams } from '../../../db/schemas/exam.schema';
import { questions } from '../../../db/schemas/question.schema';
import { studentExamAnswers } from '../../../db/schemas/student-exam-answer.schema';
import { studentExamSubmissions } from '../../../db/schemas/student-exam-submission.schema';
import { students } from '../../../db/schemas/student.schema';
import { loadQuestionsWithChoices } from '../student-exam.helpers';
import { generateIncorrectAnswerExplanation } from '../ai-explanation';
import { getTeacherExam, getTeacherStudentSubmission, requireTeacherId } from '../teacher-exam.helpers';
import { announcedExamGrades } from '../../../db/schemas/announcedExamGrades.schema';
import { announcedExams } from '../../../db/schemas/announcedExams.schema';

async function getExamAnnouncementMetadata(context: GraphQLContext, examId: string) {
	return context.db
		.select()
		.from(announcedExams)
		.leftJoin(announcedExamGrades, eq(announcedExamGrades.announcedExamId, announcedExams.id))
		.leftJoin(classrooms, eq(classrooms.id, announcedExamGrades.classroomId))
		.where(eq(announcedExams.examId, examId))
		.get();
}

function getAnnouncementSortValue(record: {
	scheduledDate?: string | null;
	startTime?: string | null;
}) {
	return `${record.scheduledDate ?? ""}T${record.startTime ?? ""}`;
}

export const examQuery = {
	Exam: {
		questionCount: async (exam: { id: string }, _args: unknown, context: GraphQLContext) => {
			const questions = await loadQuestionsWithChoices(context, exam.id);
			return questions.length;
		},
		openStatus: async (exam: { id: string; openStatus?: boolean | null }, _args: unknown, context: GraphQLContext) => {
			if (typeof exam.openStatus === 'boolean') {
				return exam.openStatus;
			}

			const metadata = await getExamAnnouncementMetadata(context, exam.id);
			return metadata?.announced_exams.openStatus ?? null;
		},
		classroomName: async (exam: { id: string; classroomName?: string | null }, _args: unknown, context: GraphQLContext) => {
			if ('classroomName' in exam) {
				return exam.classroomName ?? null;
			}

			const metadata = await getExamAnnouncementMetadata(context, exam.id);
			return metadata?.classrooms?.className ?? null;
		},
		scheduledDate: async (exam: { id: string; scheduledDate?: string | null }, _args: unknown, context: GraphQLContext) => {
			if ('scheduledDate' in exam) {
				return exam.scheduledDate ?? null;
			}

			const metadata = await getExamAnnouncementMetadata(context, exam.id);
			return metadata?.announced_exams.scheduledDate ?? null;
		},
		startTime: async (exam: { id: string; startTime?: string | null }, _args: unknown, context: GraphQLContext) => {
			if ('startTime' in exam) {
				return exam.startTime ?? null;
			}

			const metadata = await getExamAnnouncementMetadata(context, exam.id);
			return metadata?.announced_exams.startTime ?? null;
		},
	},
	Query: {
		examById: async (
			_: any,
			args: {
				examId: string;
			},
			context: GraphQLContext,
		) => {
			return context.db.select().from(exams).where(eq(exams.id, args.examId)).get();
		},
		myExams: async (_: unknown, _args: unknown, context: GraphQLContext) => {
			const teacherId = await requireTeacherId(context);
			const teacherExams = await context.db
				.select()
				.from(exams)
				.where(eq(exams.createdBy, teacherId))
				.all();

			if (teacherExams.length === 0) {
				return [];
			}

			const examIds = teacherExams.map((exam) => exam.id);
			const examQuestions = await context.db
				.select({
					examId: questions.examId,
				})
				.from(questions)
				.where(inArray(questions.examId, examIds))
				.all();
			const questionCountByExamId = new Map<string, number>();

			for (const question of examQuestions) {
				questionCountByExamId.set(
					question.examId,
					(questionCountByExamId.get(question.examId) ?? 0) + 1,
				);
			}

			const announcements = await context.db
				.select()
				.from(announcedExams)
				.leftJoin(
					announcedExamGrades,
					eq(announcedExamGrades.announcedExamId, announcedExams.id),
				)
				.leftJoin(classrooms, eq(classrooms.id, announcedExamGrades.classroomId))
				.where(inArray(announcedExams.examId, examIds))
				.all();
			const latestAnnouncementByExamId = new Map<
				string,
				{
					openStatus: boolean;
					scheduledDate: string | null;
					startTime: string | null;
					classroomName: string | null;
				}
			>();

			for (const { announced_exams, classrooms } of announcements) {
				const candidate = {
					openStatus: announced_exams.openStatus,
					scheduledDate: announced_exams.scheduledDate,
					startTime: announced_exams.startTime,
					classroomName: classrooms?.className ?? null,
				};
				const existing = latestAnnouncementByExamId.get(announced_exams.examId);

				if (
					!existing ||
					getAnnouncementSortValue(candidate) > getAnnouncementSortValue(existing)
				) {
					latestAnnouncementByExamId.set(announced_exams.examId, candidate);
				}
			}

			return teacherExams.map((exam) => {
				const announcement = latestAnnouncementByExamId.get(exam.id);

				return {
					...exam,
					questionCount: questionCountByExamId.get(exam.id) ?? 0,
					openStatus: announcement?.openStatus ?? null,
					classroomName: announcement?.classroomName ?? null,
					scheduledDate: announcement?.scheduledDate ?? null,
					startTime: announcement?.startTime ?? null,
				};
			});
		},
		teacherScheduledExams: async (_: unknown, _args: unknown, context: GraphQLContext) => {
			const teacherId = await requireTeacherId(context);
			const scheduledExams = await context.db
				.select()
				.from(announcedExams)
				.innerJoin(exams, eq(announcedExams.examId, exams.id))
				.leftJoin(announcedExamGrades, eq(announcedExamGrades.announcedExamId, announcedExams.id))
				.leftJoin(classrooms, eq(classrooms.id, announcedExamGrades.classroomId))
				.where(eq(announcedExams.createdBy, teacherId))
				.all();

			const uniqueExams = new Map<string, (typeof scheduledExams)[number]["exams"] & {
				openStatus: boolean;
				scheduledDate: string | null;
				startTime: string | null;
				classroomName: string | null;
			}>();

			for (const { exams: exam, announced_exams, classrooms } of scheduledExams) {
				const candidate = {
					...exam,
					openStatus: announced_exams.openStatus,
					scheduledDate: announced_exams.scheduledDate,
					startTime: announced_exams.startTime,
					classroomName: classrooms?.className ?? null,
				};
				const existing = uniqueExams.get(exam.id);

				if (
					!existing ||
					getAnnouncementSortValue(candidate) > getAnnouncementSortValue(existing)
				) {
					uniqueExams.set(exam.id, candidate);
				}
			}

			return [...uniqueExams.values()];

		},
		teacherAnalyticsExams: async (_: unknown, _args: unknown, context: GraphQLContext) => {
			const teacherId = await requireTeacherId(context);
			const scheduledExams = await context.db
				.select()
				.from(announcedExams)
				.innerJoin(exams, eq(announcedExams.examId, exams.id))
				.leftJoin(announcedExamGrades, eq(announcedExamGrades.announcedExamId, announcedExams.id))
				.leftJoin(classrooms, eq(classrooms.id, announcedExamGrades.classroomId))
				.where(eq(announcedExams.createdBy, teacherId))
				.all();

			const uniqueExams = new Map<string, (typeof scheduledExams)[number]["exams"] & {
				openStatus: boolean;
				scheduledDate: string | null;
				startTime: string | null;
				classroomName: string | null;
			}>();

			for (const { exams: exam, announced_exams } of scheduledExams) {
				const candidate = {
					...exam,
					openStatus: announced_exams.openStatus,
					scheduledDate: announced_exams.scheduledDate,
					startTime: announced_exams.startTime,
					classroomName: null,
				};
				const existing = uniqueExams.get(exam.id);

				if (
					!existing ||
					getAnnouncementSortValue(candidate) > getAnnouncementSortValue(existing)
				) {
					uniqueExams.set(exam.id, candidate);
				}
			}

			return [...uniqueExams.values()];
		},
		teacherExamDetail: async (_: unknown, args: { examId: string }, context: GraphQLContext) => {
			const exam = await getTeacherExam(context, args.examId);
			const questions = await loadQuestionsWithChoices(context, exam.id);

			return {
				exam,
				questions: questions.map((question) => ({
					id: question.id,
					type: question.type,
					question: question.question,
					order: question.order,
					imageUrl: question.imageUrl,
					videoUrl: question.videoUrl,
					correctChoiceId: question.type === 'mcq' ? (question.choices.find((choice) => choice.isCorrect)?.id ?? null) : null,
					choices: question.choices.map((choice) => ({
						id: choice.id,
						label: choice.label,
						text: choice.text,
						imageUrl: choice.imageUrl,
						videoUrl: choice.videoUrl,
						isCorrect: choice.isCorrect,
					})),
				})),
			};
		},
		teacherExamAnalytics: async (_: unknown, args: { examId: string }, context: GraphQLContext) => {
			const exam = await getTeacherExam(context, args.examId);
			const questions = await loadQuestionsWithChoices(context, exam.id);
			const submissions = await context.db.select().from(studentExamSubmissions).where(eq(studentExamSubmissions.examId, exam.id)).all();
			const submissionIds = submissions.map((submission) => submission.id);
			const answerRows =
				submissionIds.length > 0
					? await context.db
						.select()
						.from(studentExamAnswers)
						.where(inArray(studentExamAnswers.submissionId, submissionIds))
						.all()
					: [];

			const studentResults = await Promise.all(
				submissions.map(async (submission) => {
					const studentRecord = await context.db.select().from(students).where(eq(students.id, submission.studentId)).get();

					if (!studentRecord) {
						throw new Error('Student not found for submission.');
					}

					const percent = submission.totalQuestions > 0 ? Math.round((submission.correctAnswers / submission.totalQuestions) * 100) : 0;

					return {
						id: submission.id,
						studentId: studentRecord.id,
						name: `${studentRecord.lastName} ${studentRecord.firstName}`,
						section: studentRecord.className,
						score: `${submission.correctAnswers}/${submission.totalQuestions}`,
						percent,
						submittedAt: submission.submittedAt,
						durationMinutes: Math.max(1, Math.round((submission.submittedAt - submission.startedAt) / 60000)),
						reasonForTermination: submission.reasonForTermination ?? null,
					};
				}),
			);

			const questionInsights = questions.map((question) => {
				const questionAnswers = answerRows.filter(
					(answer) => answer.questionId === question.id,
				);
				const submissionCount = submissions.length;

				if (question.type !== 'mcq') {
					const pendingReviewCount = questionAnswers.filter((answer) =>
						Boolean(answer.answerText?.trim()),
					).length;

					return {
						questionId: question.id,
						order: question.order,
						question: question.question,
						type: question.type,
						submissionCount,
						correctCount: 0,
						incorrectCount: 0,
						unansweredCount: Math.max(submissionCount - pendingReviewCount, 0),
						pendingReviewCount,
						wrongRate: null,
					};
				}

				const correctCount = questionAnswers.filter((answer) => answer.isCorrect).length;
				const incorrectCount = questionAnswers.filter(
					(answer) => Boolean(answer.selectedChoiceId) && !answer.isCorrect,
				).length;
				const unansweredCount = Math.max(
					submissionCount - correctCount - incorrectCount,
					0,
				);

				return {
					questionId: question.id,
					order: question.order,
					question: question.question,
					type: question.type,
					submissionCount,
					correctCount,
					incorrectCount,
					unansweredCount,
					pendingReviewCount: 0,
					wrongRate:
						submissionCount > 0
							? Math.round((incorrectCount / submissionCount) * 100)
							: 0,
				};
			});

			return {
				exam,
				totalStudents: studentResults.length,
				students: studentResults,
				questionInsights,
			};
		},
		teacherStudentSubmissionDetail: async (
			_: unknown,
			args: {
				examId: string;
				studentId: string;
			},
			context: GraphQLContext,
		) => {
			const { exam, student, submission } = await getTeacherStudentSubmission(context, args.examId, args.studentId);
			const questions = await loadQuestionsWithChoices(context, exam.id);
			const answerRows = await context.db.select().from(studentExamAnswers).where(eq(studentExamAnswers.submissionId, submission.id)).all();
			const percent = submission.totalQuestions > 0 ? Math.round((submission.correctAnswers / submission.totalQuestions) * 100) : 0;

			return {
				exam,
				studentId: student.id,
				studentName: `${student.lastName} ${student.firstName}`,
				section: student.className,
				score: `${submission.correctAnswers}/${submission.totalQuestions}`,
				percent,
				durationMinutes: Math.max(1, Math.round((submission.submittedAt - submission.startedAt) / 60000)),
				startedAt: submission.startedAt,
				submittedAt: submission.submittedAt,
				reasonForTermination: submission.reasonForTermination ?? null,
				answers: await Promise.all(questions.map(async (question) => {
					const answer = answerRows.find((row) => row.questionId === question.id);
					const correctChoiceId = question.type === 'mcq' ? (question.choices.find((choice) => choice.isCorrect)?.id ?? null) : null;
					const correctAnswerText =
						question.type !== 'mcq'
							? (question.choices.find((choice) => choice.isCorrect)?.text ?? null)
							: null;
					const selectedChoiceText =
						question.type === 'mcq'
							? (question.choices.find((choice) => choice.id === answer?.selectedChoiceId)?.text ?? null)
							: answer?.answerText ?? null;
					const shouldGenerateExplanation =
						question.type === 'mcq' && Boolean(correctChoiceId) && answer?.isCorrect === false;
					const aiExplanation = shouldGenerateExplanation
						? await generateIncorrectAnswerExplanation(context, {
							question: question.question,
							correctAnswer:
								question.choices.find((choice) => choice.id === correctChoiceId)?.text ?? 'Зөв хариулт олдсонгүй.',
							studentAnswer: selectedChoiceText,
						})
						: null;

					return {
						questionId: question.id,
						order: question.order,
						question: question.question,
						type: question.type,
						submittedText: answer?.answerText ?? null,
						correctAnswerText,
						aiExplanation,
						selectedChoiceId: answer?.selectedChoiceId ?? null,
						correctChoiceId,
						isCorrect: question.type === 'mcq' ? (answer?.isCorrect ?? false) : null,
						choices: question.choices.map((choice) => ({
							id: choice.id,
							label: choice.label,
							text: choice.text,
							isCorrect: choice.isCorrect,
						})),
					};
				})),
			};
		},
	},
};
