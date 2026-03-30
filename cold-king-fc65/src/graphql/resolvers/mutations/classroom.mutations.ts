import { and, eq } from "drizzle-orm";
import { classrooms } from "../../../db/schemas/classroom.schema"
import { exams } from "../../../db/schemas/exam.schema";
import { students } from "../../../db/schemas/student.schema";
import { GraphQLContext } from "../../../server"
import { assertAuthenticated, badUserInputError, notFoundError } from "../../errors";

function generateClassCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
}

export const classroomMutation = {
    Mutation: {
        createClassroom: async (_: any,
            args: {
                input: {
                    className: string
                }
            },
            context: GraphQLContext
        ) => {
            const userId = assertAuthenticated(context);
            const classCode = generateClassCode()

            return context.db.insert(classrooms).values({
                id: crypto.randomUUID(),
                teacherId: userId,
                className: args.input.className,
                classCode,
                createdAt: Date.now()
            }).returning().get()
        },
        updateClassroom: async (
            _: unknown,
            args: {
                input: {
                    classroomId: string;
                    className: string;
                };
            },
            context: GraphQLContext
        ) => {
            const userId = assertAuthenticated(context);
            const classroom = await context.db
                .select()
                .from(classrooms)
                .where(
                    and(
                        eq(classrooms.id, args.input.classroomId),
                        eq(classrooms.teacherId, userId)
                    )
                )
                .get();

            if (!classroom) {
                throw notFoundError("Classroom not found.");
            }

            return context.db
                .update(classrooms)
                .set({
                    className: args.input.className,
                })
                .where(eq(classrooms.id, classroom.id))
                .returning()
                .get();
        },
        deleteClassroom: async (
            _: unknown,
            args: { classroomId: string },
            context: GraphQLContext
        ) => {
            const userId = assertAuthenticated(context);
            const classroom = await context.db
                .select()
                .from(classrooms)
                .where(
                    and(
                        eq(classrooms.id, args.classroomId),
                        eq(classrooms.teacherId, userId)
                    )
                )
                .get();

            if (!classroom) {
                throw notFoundError("Classroom not found.");
            }

            const studentExists = await context.db
                .select({ id: students.id })
                .from(students)
                .where(eq(students.classroomId, classroom.id))
                .get();

            if (studentExists) {
                throw badUserInputError("Classroom has enrolled students.");
            }

            const examExists = await context.db
                .select({ id: exams.id })
                .from(exams)
                .where(eq(exams.classroomId, classroom.id))
                .get();

            if (examExists) {
                throw badUserInputError("Classroom has linked exams.");
            }

            return context.db
                .delete(classrooms)
                .where(eq(classrooms.id, classroom.id))
                .returning()
                .get();
        }
    }
}
