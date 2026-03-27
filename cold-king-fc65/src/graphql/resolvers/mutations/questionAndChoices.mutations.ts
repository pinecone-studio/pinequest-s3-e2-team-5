import { choices } from "../../../db/schemas/choices.schema";
import { questions } from "../../../db/schemas/question.schema";
import { GraphQLContext } from "../../../server";

type Choice = {
    id: string,
    label: string,
    text: string,
    imageUrl?: string | null,
    videoUrl?: string | null,
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
            });

            // 2️⃣ Insert choices after question exists
            let insertedChoices: Choice[] = [];
            if (args.input.choices?.length) {
                const choiceRows = args.input.choices?.map((choice: Choice) => ({
                    id: choice.id,
                    questionId,
                    label: choice.label,
                    text: choice.text,
                    imageUrl: choice.imageUrl || null,
                    videoUrl: choice.videoUrl || null,
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
