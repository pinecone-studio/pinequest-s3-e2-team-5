import * as classroomSchema from "./schemas/classroom.schema";
import { drizzle } from "drizzle-orm/d1";
import * as schoolSchema from "./schemas/school.schema";
import * as studentSchema from "./schemas/student.schema";
import * as teacherSchema from "./schemas/teacher.schema";
import * as teacherRequestSchema from "./schemas/teacher-request.schema";

const schema = {
	...classroomSchema,
	...schoolSchema,
	...studentSchema,
	...teacherSchema,
	...teacherRequestSchema,
};

export function getDb(env: Pick<Env, "shalgalt_db">) {
	return drizzle(env.shalgalt_db, { schema });
}
