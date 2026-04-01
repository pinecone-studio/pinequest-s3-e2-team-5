import type { GraphQLContext } from '../../server';

type ExplanationParams = {
	question: string;
	correctAnswer: string;
	studentAnswer: string | null;
};

function normalizeExplanation(text: string) {
	return text
		.replace(/\s+/g, ' ')
		.replace(/^["'\s]+|["'\s]+$/g, '')
		.trim();
}

function hasCompleteSentenceEnding(text: string) {
	return /[.!?։。]$/.test(text.trim());
}

function buildFallbackExplanation(params: ExplanationParams) {
	const studentAnswer = params.studentAnswer?.trim();

	if (studentAnswer) {
		return `${params.correctAnswer} нь энэ асуултын зөв хариулт юм. ${studentAnswer} нь асуултын гол утгатай бүрэн нийцэхгүй тул буруу болсон.`;
	}

	return `${params.correctAnswer} нь энэ асуултын зөв хариулт юм. Асуултын утгыг зөв ойлгохын тулд гол ойлголт болон түлхүүр үгийг анхаарч сонгоорой.`;
}

function extractUsableExplanation(text: string, params: ExplanationParams) {
	const normalized = normalizeExplanation(text);

	if (!normalized) {
		return null;
	}

	const lower = normalized.toLowerCase();
	const looksLikePromptEcho =
		lower.includes('асуулт:') ||
		lower.includes('сурагчийн хариулт:') ||
		lower.includes('зөв хариулт:') ||
		lower.startsWith('чи ');

	if (looksLikePromptEcho) {
		return null;
	}

	if (!hasCompleteSentenceEnding(normalized)) {
		return null;
	}

	return normalized;
}

export async function generateIncorrectAnswerExplanation(context: GraphQLContext, params: ExplanationParams) {
	if (!context.env.AI) {
		return buildFallbackExplanation(params);
	}

	const studentAnswer = params.studentAnswer?.trim() || 'Хариулт сонгоогүй.';

	try {
		const result = await context.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			messages: [
				{
					role: 'system',
					content:
						'Чи сурагчдад зориулсан тайлбар бичдэг туслах. Зөвхөн Монгол хэлээр, яг 2 богино өгүүлбэрээр, markdown болон жагсаалтгүй хариул. Prompt-ийг бүү давт.',
				},
				{
					role: 'user',
					content: [
						'Доорх асуултын зөв хариултыг товч тайлбарла.',
						'Эхний өгүүлбэрт зөв хариулт яагаад зөв болохыг хэл.',
						'Хоёр дахь өгүүлбэрт сурагчийн сонголт яагаад тохирохгүйг товч хэл.',
						`Асуулт: ${params.question}`,
						`Сурагчийн хариулт: ${studentAnswer}`,
						`Зөв хариулт: ${params.correctAnswer}`,
					].join('\n'),
				},
			],
			max_tokens: 120,
			temperature: 0.2,
		});

		const response =
			typeof result === 'object' && result !== null && 'response' in result && typeof result.response === 'string' ? result.response : null;

		if (!response) {
			return buildFallbackExplanation(params);
		}

		return extractUsableExplanation(response, params) ?? buildFallbackExplanation(params);
	} catch (error) {
		console.error('Failed to generate AI explanation', error);
		return buildFallbackExplanation(params);
	}
}
