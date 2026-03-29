import { and, eq } from "drizzle-orm";
import { classrooms } from "../../db/schemas/classroom.schema";
import { exams } from "../../db/schemas/exam.schema";
import { studentExamSubmissions } from "../../db/schemas/student-exam-submission.schema";
import { students } from "../../db/schemas/student.schema";
import type { GraphQLContext } from "../../server";
import { notFoundError } from "../errors";

export async function requireTeacherId(context: GraphQLContext) {
	if (!context.auth.userId || !context.auth.isAuthenticated) {
		throw new Error("Unauthorized");
	}

	return context.auth.userId;
}

export async function getTeacherExam(
	context: GraphQLContext,
	examId: string,
) {
	const teacherId = await requireTeacherId(context);
	const exam = await context.db
		.select()
		.from(exams)
		.where(and(eq(exams.id, examId), eq(exams.createdBy, teacherId)))
		.get();

	if (!exam) {
		throw notFoundError("Exam not found.");
	}

	return exam;
}

export async function getClassroomName(
	context: GraphQLContext,
	classroomId: string | null,
) {
	if (!classroomId) {
		return null;
	}

	const classroom = await context.db
		.select()
		.from(classrooms)
		.where(eq(classrooms.id, classroomId))
		.get();

	return classroom?.className ?? null;
}

export async function getTeacherStudentSubmission(
	context: GraphQLContext,
	examId: string,
	studentId: string,
) {
	const exam = await getTeacherExam(context, examId);
	const student = await context.db
		.select()
		.from(students)
		.where(eq(students.id, studentId))
		.get();

	if (!student || student.teacherId !== exam.createdBy) {
		throw notFoundError("Student not found.");
	}

	const submission = await context.db
		.select()
		.from(studentExamSubmissions)
		.where(
			and(
				eq(studentExamSubmissions.examId, exam.id),
				eq(studentExamSubmissions.studentId, student.id),
			),
		)
		.get();

	if (!submission) {
		throw notFoundError("Submission not found.");
	}

	return {
		exam,
		student,
		submission,
	};
}
