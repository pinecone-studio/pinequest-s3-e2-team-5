import { choices } from "../../../db/schemas/choices.schema";
import { questions } from "../../../db/schemas/question.schema";
import { GraphQLContext } from "../../../server";

type Choice = {
    id: string,
    questionId: string,
    label: string,
    text: string,
    isCorrect: boolean
}

type CreateQuestionInput = {
    question: string,
    type: "mcq" | "open" | "short",
    imageUrl?: string,
    videoUrl?: string,
    topic?: string,
    examId: string,
    indexOnExam: number,
    difficulty?: string,
    choices?: Choice[]
}

export const questionMutation = {
    Mutation: {
        createQuestionWithChoices: async (_: any, args: { input: CreateQuestionInput }, context: GraphQLContext) => {
            const questionId = crypto.randomUUID();

            // 1️⃣ Insert question first
            await context.db.insert(questions).values({
                id: questionId,
                question: args.input.question,
                type: args.input.type,
                imageUrl: args.input.imageUrl || null,
                videoUrl: args.input.videoUrl || null,
                topic: args.input.topic || null,
                examId: args.input.examId,
                indexOnExam: args.input.indexOnExam,
                difficulty: args.input.difficulty || null,
                createdAt: Date.now()
            });

            // 2️⃣ Insert choices after question exists
            let insertedChoices: Choice[] = [];
            if (args.input.choices?.length) {
                const choiceRows = args.input.choices?.map((choice: Choice) => ({
                    id: crypto.randomUUID(),
                    questionId,
                    label: choice.label,
                    text: choice.text,
                    isCorrect: choice.isCorrect
                }));

                await context.db.insert(choices).values(choiceRows);
                insertedChoices = choiceRows;
            }

            // 3️⃣ Return the question with choices
            return {
                id: questionId,
                ...args.input,
                choices: insertedChoices
            };
        }
    }
}