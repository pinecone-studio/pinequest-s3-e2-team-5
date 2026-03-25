import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const teacherRequests = sqliteTable("teacher_requests", {
	id: text().primaryKey(),
	fullName: text().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	school: text().notNull(),
	subject: text().notNull(),
	status: text().notNull().default("pending"),
	approvedBySchoolId: text().notNull().default(""),
});
