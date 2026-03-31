import { and, eq } from 'drizzle-orm';
import { exams } from '../../../db/schemas/exam.schema';
import { studentExamAnswers } from '../../../db/schemas/student-exam-answer.schema';
import { studentExamSubmissions } from '../../../db/schemas/student-exam-submission.schema';
import { students } from '../../../db/schemas/student.schema';
import type { GraphQLContext } from '../../../server';
import {
	getAccessibleExamForStudent,
	isExamOpenNow,
	loadQuestionsWithChoices,
	requireStudentRecord,
} from '../student-exam.helpers';
import { announcedExamGrades } from '../../../db/schemas/announcedExamGrades.schema';
import { announcedExams } from '../../../db/schemas/announcedExams.schema';
import { notFoundError } from '../../errors';

export const studentQuery = {
	Query: {
		studentById: async (_: unknown, args: { id?: string | null }, context: GraphQLContext) => {
			const currentStudent = await requireStudentRecord(context);

			if (!args.id || args.id === currentStudent.id) {
				return currentStudent;
			}

			throw notFoundError("Student not found.");
		},
		availableExamsForStudent: async (_: unknown, _args: unknown, context: GraphQLContext) => {
			const student = await requireStudentRecord(context);
			const availableAnnouncements = await context.db
				.select()
				.from(announcedExamGrades)
				.innerJoin(announcedExams, eq(announcedExamGrades.announcedExamId, announcedExams.id))
				.innerJoin(exams, eq(announcedExams.examId, exams.id))
				.where(eq(announcedExamGrades.classroomId, student.classroomId))
				.all();

			const submissions = await context.db
				.select()
				.from(studentExamSubmissions)
				.where(eq(studentExamSubmissions.studentId, student.id))
				.all();
			const submittedExamIds = new Set(submissions.map((submission) => submission.examId));

			const examSummaries = await Promise.all(
				availableAnnouncements
					.filter(
						({ announced_exams, exams }) =>
							!submittedExamIds.has(exams.id) &&
							isExamOpenNow({
								openStatus: announced_exams.openStatus,
								scheduledDate: announced_exams.scheduledDate,
								startTime: announced_exams.startTime,
								duration: exams.duration,
							}),
					)
					.map(async ({ exams: exam, announced_exams }) => {
						const questionCount = (await loadQuestionsWithChoices(context, exam.id)).length;

						return {
							id: announced_exams.id,
							examId: exam.id,
							title: exam.title,
							subject: exam.subject,
							description: exam.description,
							grade: exam.grade,
							scheduledDate: announced_exams.scheduledDate,
							startTime: announced_exams.startTime,
							duration: exam.duration,
							questionCount,
						};
					}),
			);

			return examSummaries;
		},
		studentExamDetail: async (_: unknown, args: { examId: string }, context: GraphQLContext) => {
			const { exam } = await getAccessibleExamForStudent(context, args.examId);
			const examQuestions = await loadQuestionsWithChoices(context, exam.id);

			return {
				id: exam.announcedExamId,
				title: exam.title,
				subject: exam.subject,
				description: exam.description,
				grade: exam.grade,
				duration: exam.duration,
				scheduledDate: exam.scheduledDate,
				startTime: exam.startTime,
				questionCount: examQuestions.length,
				questions: examQuestions.map((question) => ({
					id: question.id,
					type: question.type,
					question: question.question,
					order: question.order,
					imageUrl: question.imageUrl,
					videoUrl: question.videoUrl,
					topic: question.topic,
					difficulty: question.difficulty,
					choices: question.choices.map((choice) => ({
						id: choice.id,
						label: choice.label,
						text: choice.text,
					})),
				})),
			};
		},
		myExamSubmissions: async (_: unknown, _args: unknown, context: GraphQLContext) => {
			const student = await requireStudentRecord(context);
			const submissions = await context.db
				.select()
				.from(studentExamSubmissions)
				.where(eq(studentExamSubmissions.studentId, student.id))
				.all();

			const orderedSubmissions = [...submissions].sort((left, right) => right.submittedAt - left.submittedAt);

			return Promise.all(
				orderedSubmissions.map(async (submission) => {
					const exam = await context.db.select().from(exams).where(eq(exams.id, submission.examId)).get();

					if (!exam) {
						throw new Error('Exam not found for submission.');
					}

					return {
						id: submission.id,
						examId: submission.examId,
						title: exam.title,
						subject: exam.subject,
						grade: exam.grade,
						duration: exam.duration,
						questionCount: submission.totalQuestions,
						correctAnswers: submission.correctAnswers,
						scorePercent: submission.scorePercent,
						submittedAt: submission.submittedAt,
					};
				}),
			);
		},
		studentExamSubmissionDetail: async (_: unknown, args: { submissionId: string }, context: GraphQLContext) => {
			const student = await requireStudentRecord(context);
			const submission = await context.db
				.select()
				.from(studentExamSubmissions)
				.where(and(eq(studentExamSubmissions.id, args.submissionId), eq(studentExamSubmissions.studentId, student.id)))
				.get();

			if (!submission) {
				throw new Error('Submission not found.');
			}

			const examRecord = await context.db
				.select()
				.from(announcedExams)
				.innerJoin(
					announcedExamGrades,
					eq(announcedExamGrades.announcedExamId, announcedExams.id),
				)
				.innerJoin(exams, eq(announcedExams.examId, exams.id))
				.where(
					and(
						eq(exams.id, submission.examId),
						eq(announcedExamGrades.classroomId, student.classroomId),
					),
				)
				.get();

			if (!examRecord) {
				throw new Error('Exam not found for submission.');
			}

			const exam = examRecord.exams;
			const announcedExam = examRecord.announced_exams;
			const examQuestions = await loadQuestionsWithChoices(context, exam.id);
			const answerRows = await context.db.select().from(studentExamAnswers).where(eq(studentExamAnswers.submissionId, submission.id)).all();

			return {
				id: submission.id,
				examId: exam.id,
				title: exam.title,
				subject: exam.subject,
				grade: exam.grade,
				scheduledDate: announcedExam.scheduledDate,
				startTime: announcedExam.startTime,
				duration: exam.duration,
				questionCount: submission.totalQuestions,
				correctAnswers: submission.correctAnswers,
				scorePercent: submission.scorePercent,
				submittedAt: submission.submittedAt,
				answers: examQuestions.map((question) => {
					const answer = answerRows.find((row) => row.questionId === question.id);
					const correctChoiceId = question.type === 'mcq' ? (question.choices.find((choice) => choice.isCorrect)?.id ?? null) : null;

					return {
						questionId: question.id,
						order: question.order,
						question: question.question,
						type: question.type,
						answerText: answer?.answerText ?? null,
						selectedChoiceId: answer?.selectedChoiceId ?? null,
						correctChoiceId,
						isCorrect: question.type === 'mcq' ? (answer?.isCorrect ?? false) : null,
						choices: question.choices.map((choice) => ({
							id: choice.id,
							label: choice.label,
							text: choice.text,
						})),
					};
				}),
			};
		},
	},
};
