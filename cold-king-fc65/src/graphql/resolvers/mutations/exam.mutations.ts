import type { GraphQLContext } from "../../../server";
import { classrooms } from "../../../db/schemas/classroom.schema";
import { choices } from "../../../db/schemas/choices.schema";
import { exams } from "../../../db/schemas/exam.schema";
import { questions } from "../../../db/schemas/question.schema";
import { assertAuthenticated } from "../../errors";
import { and, eq, inArray } from "drizzle-orm";

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
        deleteExam: async (
            _: unknown,
            args: {
                examId: string;
            },
            context: GraphQLContext,
        ) => {
            const teacherId = assertAuthenticated(context);
            const exam = await context.db
                .select()
                .from(exams)
                .where(and(eq(exams.id, args.examId), eq(exams.createdBy, teacherId)))
                .get();

            if (!exam) {
                throw new Error("Exam not found.");
            }

            const examQuestions = await context.db
                .select({ id: questions.id })
                .from(questions)
                .where(eq(questions.examId, exam.id))
                .all();
            const questionIds = examQuestions.map((question) => question.id);

            if (questionIds.length > 0) {
                await context.db
                    .delete(choices)
                    .where(inArray(choices.questionId, questionIds));

                await context.db
                    .delete(questions)
                    .where(eq(questions.examId, exam.id));
            }

            await context.db.delete(exams).where(eq(exams.id, exam.id));

            return exam;
        },
    },
};
