import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const teacherRequests = sqliteTable("teacher_requests", {
	id: text().primaryKey(),
	teacherId: text().notNull(),
	teacherName: text().notNull(),
	teacherEmail: text().notNull(),
	teacherPhone: text().notNull(),
	subject: text().notNull(),
	schoolId: text().notNull(),
	schoolName: text().notNull(),
	status: text({ enum: ["PENDING", "APPROVED", "REJECTED"] })
		.notNull()
		.default("PENDING"),
	createdAt: int().notNull(),
	approvedAt: int(),
});
