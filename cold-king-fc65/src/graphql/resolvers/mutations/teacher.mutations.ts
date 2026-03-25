import { teachers } from "../../../db/schemas/teacher.schema";
import { eq } from "drizzle-orm";
import type { GraphQLContext } from "../../../server";

export const teacherMutation = {
	Mutation: {
		upsertTeacher: async (
			_: unknown,
			args: {
				input: {
					fullName: string;
					email: string;
					phone: string;
					school: string;
					subject: string;
				};
			},
			context: GraphQLContext,
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
				subject: args.input.subject,
			};

			const existing = await context.db
				.select({ id: teachers.id })
				.from(teachers)
				.where(eq(teachers.id, userId))
				.get();

			if (existing) {
				return context.db
					.update(teachers)
					.set(values)
					.where(eq(teachers.id, userId))
					.returning()
					.get();
			}

			return context.db
				.insert(teachers)
				.values({
					id: userId,
					...values,
				})
				.returning()
				.get();
		},
	},
};
