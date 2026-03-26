import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { exams } from "./exam.schema";


export const questions = sqliteTable('questions', {
    id: text().primaryKey(),
    type: text({ enum: ["mcq", "open", "short"] }).notNull(),
    question: text().notNull(),

    examId: text().notNull().references(() => exams.id, { onDelete: "cascade" }),
    indexOnExam: int().notNull(),

    imageUrl: text(),
    videoUrl: text(),

    topic: text(),

    difficulty: text(),
})