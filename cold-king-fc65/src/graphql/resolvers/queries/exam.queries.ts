import { and, eq } from 'drizzle-orm';
import { GraphQLContext } from '../../../server';
import { exams } from '../../../db/schemas/exam.schema';
import { studentExamAnswers } from '../../../db/schemas/student-exam-answer.schema';
import { studentExamSubmissions } from '../../../db/schemas/student-exam-submission.schema';
import { students } from '../../../db/schemas/student.schema';
import { loadQuestionsWithChoices } from '../student-exam.helpers';
import { getClassroomName, getTeacherExam, getTeacherStudentSubmission, requireTeacherId } from '../teacher-exam.helpers';
import { announcedExams } from '../../../db/schemas/announcedExams.schema';

export const examQuery = {
	Exam: {
		questionCount: async (exam: { id: string }, _args: unknown, context: GraphQLContext) => {
			const questions = await loadQuestionsWithChoices(context, exam.id);
			return questions.length;
		},
		classroomName: async (exam: { classroomId?: string | null }, _args: unknown, context: GraphQLContext) => {
			return getClassroomName(context, exam.classroomId ?? null);
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

			return context.db.select().from(exams).where(eq(exams.createdBy, teacherId)).all();
		},
		teacherScheduledExams: async (_: unknown, _args: unknown, context: GraphQLContext) => {
			const teacherId = await requireTeacherId(context);
			return await context.db.select().from(announcedExams).where(eq(announcedExams.createdBy, teacherId)).all();

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
					correctChoiceId: question.type === 'mcq' ? (question.choices.find((choice) => choice.isCorrect)?.id ?? null) : null,
					choices: question.choices.map((choice) => ({
						id: choice.id,
						label: choice.label,
						text: choice.text,
						isCorrect: choice.isCorrect,
					})),
				})),
			};
		},
		teacherExamAnalytics: async (_: unknown, args: { examId: string }, context: GraphQLContext) => {
			const exam = await getTeacherExam(context, args.examId);
			const submissions = await context.db.select().from(studentExamSubmissions).where(eq(studentExamSubmissions.examId, exam.id)).all();

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
					};
				}),
			);

			return {
				exam,
				totalStudents: studentResults.length,
				students: studentResults,
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
				answers: questions.map((question) => {
					const answer = answerRows.find((row) => row.questionId === question.id);
					const correctChoiceId = question.type === 'mcq' ? (question.choices.find((choice) => choice.isCorrect)?.id ?? null) : null;

					return {
						questionId: question.id,
						order: question.order,
						question: question.question,
						type: question.type,
						submittedText: answer?.answerText ?? null,
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
				}),
			};
		},
	},
};
