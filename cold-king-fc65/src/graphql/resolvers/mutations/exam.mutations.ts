import type { GraphQLContext } from "../../../server";
import { exams } from "../../../db/schemas/exam.schema";
import { and, eq } from "drizzle-orm";
import { assertAuthenticated, notFoundError } from "../../errors";

export const examMutation = {
    Mutation: {
        createExam: async (
            _: unknown,
            args: {
                input: {
                    title: string;
                    subject: string;
                    description?: string | null;
                    duration: number;
                    grade: string;
                    openStatus?: boolean | null;
                    createdBy?: string | null;
                };
            },
            context: GraphQLContext,
        ) => {
            const userId = assertAuthenticated(context);

            return context.db
                .insert(exams)
                .values({
                    id: crypto.randomUUID(),
                    title: args.input.title,
                    subject: args.input.subject,
                    description: args.input.description ?? null,
                    duration: args.input.duration,
                    grade: args.input.grade,
                    openStatus: args.input.openStatus ?? false,
                    createdBy: userId,
                })
                .returning()
                .get();
        },
        updateExam: async (
            _: unknown,
            args: {
                input: {
                    examId: string;
                    title: string;
                    subject: string;
                    description?: string | null;
                    duration: number;
                    grade: string;
                };
            },
            context: GraphQLContext,
        ) => {
            const userId = assertAuthenticated(context);

            const existingExam = await context.db
                .select()
                .from(exams)
                .where(
                    and(
                        eq(exams.id, args.input.examId),
                        eq(exams.createdBy, userId),
                    ),
                )
                .get();

            if (!existingExam) {
                throw notFoundError("Exam not found.");
            }

            return context.db
                .update(exams)
                .set({
                    title: args.input.title,
                    subject: args.input.subject,
                    description: args.input.description ?? null,
                    duration: args.input.duration,
                    grade: args.input.grade,
                })
                .where(eq(exams.id, args.input.examId))
                .returning()
                .get();
        },
    },
};
