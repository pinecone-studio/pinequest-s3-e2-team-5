import { prisma } from "../../../lib/prisma";
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
            context: GraphQLContext,
        ) => {
            const userId = context.auth.userId;

            if (!userId) {
                throw new Error("Unauthorized");
            }

            return prisma.student.upsert({
                where: {
                    id: userId,
                },
                update: {
                    fullName: args.input.fullName,
                    email: args.input.email,
                    phone: args.input.phone,
                },
                create: {
                    id: userId,
                    fullName: args.input.fullName,
                    email: args.input.email,
                    phone: args.input.phone,
                },
            });
        },
    },
};
