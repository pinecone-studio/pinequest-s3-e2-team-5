import { and, eq, inArray } from "drizzle-orm";
import { choices } from "../../db/schemas/choices.schema";
import { exams } from "../../db/schemas/exam.schema";
import { questions } from "../../db/schemas/question.schema";
import { students } from "../../db/schemas/student.schema";
import type { GraphQLContext } from "../../server";

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
	const exam = await context.db
		.select()
		.from(exams)
		.where(
			and(
				eq(exams.id, examId),
				eq(exams.classroomId, student.classroomId),
				eq(exams.openStatus, true),
			),
		)
		.get();

	if (!exam) {
		throw new Error("Exam not found.");
	}

	return {
		student,
		exam,
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
	const questionChoices = await context.db
		.select()
		.from(choices)
		.where(inArray(choices.questionId, questionIds))
		.all();

	return sortedQuestions.map((question, index) => ({
		...question,
		prompt: question.question,
		order: index + 1,
		choices: questionChoices
			.filter((choice) => choice.questionId === question.id)
			.sort((left, right) => left.label.localeCompare(right.label)),
	}));
}
