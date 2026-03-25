import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const classrooms = sqliteTable("classrooms", {
	id: text().primaryKey(),
	teacherId: text().notNull(),
	school: text().notNull(),
	className: text().notNull(),
	classCode: text().notNull(),
});
