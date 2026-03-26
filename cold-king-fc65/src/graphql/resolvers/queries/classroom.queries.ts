import { eq } from "drizzle-orm"
import { classrooms } from "../../../db/schemas/classroom.schema"
import { GraphQLContext } from "../../../server"

export const classRoomQuery = {
    Query: {
        classroomsByTeacher: async (
            _: unknown,
            _args: unknown,
            context: GraphQLContext
        ) => {

            const userId = context.auth.userId

            if (!userId) {
                throw new Error("Unauthorized")
            }

            console.log("CTX:", context)

            return context.db.select().from(classrooms).where(eq(classrooms.teacherId, userId)).all()

        }
    }
}
