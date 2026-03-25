import { eq } from "drizzle-orm";
import { mockSchools } from "../../../config/mock-schools";
import { schools } from "../../../db/schemas/school.schema";
import type { GraphQLContext } from "../../../server";

export const schoolMutation = {
	Query: {
		schools: async (_: unknown, __: unknown, context: GraphQLContext) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			const dbSchools = await context.db.select().from(schools).all();
			const existingNames = new Set(
				dbSchools.map((item) => item.schoolName.trim().toLowerCase()),
			);
			const missingMocks = mockSchools.filter(
				(item) => !existingNames.has(item.schoolName.trim().toLowerCase()),
			);

			return [...dbSchools, ...missingMocks];
		},
	},
	Mutation: {
		upsertSchoolProfile: async (
			_: unknown,
			args: {
				input: {
					schoolName: string;
					email: string;
					managerName: string;
					address: string;
					aimag: string;
				};
			},
			context: GraphQLContext,
		) => {
			if (!context.auth.userId || !context.auth.isAuthenticated) {
				throw new Error("Unauthorized");
			}

			const userId = context.auth.userId;
			const values = {
				schoolName: args.input.schoolName,
				email: args.input.email,
				managerName: args.input.managerName,
				address: args.input.address,
				aimag: args.input.aimag,
			};

			const existing = await context.db
				.select({ id: schools.id })
				.from(schools)
				.where(eq(schools.id, userId))
				.get();

			if (existing) {
				return context.db
					.update(schools)
					.set(values)
					.where(eq(schools.id, userId))
					.returning()
					.get();
			}

			return context.db
				.insert(schools)
				.values({
					id: userId,
					...values,
				})
				.returning()
				.get();
		},
	},
};
