import { getDb } from "../../../db/client";
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
			context: {
				env: Env,
				auth: {
					userId: string | null,
					isAuthenticated: boolean
				}
			}
		) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			const db = getDb(context.env.shalgalt_db);

			const inserted = await db
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
