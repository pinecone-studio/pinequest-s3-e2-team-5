import { count, eq } from "drizzle-orm"
import { classrooms } from "../../../db/schemas/classroom.schema"
import { students } from "../../../db/schemas/student.schema";
import { GraphQLContext } from "../../../server"
import { assertAuthenticated } from "../../errors";

export const classRoomQuery = {
	Query: {
		classroomsByTeacher: async (
			_: unknown,
			_args: unknown,
			context: GraphQLContext
		) => {
			const userId = assertAuthenticated(context);

			return context.db
				.select()
				.from(classrooms)
				.where(eq(classrooms.teacherId, userId))
				.all();
		},
	},
	Classroom: {
		studentCount: async (
			classroom: { id: string },
			_args: unknown,
			context: GraphQLContext
		) => {
			const studentCountResult = await context.db
				.select({ value: count() })
				.from(students)
				.where(eq(students.classroomId, classroom.id))
				.get();

			return studentCountResult?.value ?? 0;
		},
	},
}
