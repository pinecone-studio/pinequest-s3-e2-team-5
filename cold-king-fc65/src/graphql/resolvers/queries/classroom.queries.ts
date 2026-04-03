import { and, count, desc, eq, inArray } from "drizzle-orm"
import { exams } from "../../../db/schemas/exam.schema";
import { classrooms } from "../../../db/schemas/classroom.schema"
import { studentExamSubmissions } from "../../../db/schemas/student-exam-submission.schema";
import { students } from "../../../db/schemas/student.schema";
import { GraphQLContext } from "../../../server"
import { assertAuthenticated, notFoundError } from "../../errors";
import { announcedExamGrades } from "../../../db/schemas/announcedExamGrades.schema";

function formatStudentListName(firstName: string, lastName: string) {
	const normalizedFirstName = firstName.trim();
	const normalizedLastName = lastName.trim();

	if (normalizedLastName) {
		return `${normalizedLastName.charAt(0)}.${normalizedFirstName}`;
	}

	return normalizedFirstName;
}

export const classRoomQuery = {
	Query: {
		classroomsByTeacher: async (
			_: unknown,
			_args: unknown,
			context: GraphQLContext
		) => {
			const userId = assertAuthenticated(context);

			return context.db
				.select()
				.from(classrooms)
				.where(eq(classrooms.teacherId, userId))
				.all();
		},
		teacherClassroomDetail: async (
			_: unknown,
			args: { classroomId: string },
			context: GraphQLContext
		) => {
			const teacherId = assertAuthenticated(context);
			const classroom = await context.db
				.select()
				.from(classrooms)
				.where(
					and(
						eq(classrooms.id, args.classroomId),
						eq(classrooms.teacherId, teacherId)
					)
				)
				.get();

			if (!classroom) {
				throw notFoundError("Classroom not found.");
			}

			const classroomStudents = await context.db
				.select()
				.from(students)
				.where(eq(students.classroomId, classroom.id))
				.all();

			const classroomExams = await context.db
				.select()
				.from(announcedExamGrades)
				.where(eq(announcedExamGrades.classroomId, classroom.id))
				.all();

			const examIds = classroomExams.map((exam) => exam.id);
			const classroomSubmissions = examIds.length
				? await context.db
						.select()
						.from(studentExamSubmissions)
						.where(inArray(studentExamSubmissions.examId, examIds))
						.orderBy(desc(studentExamSubmissions.submittedAt))
						.all()
				: [];

			const latestSubmissionByStudent = new Map<
				string,
				(typeof classroomSubmissions)[number]
			>();

			for (const submission of classroomSubmissions) {
				if (!latestSubmissionByStudent.has(submission.studentId)) {
					latestSubmissionByStudent.set(submission.studentId, submission);
				}
			}

			const submittedPercents = Array.from(latestSubmissionByStudent.values()).map(
				(submission) => submission.scorePercent
			);

			const averagePercent = submittedPercents.length
				? Math.round(
						submittedPercents.reduce((sum, value) => sum + value, 0) /
							submittedPercents.length
					)
				: 0;

			return {
				classroom,
				examCount: classroomExams.length,
				averagePercent,
				students: classroomStudents.map((student) => {
					const latestSubmission = latestSubmissionByStudent.get(student.id);
					const durationMinutes = latestSubmission
						? Math.max(
								1,
								Math.round(
									(latestSubmission.submittedAt - latestSubmission.startedAt) /
										60000
								)
							)
						: null;

						return {
							id: student.id,
							studentId: student.id,
							name: formatStudentListName(student.firstName, student.lastName),
							score: latestSubmission
								? `${latestSubmission.correctAnswers}/${latestSubmission.totalQuestions}`
								: null,
							percent: latestSubmission?.scorePercent ?? null,
							durationMinutes,
							submittedAt: latestSubmission?.submittedAt ?? null,
							hasIntegrityViolation: Boolean(latestSubmission?.integrityReason),
							integrityReason: latestSubmission?.integrityReason ?? null,
							integrityMessage: latestSubmission?.integrityMessage ?? null,
						};
					}),
				};
		},
	},
	Classroom: {
		studentCount: async (
			classroom: { id: string },
			_args: unknown,
			context: GraphQLContext
		) => {
			const studentCountResult = await context.db
				.select({ value: count() })
				.from(students)
				.where(eq(students.classroomId, classroom.id))
				.get();

			return studentCountResult?.value ?? 0;
		},
	},
}
