import { classrooms } from "../../../db/schemas/classroom.schema"
import { GraphQLContext } from "../../../server"


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

            if (!context.auth.userId || !context.auth.isAuthenticated) {
                throw new Error("Unauthorized");
            }

            const userId = context.auth.userId;

            return context.db.insert(classrooms).values({
                teacherId: userId,
                className: args.input.className,
                createdAt: new Date()
            })
        }
    }
}