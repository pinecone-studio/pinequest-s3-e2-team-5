import { sqliteTable, text } from "drizzle-orm/sqlite-core";


export const announcedExamGrades = sqliteTable("announced_exam_grades", {
    id: text().notNull().primaryKey(),

    classroomId: text().notNull(),

    announcedExamId: text().notNull(),
    createdBy: text().notNull()
})