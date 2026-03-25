import { drizzle } from "drizzle-orm/d1";
import * as schoolSchema from "./schemas/school.schema";
import * as studentSchema from "./schemas/student.schema";
import * as teacherSchema from "./schemas/teacher.schema";

const schema = {
	...schoolSchema,
	...studentSchema,
	...teacherSchema,
};

export function getDb(env: Pick<Env, "shalgalt_db">) {
	return drizzle(env.shalgalt_db, { schema });
}
