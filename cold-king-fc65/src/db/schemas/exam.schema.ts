import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const exams = sqliteTable("exams", {
    id: text().primaryKey().notNull(),

    title: text().notNull(),

    subject: text().notNull(),
    description: text(),


    duration: int().notNull(), //minutes

    grade: text().notNull(),

    createdBy: text().notNull(),

})
