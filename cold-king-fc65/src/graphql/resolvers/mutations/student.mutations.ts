import { classrooms } from "../../../db/schemas/classroom.schema";
import { students } from "../../../db/schemas/student.schema";
import { eq } from "drizzle-orm";
import type { GraphQLContext } from "../../../server";

function deriveGradeFromClassName(value: string) {
	const trimmed = value.trim();
	const match = trimmed.match(/^(\d{1,2})/);
	return match ? match[1] : trimmed;
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
					school: string;
					grade: string;
					className: string;
					inviteCode: string;
				};
			},
			context: GraphQLContext
		) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			const userId = context.auth.userId;
			const values = {
				fullName: args.input.fullName,
				email: args.input.email,
				phone: args.input.phone,
				school: args.input.school,
				grade: args.input.grade,
				className: args.input.className,
				inviteCode: args.input.inviteCode,
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
		registerStudentByClassCode: async (
			_: unknown,
			args: {
				input: {
					fullName: string;
					email: string;
					phone: string;
					inviteCode: string;
				};
			},
			context: GraphQLContext,
		) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			const userId = context.auth.userId;
			const normalizedInviteCode = args.input.inviteCode.trim().toUpperCase();
			const classroom = await context.db
				.select()
				.from(classrooms)
				.where(eq(classrooms.classCode, normalizedInviteCode))
				.get();

			if (!classroom) {
				throw new Error("Invalid class code.");
			}

			const values = {
				fullName: args.input.fullName.trim(),
				email: args.input.email.trim(),
				phone: args.input.phone.trim(),
				school: classroom.school,
				grade: deriveGradeFromClassName(classroom.className),
				className: classroom.className,
				inviteCode: normalizedInviteCode,
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
