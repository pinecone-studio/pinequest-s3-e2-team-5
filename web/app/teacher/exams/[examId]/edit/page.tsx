"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type QuestionType = "mcq" | "open" | "short";

type ChoiceDraft = {
    id: string;
    label: string;
    text: string;
    isCorrect: boolean;
};

type QuestionDraft = {
    id: string;
    question: string;
    type: QuestionType;
    topic: string;
    difficulty: string;
    imageUrl: string;
    videoUrl: string;
    choices: ChoiceDraft[];
};

type ExamByIdData = {
    examById: {
        id: string;
        title: string;
        subject: string;
        description: string | null;
        duration: number;
        grade: string;
    };
};

type CreateQuestionWithChoicesData = {
    createQuestionWithChoices: {
        id: string;
    };
};

const GET_EXAM_BY_ID = gql`
  query ExamById($examId: String!) {
    examById(examId: $examId) {
      id
      title
      subject
      description
      duration
      grade
    }
  }
`;

const CREATE_QUESTION_WITH_CHOICES = gql`
  mutation CreateQuestionWithChoices($input: createQuestionInput!) {
    createQuestionWithChoices(input: $input) {
      id
    }
  }
`;

const baseFieldClassName =
    "h-[56px] w-full rounded-[18px] border border-[#E6DEF6] bg-white px-4 text-[16px] text-[#1C1825] outline-none transition focus:border-[#B59AF8] focus:ring-4 focus:ring-[#B59AF8]/15";

function createChoice(label: string): ChoiceDraft {
    return {
        id: crypto.randomUUID(),
        label,
        text: "",
        isCorrect: label === "A",
    };
}

function createQuestionDraft(): QuestionDraft {
    return {
        id: crypto.randomUUID(),
        question: "",
        type: "mcq",
        topic: "",
        difficulty: "",
        imageUrl: "",
        videoUrl: "",
        choices: ["A", "B", "C", "D"].map(createChoice),
    };
}

function normalizeQuestionChoices(choices: ChoiceDraft[]) {
    return choices.map((choice, index) => ({
        ...choice,
        label: String.fromCharCode(65 + index),
    }));
}

