import { classrooms } from "../../../db/schemas/classroom.schema"
import { GraphQLContext } from "../../../server"
import { assertAuthenticated } from "../../errors";


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

            const generateClassCode = () => {
                const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                let code = "";

                for (let i = 0; i < 6; i++) {
                    code += chars[Math.floor(Math.random() * chars.length)];
                }

                return code;
            };

            const classCode = generateClassCode()

            return context.db.insert(classrooms).values({
                id: crypto.randomUUID(),
                teacherId: userId,
                className: args.input.className,
                classCode,
                createdAt: Date.now()
            }).returning().get()
        }
    }
}
