import type { GraphQLContext } from "../../server";

type ExplanationParams = {
	question: string;
	correctAnswer: string;
	studentAnswer: string | null;
};

function normalizeExplanation(text: string) {
	return text
		.replace(/\s+/g, " ")
		.replace(/^["'\s]+|["'\s]+$/g, "")
		.trim();
}

export async function generateIncorrectAnswerExplanation(
	context: GraphQLContext,
	params: ExplanationParams,
) {
	if (!context.env.AI) {
		return null;
	}

	const studentAnswer = params.studentAnswer?.trim() || "Хариулт сонгоогүй.";
	const prompt = [
		"Чи сурагчид зориулсан богино, ойлгомжтой тайлбар бичдэг багшийн туслах.",
		"Доорх буруу хариулсан асуултад зөв хариултыг тайлбарла.",
		"Яг 2 өгүүлбэрээр, Монгол хэлээр, энгийн үгээр хариул.",
		"Эхний өгүүлбэрт зөв хариулт яагаад зөв болохыг тайлбарла.",
		"Хоёр дахь өгүүлбэрт сурагчийн сонголт яагаад тохирохгүйг богино дурд.",
		"Bullet, жагсаалт, markdown бүү ашигла.",
		`Асуулт: ${params.question}`,
		`Сурагчийн хариулт: ${studentAnswer}`,
		`Зөв хариулт: ${params.correctAnswer}`,
	].join("\n");

	try {
		const result = await context.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
			prompt,
			max_tokens: 180,
			temperature: 0.3,
		});

		const response =
			typeof result === "object" &&
			result !== null &&
			"response" in result &&
			typeof result.response === "string"
				? result.response
				: null;

		if (!response) {
			return null;
		}

		return normalizeExplanation(response);
	} catch (error) {
		console.error("Failed to generate AI explanation", error);
		return null;
	}
}