export default function TeacherExamEditPage() {
    const params = useParams<{ examId: string }>();
    const examId = Array.isArray(params.examId) ? params.examId[0] : params.examId;
    const [questions, setQuestions] = useState<QuestionDraft[]>([
        createQuestionDraft(),
    ]);
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState("");

    const { data: examData, loading: examLoading, error: examError } =
        useQuery<ExamByIdData>(GET_EXAM_BY_ID, {
            variables: { examId },
            skip: !examId,
        });

    const [createQuestionWithChoices, { loading: saveLoading }] =
        useMutation<CreateQuestionWithChoicesData>(CREATE_QUESTION_WITH_CHOICES);

    const activeQuestion = useMemo(() => {
        const fallback = questions[0] ?? null;
        const resolvedId = activeQuestionId ?? fallback?.id ?? null;

        if (!resolvedId) {
            return null;
        }

        return questions.find((question) => question.id === resolvedId) ?? fallback;
    }, [activeQuestionId, questions]);

    const activeQuestionIndex = useMemo(() => {
        if (!activeQuestion) {
            return -1;
        }

        return questions.findIndex((question) => question.id === activeQuestion.id);
    }, [activeQuestion, questions]);

    const updateActiveQuestion = (
        updater: (question: QuestionDraft) => QuestionDraft,
    ) => {
        if (!activeQuestion) {
            return;
        }

        setQuestions((current) =>
            current.map((question) =>
                question.id === activeQuestion.id ? updater(question) : question,
            ),
        );
    };

    const addQuestion = () => {
        const nextQuestion = createQuestionDraft();
        setQuestions((current) => [...current, nextQuestion]);
        setActiveQuestionId(nextQuestion.id);
    };

    const deleteActiveQuestion = () => {
        if (!activeQuestion || questions.length === 1) {
            return;
        }

        const nextQuestions = questions.filter(
            (question) => question.id !== activeQuestion.id,
        );
        const nextActive =
            nextQuestions[activeQuestionIndex - 1] ?? nextQuestions[0] ?? null;

        setQuestions(nextQuestions);
        setActiveQuestionId(nextActive?.id ?? null);
    };

    const addChoice = () => {
        updateActiveQuestion((question) => ({
            ...question,
            choices: [
                ...normalizeQuestionChoices(question.choices),
                createChoice(String.fromCharCode(65 + question.choices.length)),
            ],
        }));
    };

    const removeChoice = (choiceId: string) => {
        updateActiveQuestion((question) => {
            if (question.choices.length <= 2) {
                return question;
            }

            const nextChoices = normalizeQuestionChoices(
                question.choices.filter((choice) => choice.id !== choiceId),
            );
            const hasCorrect = nextChoices.some((choice) => choice.isCorrect);

            return {
                ...question,
                choices: hasCorrect
                    ? nextChoices
                    : nextChoices.map((choice, index) => ({
                        ...choice,
                        isCorrect: index === 0,
                    })),
            };
        });
    };

    const handleSave = async () => {
        if (!examId) {
            setStatusMessage("Exam ID missing.");
            return;
        }

        for (const [index, question] of questions.entries()) {
            if (!question.question.trim()) {
                setStatusMessage(`Question ${index + 1} is empty.`);
                return;
            }

            if (
                question.type === "mcq" &&
                (!question.choices.length ||
                    question.choices.some((choice) => !choice.text.trim()) ||
                    !question.choices.some((choice) => choice.isCorrect))
            ) {
                setStatusMessage(
                    `Question ${index + 1} needs filled choices and one correct answer.`,
                );
                return;
            }
        }

        try {
            setStatusMessage("Saving questions...");

            for (const [index, question] of questions.entries()) {
                await createQuestionWithChoices({
                    variables: {
                        input: {
                            examId,
                            indexOnExam: index + 1,
                            question: question.question.trim(),
                            type: question.type,
                            topic: question.topic?.trim() || null,
                            difficulty: question.difficulty?.trim() || null,
                            imageUrl: question.imageUrl?.trim() || null,
                            videoUrl: question.videoUrl?.trim() || null,
                            choices:
                                question.type === "mcq"
                                    ? normalizeQuestionChoices(question.choices).map((choice) => ({
                                        id: choice.id,
                                        label: choice.label,
                                        text: choice.text.trim(),
                                        isCorrect: choice.isCorrect,
                                    }))
                                    : [],
                        },
                    },
                });
            }

            setStatusMessage("Questions saved.");
        } catch (error) {
            setStatusMessage(
                error instanceof Error ? error.message : "Failed to save questions.",
            );
        }
    };

    if (examLoading) {
        return <main className="p-8 text-sm text-muted-foreground">Loading...</main>;
    }

    if (examError || !examData?.examById) {
        return (
            <main className="p-8 text-sm text-red-600">
                {examError?.message ?? "Failed to load exam."}
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#fdfcff_58%,#f8f2ff_100%)] px-5 py-6 sm:px-8 lg:px-10">
            <div className="mx-auto grid max-w-[1580px] gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="space-y-6">
                    <section className="rounded-[28px] border border-[#E8E0F5] bg-white/95 p-6 shadow-[0_10px_34px_rgba(48,30,84,0.05)]">
                        <h2 className="text-[24px] font-semibold text-[#17131F]">
                            Exam Details
                        </h2>

                        <dl className="mt-6 space-y-4 text-[16px]">
                            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                                <dt className="font-semibold text-[#17131F]">Subject</dt>
                                <dd className="text-right text-[#2A2434]">
                                    {examData.examById.subject}
                                </dd>
                            </div>
                            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                                <dt className="font-semibold text-[#17131F]">Title</dt>
                                <dd className="text-right text-[#2A2434]">
                                    {examData.examById.title}
                                </dd>
                            </div>
                            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                                <dt className="font-semibold text-[#17131F]">Grade</dt>
                                <dd className="text-right text-[#2A2434]">
                                    {examData.examById.grade}
                                </dd>
                            </div>
                            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                                <dt className="font-semibold text-[#17131F]">Duration</dt>
                                <dd className="text-right text-[#2A2434]">
                                    {examData.examById.duration} min
                                </dd>
                            </div>
                            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                                <dt className="font-semibold text-[#17131F]">Questions</dt>
                                <dd className="text-right text-[#2A2434]">{questions.length}</dd>
                            </div>
                        </dl>

                        {statusMessage ? (
                            <p className="mt-6 text-sm text-[#5F5470]">{statusMessage}</p>
                        ) : null}

                        <div className="mt-6 flex items-center gap-3">
                            <Button
                                type="button"
                                onClick={deleteActiveQuestion}
                                variant="outline"
                                className="rounded-[16px]"
                            >
                                <Trash2 className="size-4" />
                                Delete
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={saveLoading}
                                className="rounded-[16px] bg-[linear-gradient(135deg,#9E85FF_0%,#7F66D8_100%)] text-white hover:opacity-95"
                            >
                                {saveLoading ? "Saving..." : "Save Questions"}
                            </Button>
                        </div>
                    </section>

                    <section className="rounded-[28px] border border-[#E8E0F5] bg-white/95 p-6 shadow-[0_10px_34px_rgba(48,30,84,0.05)]">
                        <h2 className="text-[24px] font-semibold text-[#17131F]">Questions</h2>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {questions.map((question, index) => {
                                const isActive = question.id === activeQuestion?.id;

                                return (
                                    <button
                                        key={question.id}
                                        type="button"
                                        onClick={() => setActiveQuestionId(question.id)}
                                        className={[
                                            "flex h-[52px] min-w-[52px] items-center justify-center rounded-[16px] border text-[18px] font-semibold transition",
                                            isActive
                                                ? "border-[#B49AF8] bg-[#F2ECFF] text-[#4A3A82]"
                                                : "border-[#E8E0F5] bg-white text-[#514B5D] hover:border-[#D8C9FA]",
                                        ].join(" ")}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                onClick={addQuestion}
                                className="flex h-[52px] min-w-[52px] items-center justify-center rounded-[16px] border border-[#E8E0F5] bg-white text-[#514B5D] transition hover:border-[#D8C9FA] hover:bg-[#FAF7FF]"
                            >
                                <Plus className="size-6" />
                            </button>
                        </div>
                    </section>
                </aside>

                <section className="rounded-[30px] border border-[#E8E0F5] bg-white/95 p-6 shadow-[0_12px_40px_rgba(48,30,84,0.06)] sm:p-8 lg:p-10">
                    {activeQuestion ? (
                        <div className="space-y-8">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex items-start gap-5">
                                    <span className="pt-1 text-[30px] font-semibold text-[#5A5663]">
                                        {activeQuestionIndex + 1}
                                    </span>
                                    <div>
                                        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#17131F]">
                                            Question Editor
                                        </h1>
                                        <p className="mt-2 text-[16px] text-[#6F687D]">
                                            This page now follows your current GraphQL question schema.
                                        </p>
                                    </div>
                                </div>

                                <div className="relative w-full lg:w-[220px]">
                                    <select
                                        value={activeQuestion.type}
                                        onChange={(event) =>
                                            updateActiveQuestion((question) => ({
                                                ...question,
                                                type: event.target.value as QuestionType,
                                            }))
                                        }
                                        className={`${baseFieldClassName} appearance-none pr-12`}
                                    >
                                        <option value="mcq">MCQ</option>
                                        <option value="open">Open</option>
                                        <option value="short">Short</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-[#7F778C]" />
                                </div>
                            </div>

                            <textarea
                                value={activeQuestion.question}
                                onChange={(event) =>
                                    updateActiveQuestion((question) => ({
                                        ...question,
                                        question: event.target.value,
                                    }))
                                }
                                placeholder="Write the question..."
                                className="min-h-[120px] w-full resize-none rounded-[20px] border border-[#E6DEF6] bg-white px-5 py-4 text-[18px] text-[#1C1825] outline-none transition placeholder:text-[#85808F] focus:border-[#B59AF8] focus:ring-4 focus:ring-[#B59AF8]/15"
                            />

                            <div className="grid gap-4 md:grid-cols-2">
                                <input
                                    value={activeQuestion.topic}
                                    onChange={(event) =>
                                        updateActiveQuestion((question) => ({
                                            ...question,
                                            topic: event.target.value,
                                        }))
                                    }
                                    placeholder="Topic"
                                    className={baseFieldClassName}
                                />
                                <input
                                    value={activeQuestion.difficulty}
                                    onChange={(event) =>
                                        updateActiveQuestion((question) => ({
                                            ...question,
                                            difficulty: event.target.value,
                                        }))
                                    }
                                    placeholder="Difficulty"
                                    className={baseFieldClassName}
                                />
                                <input
                                    value={activeQuestion.imageUrl}
                                    onChange={(event) =>
                                        updateActiveQuestion((question) => ({
                                            ...question,
                                            imageUrl: event.target.value,
                                        }))
                                    }
                                    placeholder="Image URL"
                                    className={baseFieldClassName}
                                />
                                <input
                                    value={activeQuestion.videoUrl}
                                    onChange={(event) =>
                                        updateActiveQuestion((question) => ({
                                            ...question,
                                            videoUrl: event.target.value,
                                        }))
                                    }
                                    placeholder="Video URL"
                                    className={baseFieldClassName}
                                />
                            </div>

                            {activeQuestion.type === "mcq" ? (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[24px] font-semibold text-[#17131F]">
                                            Choices
                                        </h2>
                                        <Button type="button" variant="outline" onClick={addChoice}>
                                            <Plus className="size-4" />
                                            Add choice
                                        </Button>
                                    </div>

                                    {normalizeQuestionChoices(activeQuestion.choices).map((choice) => (
                                        <div key={choice.id} className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateActiveQuestion((question) => ({
                                                        ...question,
                                                        choices: normalizeQuestionChoices(
                                                            question.choices.map((item) => ({
                                                                ...item,
                                                                isCorrect: item.id === choice.id,
                                                            })),
                                                        ),
                                                    }))
                                                }
                                                className={[
                                                    "size-[36px] rounded-full border-2 transition",
                                                    choice.isCorrect
                                                        ? "border-[#A688F6] bg-[radial-gradient(circle,#A688F6_0_42%,white_45%)]"
                                                        : "border-[#B7B0C3] bg-white hover:border-[#A688F6]",
                                                ].join(" ")}
                                                aria-label={`Mark ${choice.label} as correct`}
                                            />

                                            <span className="w-6 text-sm font-semibold text-[#5A5663]">
                                                {choice.label}
                                            </span>

                                            <input
                                                value={choice.text}
                                                onChange={(event) =>
                                                    updateActiveQuestion((question) => ({
                                                        ...question,
                                                        choices: normalizeQuestionChoices(
                                                            question.choices.map((item) =>
                                                                item.id === choice.id
                                                                    ? { ...item, text: event.target.value }
                                                                    : item,
                                                            ),
                                                        ),
                                                    }))
                                                }
                                                placeholder={`Choice ${choice.label}`}
                                                className={baseFieldClassName}
                                            />

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => removeChoice(choice.id)}
                                                className="shrink-0"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-[20px] border border-dashed border-[#D9D0EE] bg-[#FBFAFE] p-5 text-sm text-[#6F687D]">
                                    {activeQuestion.type === "open"
                                        ? "Open questions do not save predefined choices with your current schema."
                                        : "Short questions also save without choices in your current schema."}
                                </div>
                            )}
                        </div>
                    ) : null}
                </section>
            </div>
        </main>
    );
}
