import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const choices = sqliteTable('choices', {
    id: text().primaryKey(),

    questionId: text().notNull(),

    text: text().notNull(),

    label: text().notNull(),

    imageUrl: text(),

    videoUrl: text(),

    isCorrect: int({ mode: "boolean" }).notNull()
})
