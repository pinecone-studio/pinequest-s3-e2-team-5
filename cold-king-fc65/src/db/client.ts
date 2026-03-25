import { drizzle } from "drizzle-orm/d1";
import * as classroomSchema from "./schemas/classroom.schema";
import * as schoolSchema from "./schemas/school.schema";
import * as studentSchema from "./schemas/student.schema";
import * as teacherRequestSchema from "./schemas/teacher-request.schema";
import * as teacherSchema from "./schemas/teacher.schema";

const schema = {
	...classroomSchema,
	...schoolSchema,
	...studentSchema,
	...teacherRequestSchema,
	...teacherSchema,
};

export function getDb(env: Pick<Env, "shalgalt_db">) {
	return drizzle(env.shalgalt_db, { schema });
}
