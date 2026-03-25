import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const schools = sqliteTable("schools", {
	id: text().primaryKey(),
	schoolName: text().notNull(),
	email: text().notNull(),
	managerName: text().notNull(),
	address: text().notNull(),
	aimag: text().notNull(),
});
