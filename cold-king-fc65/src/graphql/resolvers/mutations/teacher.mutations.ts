import { teachers } from "../../../db/schemas/teacher.schema";
import { eq } from "drizzle-orm";
import type { GraphQLContext } from "../../../server";
import { assertAuthenticated } from "../../errors";

export const teacherMutation = {
	Mutation: {
		upsertTeacher: async (
			_: unknown,
			args: {
				input: {
					firstName: string;
					lastName: string;
					email: string;
					phone: string;
				};
			},
			context: GraphQLContext,
		) => {
			const userId = assertAuthenticated(context);
			const values = {
				firstName: args.input.firstName,
				lastName: args.input.lastName,
				email: args.input.email,
				phone: args.input.phone,
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
