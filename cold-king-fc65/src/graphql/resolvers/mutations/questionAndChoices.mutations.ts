import { choices } from "../../../db/schemas/choices.schema";
import { exams } from "../../../db/schemas/exam.schema";
import { questions } from "../../../db/schemas/question.schema";
import { and, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { GraphQLContext } from "../../../server";
import {
    hasChoiceMedia,
    legacyChoices,
    supportsChoiceMediaColumns,
} from "../choices-table.helpers";
import { assertAuthenticated } from "../../errors";
import { notFoundError } from "../../errors";

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

type UpdateQuestionInput = CreateQuestionInput & {
    questionId: string,
}

function rethrowQuestionMutationError(error: unknown, action: string): never {
    if (error instanceof GraphQLError) {
        throw error;
    }

    const message = error instanceof Error ? error.message : `${action} failed.`;
    console.error(`${action} failed`, error);

    throw new GraphQLError(message, {
        extensions: {
            code: "INTERNAL_SERVER_ERROR",
        },
    });
}

export const questionMutation = {
    Mutation: {
        createQuestionWithChoices: async (_: unknown, args: { input: CreateQuestionInput }, context: GraphQLContext) => {
            try {
                const teacherId = assertAuthenticated(context);
                const exam = await context.db
                    .select({ id: exams.id })
                    .from(exams)
                    .where(and(eq(exams.id, args.input.examId), eq(exams.createdBy, teacherId)))
                    .get();

                if (!exam) {
                    throw notFoundError("Exam not found.");
                }

                const questionId = crypto.randomUUID();

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

                let insertedChoices: Choice[] = [];
                if (args.input.choices?.length) {
                    const mediaColumnsSupported = await supportsChoiceMediaColumns(context);

                    if (!mediaColumnsSupported && hasChoiceMedia(args.input.choices)) {
                        throw new GraphQLError("Choice image and video fields are not available on the current database yet.", {
                            extensions: {
                                code: "FAILED_PRECONDITION",
                            },
                        });
                    }

                    if (mediaColumnsSupported) {
                        const choiceRows = args.input.choices.map((choice) => ({
                            id: choice.id,
                            questionId,
                            label: choice.label,
                            text: choice.text,
                            imageUrl: choice.imageUrl || null,
                            videoUrl: choice.videoUrl || null,
                            isCorrect: choice.isCorrect,
                        }));

                        await context.db.insert(choices).values(choiceRows);
                        insertedChoices = choiceRows;
                    } else {
                        const choiceRows = args.input.choices.map((choice) => ({
                            id: choice.id,
                            questionId,
                            label: choice.label,
                            text: choice.text,
                            isCorrect: choice.isCorrect,
                        }));

                        await context.db.insert(legacyChoices).values(choiceRows);
                        insertedChoices = choiceRows.map((choice) => ({
                            ...choice,
                            imageUrl: null,
                            videoUrl: null,
                        }));
                    }
                }

                return {
                    id: questionId,
                    ...args.input,
                    choices: insertedChoices
                };
            } catch (error) {
                rethrowQuestionMutationError(error, "createQuestionWithChoices");
            }
        },
        updateQuestionWithChoices: async (_: unknown, args: { input: UpdateQuestionInput }, context: GraphQLContext) => {
            try {
                const teacherId = assertAuthenticated(context);
                const existingQuestion = await context.db
                    .select()
                    .from(questions)
                    .where(eq(questions.id, args.input.questionId))
                    .get();

                if (!existingQuestion) {
                    throw notFoundError("Question not found.");
                }

                const exam = await context.db
                    .select({ id: exams.id })
                    .from(exams)
                    .where(
                        and(
                            eq(exams.id, existingQuestion.examId),
                            eq(exams.createdBy, teacherId),
                        ),
                    )
                    .get();

                if (!exam || exam.id !== args.input.examId) {
                    throw notFoundError("Exam not found.");
                }

                await context.db
                    .update(questions)
                    .set({
                        question: args.input.question,
                        type: args.input.type,
                        imageUrl: args.input.imageUrl || null,
                        videoUrl: args.input.videoUrl || null,
                        topic: args.input.topic || null,
                        examId: args.input.examId,
                        indexOnExam: args.input.indexOnExam,
                        difficulty: args.input.difficulty || null,
                    })
                    .where(eq(questions.id, args.input.questionId));

                await context.db
                    .delete(choices)
                    .where(eq(choices.questionId, args.input.questionId));

                if (args.input.choices?.length) {
                    const mediaColumnsSupported = await supportsChoiceMediaColumns(context);

                    if (!mediaColumnsSupported && hasChoiceMedia(args.input.choices)) {
                        throw new GraphQLError("Choice image and video fields are not available on the current database yet.", {
                            extensions: {
                                code: "FAILED_PRECONDITION",
                            },
                        });
                    }

                    if (mediaColumnsSupported) {
                        await context.db.insert(choices).values(
                            args.input.choices.map((choice: Choice) => ({
                                id: choice.id,
                                questionId: args.input.questionId,
                                label: choice.label,
                                text: choice.text,
                                imageUrl: choice.imageUrl || null,
                                videoUrl: choice.videoUrl || null,
                                isCorrect: choice.isCorrect,
                            })),
                        );
                    } else {
                        await context.db.insert(legacyChoices).values(
                            args.input.choices.map((choice: Choice) => ({
                                id: choice.id,
                                questionId: args.input.questionId,
                                label: choice.label,
                                text: choice.text,
                                isCorrect: choice.isCorrect,
                            })),
                        );
                    }
                }

                return context.db
                    .select()
                    .from(questions)
                    .where(eq(questions.id, args.input.questionId))
                    .get();
            } catch (error) {
                rethrowQuestionMutationError(error, "updateQuestionWithChoices");
            }
        },
    }
}
