import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schemas/student.schema";

export function getDb(env: Pick<Env, "shalgalt_db">) {
	return drizzle(env.shalgalt_db, { schema });
}
