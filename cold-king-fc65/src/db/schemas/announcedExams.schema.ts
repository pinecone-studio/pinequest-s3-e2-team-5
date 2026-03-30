import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";


export const announcedExams = sqliteTable("announced_exams", {
    id: text().notNull().primaryKey(),

    examId: text().notNull(),

    openStatus: int({ mode: "boolean" }).notNull(),

    scheduledDate: text().notNull(),
    startTime: text().notNull(),

    createdBy: text().notNull()

})