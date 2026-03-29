import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { GraphQLContext } from "../../server";

export type ChoiceMediaInput = {
	id: string;
	label: string;
	text: string;
	imageUrl?: string | null;
	videoUrl?: string | null;
	isCorrect: boolean;
};

export const legacyChoices = sqliteTable("choices", {
	id: text().primaryKey(),
	questionId: text().notNull(),
	text: text().notNull(),
	label: text().notNull(),
	isCorrect: int({ mode: "boolean" }).notNull(),
});

let choicesMediaColumnsSupported: boolean | undefined;

export async function supportsChoiceMediaColumns(context: GraphQLContext) {
	if (typeof choicesMediaColumnsSupported === "boolean") {
		return choicesMediaColumnsSupported;
	}

	try {
		const result = await context.env.shalgalt_db
			.prepare("PRAGMA table_info(`choices`);")
			.all<{ name: string }>();

		const columnNames = new Set(
			result.results
				.map((row) => row.name)
				.filter((name): name is string => typeof name === "string"),
		);

		choicesMediaColumnsSupported =
			columnNames.has("imageUrl") && columnNames.has("videoUrl");
	} catch (error) {
		console.error("Failed to inspect choices table schema", error);
		choicesMediaColumnsSupported = false;
	}

	return choicesMediaColumnsSupported;
}

export function hasChoiceMedia(inputChoices: ChoiceMediaInput[]) {
	return inputChoices.some(
		(choice) =>
			Boolean(choice.imageUrl?.trim()) || Boolean(choice.videoUrl?.trim()),
	);
}
