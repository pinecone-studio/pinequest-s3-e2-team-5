import * as classroomSchema from "./schemas/classroom.schema";
import { drizzle } from "drizzle-orm/d1";
import * as studentSchema from "./schemas/student.schema";
import * as teacherSchema from "./schemas/teacher.schema";

const schema = {
	...classroomSchema,
	...studentSchema,
	...teacherSchema,
};

export function getDb(env: Pick<Env, "shalgalt_db">) {
	return drizzle(env.shalgalt_db, { schema });
}
