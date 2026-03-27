import type { GraphQLContext } from "../../../server";
import { classrooms } from "../../../db/schemas/classroom.schema";
import { exams } from "../../../db/schemas/exam.schema";
import { and, eq } from "drizzle-orm";

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
                    createdBy: context.auth.userId,
                })
                .where(eq(exams.id, args.input.examId))
                .returning()
                .get();
        },
        scheduleExam: async (
            _: unknown,
            args: {
                input: {
                    examId: string;
                    classroomId: string;
                    scheduledDate: string;
                    startTime: string;
                };
            },
            context: GraphQLContext,
        ) => {
            if (!context.auth.userId || !context.auth.isAuthenticated) {
                throw new Error("Unauthorized");
            }

            const teacherId = context.auth.userId;
            const exam = await context.db
                .select()
                .from(exams)
                .where(and(eq(exams.id, args.input.examId), eq(exams.createdBy, teacherId)))
                .get();

            if (!exam) {
                throw new Error("Exam not found.");
            }

            const classroom = await context.db
                .select()
                .from(classrooms)
                .where(
                    and(
                        eq(classrooms.id, args.input.classroomId),
                        eq(classrooms.teacherId, teacherId),
                    ),
                )
                .get();

            if (!classroom) {
                throw new Error("Classroom not found.");
            }

            return context.db
                .update(exams)
                .set({
                    classroomId: classroom.id,
                    scheduledDate: args.input.scheduledDate,
                    startTime: args.input.startTime,
                    openStatus: true,
                })
                .where(eq(exams.id, exam.id))
                .returning()
                .get();
        },
    },
};
