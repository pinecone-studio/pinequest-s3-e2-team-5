import { classrooms } from "../../../db/schemas/classroom.schema";
import { studentExamAnswers } from "../../../db/schemas/student-exam-answer.schema";
import { studentExamSubmissions } from "../../../db/schemas/student-exam-submission.schema";
import { students } from "../../../db/schemas/student.schema";
import { and, eq } from "drizzle-orm";
import type { GraphQLContext } from "../../../server";
import {
	getAccessibleExamForStudent,
	loadQuestionsWithChoices,
	requireStudentRecord,
} from "../student-exam.helpers";
import { assertAuthenticated, badUserInputError } from "../../errors";

function getGradeFromClassName(className: string) {
	const match = className.match(/^(\d{1,2})/);
	return match ? match[1] : className;
}

export const studentMutation = {
	Mutation: {
		upsertStudent: async (
			_: unknown,
			args: {
				input: {
					firstName: string;
					lastName: string;
					email: string;
					phone: string;
					inviteCode: string;
				};
			},
			context: GraphQLContext
		) => {
			const userId = assertAuthenticated(context);
			const normalizedCode = args.input.inviteCode.trim().toUpperCase();
			const normalizedEmail = args.input.email.trim().toLowerCase();
			const classroom = await context.db
				.select()
				.from(classrooms)
				.where(eq(classrooms.classCode, normalizedCode))
				.get();

			if (!classroom) {
				throw badUserInputError("Invalid class code.");
			}

			const values = {
				firstName: args.input.firstName,
				lastName: args.input.lastName,
				email: normalizedEmail,
				phone: args.input.phone,
				grade: getGradeFromClassName(classroom.className),
				className: classroom.className,
				inviteCode: classroom.classCode,
				classroomId: classroom.id,
				teacherId: classroom.teacherId,
			};

			const existing = await context.db
				.select({ id: students.id, email: students.email })
				.from(students)
				.where(eq(students.id, userId))
				.get();

			if (existing) {
				return context.db
					.update(students)
					.set(values)
					.where(eq(students.id, userId))
					.returning()
					.get();
			}

			const existingByEmail = await context.db
				.select({ id: students.id })
				.from(students)
				.where(eq(students.email, normalizedEmail))
				.get();

			if (existingByEmail) {
				return context.db
					.update(students)
					.set({
						id: userId,
						...values,
					})
					.where(eq(students.id, existingByEmail.id))
					.returning()
					.get();
			}

			return context.db
				.insert(students)
				.values({
					id: userId,
					...values,
				})
				.returning()
				.get();
		},
		changeStudentClassroom: async (
			_: unknown,
			args: {
				input: {
					inviteCode: string;
				};
			},
			context: GraphQLContext,
		) => {
			const student = await requireStudentRecord(context);
			const normalizedCode = args.input.inviteCode.trim().toUpperCase();
			const classroom = await context.db
				.select()
				.from(classrooms)
				.where(eq(classrooms.classCode, normalizedCode))
				.get();

			if (!classroom) {
				throw badUserInputError("Invalid class code.");
			}

			return context.db
				.update(students)
				.set({
					grade: getGradeFromClassName(classroom.className),
					className: classroom.className,
					inviteCode: classroom.classCode,
					classroomId: classroom.id,
					teacherId: classroom.teacherId,
				})
				.where(eq(students.id, student.id))
				.returning()
				.get();
		},
		submitStudentExam: async (
			_: unknown,
			args: {
					input: {
						examId: string;
						startedAt?: number | null;
						answers: {
							questionId: string;
							selectedChoiceId?: string | null;
							answerText?: string | null;
					}[];
				};
			},
			context: GraphQLContext,
		) => {
			const { student, exam } = await getAccessibleExamForStudent(
				context,
				args.input.examId,
			);
			const existingSubmission = await context.db
				.select({ id: studentExamSubmissions.id })
				.from(studentExamSubmissions)
				.where(
					and(
						eq(studentExamSubmissions.studentId, student.id),
						eq(studentExamSubmissions.examId, exam.id),
					),
				)
				.get();

			if (existingSubmission) {
				throw new Error("This exam has already been submitted.");
			}

			const examQuestions = await loadQuestionsWithChoices(context, exam.id);
			if (examQuestions.length === 0) {
				throw new Error("This exam has no questions yet.");
			}

			const inputAnswers = new Map(
				args.input.answers.map((answer) => [answer.questionId, answer]),
			);
			let correctAnswers = 0;

			const submissionId = crypto.randomUUID();
			const startedAt = args.input.startedAt ?? Date.now();
			const submittedAt = Date.now();

			const answerRows = examQuestions.map((question) => {
				const inputAnswer = inputAnswers.get(question.id);
				const selectedChoiceId = inputAnswer?.selectedChoiceId ?? null;
				const trimmedAnswerText = inputAnswer?.answerText?.trim() || null;

				if (
					selectedChoiceId &&
					!question.choices.some((choice) => choice.id === selectedChoiceId)
				) {
					throw new Error("One of the selected answers is invalid.");
				}

				const correctChoiceId =
					question.type === "mcq"
						? question.choices.find((choice) => choice.isCorrect)?.id ?? null
						: null;
				const isCorrect =
					question.type === "mcq" &&
					Boolean(selectedChoiceId && correctChoiceId === selectedChoiceId);

				if (isCorrect) {
					correctAnswers += 1;
				}

				return {
					id: crypto.randomUUID(),
					submissionId,
					questionId: question.id,
					selectedChoiceId,
					answerText: trimmedAnswerText,
					isCorrect,
				};
			});

			const totalQuestions = examQuestions.length;
			const scorePercent =
				totalQuestions > 0
					? Math.round((correctAnswers / totalQuestions) * 100)
					: 0;

			await context.db.insert(studentExamSubmissions).values({
				id: submissionId,
				studentId: student.id,
				examId: exam.id,
				startedAt,
				submittedAt,
				totalQuestions,
				correctAnswers,
				scorePercent,
			});

			await context.db.insert(studentExamAnswers).values(answerRows);

			return {
				id: submissionId,
				examId: exam.id,
				title: exam.title,
				subject: exam.subject,
				grade: exam.grade,
				duration: exam.duration,
				questionCount: totalQuestions,
				correctAnswers,
				scorePercent,
				submittedAt,
			};
		},
	},
};
