import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const classrooms = sqliteTable("classrooms", {
	id: text().primaryKey(),
	schoolId: text().notNull(),
	schoolName: text().notNull(),
	teacherId: text().notNull(),
	className: text().notNull(),
	classCode: text().notNull().unique(),
	createdAt: int().notNull(),
});
