import { students } from "../../../db/schemas/student.schema";
import type { GraphQLContext } from "../../../server";

export const studentMutation = {
	Mutation: {
		upsertStudent: async (
			_: unknown,
			args: {
				input: {
					fullName: string;
					email: string;
					phone: string;
				};
			},
			context: GraphQLContext
		) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			const inserted = await context.db
				.insert(students)
				.values({
					id: context.auth.userId,
					fullName: args.input.fullName,
					email: args.input.email,
					phone: args.input.phone,
				})
				.onConflictDoUpdate({
					target: students.id,
					set: {
						fullName: args.input.fullName,
						email: args.input.email,
						phone: args.input.phone,
					},
				}).returning().get()

			console.log("INSERTED:", inserted);

			return inserted
		},
	},
};
