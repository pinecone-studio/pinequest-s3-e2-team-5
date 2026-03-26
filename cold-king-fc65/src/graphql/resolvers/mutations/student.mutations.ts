import { classrooms } from "../../../db/schemas/classroom.schema";
import { students } from "../../../db/schemas/student.schema";
import { eq } from "drizzle-orm";
import type { GraphQLContext } from "../../../server";

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
						fullName: string;
						email: string;
						phone: string;
						inviteCode: string;
					};
				},
			context: GraphQLContext
		) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			const userId = context.auth.userId;
			const normalizedCode = args.input.inviteCode.trim().toUpperCase();
			const classroom = await context.db
				.select()
				.from(classrooms)
				.where(eq(classrooms.classCode, normalizedCode))
				.get();

			if (!classroom) {
				throw new Error("Invalid class code.");
			}

			const values = {
				fullName: args.input.fullName,
				email: args.input.email,
				phone: args.input.phone,
				school: classroom.schoolName,
				grade: getGradeFromClassName(classroom.className),
				className: classroom.className,
				inviteCode: classroom.classCode,
				classroomId: classroom.id,
				teacherId: classroom.teacherId,
			};

			const existing = await context.db
				.select({ id: students.id })
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

			return context.db
				.insert(students)
				.values({
					id: userId,
					...values,
				})
				.returning()
				.get();
		},
	},
};
