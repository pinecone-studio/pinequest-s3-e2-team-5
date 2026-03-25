import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const teachers = sqliteTable("teachers", {
	id: text().primaryKey(),
	fullName: text().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	school: text().notNull(),
	subject: text().notNull(),
});
