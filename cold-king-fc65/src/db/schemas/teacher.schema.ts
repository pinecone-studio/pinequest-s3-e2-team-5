import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const teachers = sqliteTable("teachers", {
	id: text().primaryKey(),
	firstName: text().notNull(),
	lastName: text().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
});
