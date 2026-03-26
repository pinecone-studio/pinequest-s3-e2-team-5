import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const students = sqliteTable("students", {
	id: text().primaryKey(),
	firstName: text().notNull(),
	lastName: text().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	grade: text().notNull(),
	className: text().notNull(),
	inviteCode: text().notNull(),
	classroomId: text().notNull(),
	teacherId: text().notNull(),
});
