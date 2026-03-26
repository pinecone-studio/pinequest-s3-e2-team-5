"use client";

import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";

type QuestionType = "Зураггүй" | "Зурагтай";
type AnswerType = "Сонголттой" | "Нээлттэй";

type Choice = {
    id: string;
    label: string;
    text: string;
    isCorrect: boolean
    order: number
};
type QuestionItem = {
    question: string;
    questionType: QuestionType;
    type: AnswerType;
    imageUrl?: string
    videoUrl?: string
    score: number;
    choices: Choice[];
};

interface ExamData {
    examById: {
        title: string
        id: string
        subject: string
        description: string
        createdBy: string
        duration: number
        grade: string
    }
}

const GET_EXAMBYID = gql`
    query ExamById($examId: String!){
        examById(examId: $examId){
            title
            id
            subject
            description
            createdBy
            duration
            grade
        }
    }
`

const baseFieldClassName =
    "h-[62px] w-full rounded-[20px] border border-[#E6DEF6] bg-white px-5 text-[18px] text-[#1C1825] shadow-[inset_0_1px_2px_rgba(255,255,255,0.7)] outline-none transition focus:border-[#B59AF8] focus:ring-4 focus:ring-[#B59AF8]/15";

function createChoiceOptions() {
    return ["A", "B", "C", "D"].map((label, index) => ({
        id: `${label}-${crypto.randomUUID()}`,
        label: label,
        text: `Сонголт ${label}`,
        order: index,
        isCorrect: Boolean
    }));
}

function createQuestion(order: number): QuestionItem {
    const options = createChoiceOptions();

    return {
        question: "",
        questionType: "Зураггүй",
        type: "Сонголттой",
        score: 1,
        choices: options.map(({ id, label, text, isCorrect }) => ({ id, label, text, isCorrect })),
        correctOptionId: options[0]?.id ?? null,
    };
}

export default function TeacherExamCreatePage() {
    const [totalScore, setTotalScore] = useState(30);
    const [questions, setQuestions] = useState<QuestionItem[]>([createQuestion(1)]);
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

    const params = useParams()
    const examId = params.examId

    const { data: examData, loading, error } = useQuery<ExamData>(GET_EXAMBYID, {
        variables: {
            examId
        }
    })

    useEffect(() => {
        console.log(examData)
    }, [examData])

    const activeQuestion = useMemo(() => {
        const fallbackQuestion = questions[0] ?? null;
        const resolvedActiveId = activeQuestionId ?? fallbackQuestion?.id ?? null;

        if (!resolvedActiveId) {
            return null;
        }

        return questions.find((question) => question.id === resolvedActiveId) ?? fallbackQuestion;
    }, [activeQuestionId, questions]);

    const activeQuestionIndex = useMemo(() => {
        if (!activeQuestion) {
            return -1;
        }

        return questions.findIndex((question) => question.id === activeQuestion.id);
    }, [activeQuestion, questions]);

    const updateActiveQuestion = (updater: (question: QuestionItem) => QuestionItem) => {
        if (!activeQuestion) {
            return;
        }

        setQuestions((currentQuestions) =>
            currentQuestions.map((question) =>
                question.id === activeQuestion.id ? updater(question) : question
            )
        );
    };

    const addQuestion = () => {
        const newQuestion = createQuestion(questions.length + 1);

        setQuestions((currentQuestions) => [...currentQuestions, newQuestion]);
        setActiveQuestionId(newQuestion.id);
    };

    const deleteActiveQuestion = () => {
        if (!activeQuestion || questions.length === 1) {
            return;
        }

        const nextQuestions = questions.filter((question) => question.id !== activeQuestion.id);
        const nextActiveQuestion =
            nextQuestions[activeQuestionIndex - 1] ?? nextQuestions[0] ?? null;

        setQuestions(nextQuestions);
        setActiveQuestionId(nextActiveQuestion?.id ?? null);
    };

    const addOption = () => {
        updateActiveQuestion((question) => ({
            ...question,
            options: [
                ...question.options,
                {
                    id: `option-${crypto.randomUUID()}`,
                    value: `Сонголт ${String.fromCharCode(65 + question.options.length)}`,
                },
            ],
        }));
    };

    const questionCount = questions.length;

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#fdfcff_58%,#f8f2ff_100%)] px-5 py-6 sm:px-8 lg:px-10">
            <div className="mx-auto grid max-w-[1580px] gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
                <aside className="space-y-7">
                    <section className="rounded-[28px] border border-[#E8E0F5] bg-white/95 p-6 shadow-[0_10px_34px_rgba(48,30,84,0.05)]">
                        <div className="space-y-5">
                            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-3 text-[18px]">
                                <span className="font-semibold text-[#17131F]">Хичээл</span>
                                <p
                                    className="min-w-0 border-0 bg-transparent p-0 text-right text-[18px] text-[#2A2434] outline-none"
                                >

                                    {examData?.examById.subject}
                                </p>
                            </div>

                            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-3 text-[18px]">
                                <span className="font-semibold text-[#17131F]">Сэдэв</span>
                                <p
                                    className="min-w-0 border-0 bg-transparent p-0 text-right text-[18px] text-[#2A2434] outline-none"
                                >
                                    {examData?.examById.title}
                                </p>
                            </div>

                            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-3 text-[18px]">
                                <span className="font-semibold text-[#17131F]">Анги</span>
                                <div className="relative">
                                    <p
                                        className="min-w-0 border-0 bg-transparent p-0 text-right text-[18px] text-[#2A2434] outline-none"
                                    >
                                        {examData?.examById.grade}

                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-3 text-[18px]">
                                <span className="font-semibold text-[#17131F]">Хугацаа</span>
                                <p
                                    className="min-w-0 border-0 bg-transparent p-0 text-right text-[18px] text-[#2A2434] outline-none"
                                >
                                    {examData?.examById.duration}
                                </p>
                            </div>

                            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-3 text-[18px]">
                                <span className="font-semibold text-[#17131F]">Оноо</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={totalScore}
                                    onChange={(event) => setTotalScore(Number(event.target.value))}
                                    className="min-w-0 border-0 bg-transparent p-0 text-right text-[18px] text-[#2A2434] outline-none"
                                />

                                replace onoo later
                            </div>

                            <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-3 text-[18px]">
                                <span className="font-semibold text-[#17131F]">Нийт дасгал</span>
                                <span className="text-right text-[18px] text-[#2A2434]">{questionCount}</span>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center gap-4 text-[#111111]">
                            <button
                                type="button"
                                className="inline-flex size-10 items-center justify-center rounded-full transition hover:bg-[#F5F0FF]"
                            >
                                <Pencil className="size-6" strokeWidth={2.2} />
                            </button>
                            <button
                                type="button"
                                onClick={deleteActiveQuestion}
                                className="inline-flex size-10 items-center justify-center rounded-full transition hover:bg-[#FFF1F4]"
                            >
                                <Trash2 className="size-6" strokeWidth={2.2} />
                            </button>
                        </div>
                    </section>

                    <section className="rounded-[28px] border border-[#E8E0F5] bg-white/95 p-6 shadow-[0_10px_34px_rgba(48,30,84,0.05)]">
                        <h2 className="text-[24px] font-semibold text-[#17131F]">Асуулт</h2>

                        <div className="mt-7 flex flex-wrap gap-4">
                            {questions.map((question, index) => {
                                const isActive = question.id === activeQuestion?.id;

                                return (
                                    <button
                                        key={question.id}
                                        type="button"
                                        onClick={() => setActiveQuestionId(question.id)}
                                        className={[
                                            "flex h-[56px] min-w-[56px] items-center justify-center rounded-[16px] border text-[20px] font-semibold transition",
                                            isActive
                                                ? "border-[#B49AF8] bg-[#F2ECFF] text-[#4A3A82] shadow-[0_8px_18px_rgba(135,103,222,0.18)]"
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
                                className="flex h-[56px] min-w-[56px] items-center justify-center rounded-[16px] border border-[#E8E0F5] bg-white text-[#514B5D] transition hover:border-[#D8C9FA] hover:bg-[#FAF7FF]"
                            >
                                <Plus className="size-7" />
                            </button>
                        </div>
                    </section>
                </aside>

                <section className="rounded-[30px] border border-[#E8E0F5] bg-white/95 p-6 shadow-[0_12px_40px_rgba(48,30,84,0.06)] sm:p-8 lg:p-10">
                    {activeQuestion ? (
                        <div className="space-y-10">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex items-start gap-6">
                                    <span className="pt-1 text-[32px] font-semibold text-[#5A5663]">
                                        {activeQuestionIndex + 1}
                                    </span>
                                    <div>
                                        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#17131F]">
                                            Асуултын төрөл
                                        </h1>
                                    </div>
                                </div>

                                <div className="relative w-full lg:w-[224px]">
                                    <select
                                        value={activeQuestion.questionType}
                                        onChange={(event) =>
                                            updateActiveQuestion((question) => ({
                                                ...question,
                                                questionType: event.target.value as QuestionType,
                                            }))
                                        }
                                        className={`${baseFieldClassName} appearance-none pr-12`}
                                    >
                                        <option value="Зураггүй">Зураггүй</option>
                                        <option value="Зурагтай">Зурагтай</option>
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
                                placeholder="Асуултаа бичнэ үү..."
                                className="min-h-[64px] w-full resize-none rounded-[20px] border border-[#E6DEF6] bg-white px-5 py-4 text-[18px] text-[#1C1825] outline-none transition placeholder:text-[#85808F] focus:border-[#B59AF8] focus:ring-4 focus:ring-[#B59AF8]/15"
                            />

                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-[#17131F]">
                                    Хариултын Төрөл
                                </h2>

                                <div className="relative w-full lg:w-[224px]">
                                    <select
                                        value={activeQuestion.answerType}
                                        onChange={(event) =>
                                            updateActiveQuestion((question) => {
                                                const answerType = event.target.value as AnswerType;

                                                return {
                                                    ...question,
                                                    answerType,
                                                    correctOptionId:
                                                        answerType === "Сонголттой"
                                                            ? question.correctOptionId ?? question.options[0]?.id ?? null
                                                            : null,
                                                };
                                            })
                                        }
                                        className={`${baseFieldClassName} appearance-none pr-12`}
                                    >
                                        <option value="Сонголттой">Сонголттой</option>
                                        <option value="Нээлттэй">Нээлттэй</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-[#7F778C]" />
                                </div>
                            </div>

                            {activeQuestion.answerType === "Сонголттой" ? (
                                <div>
                                    <div className="space-y-5">
                                        {activeQuestion.options.map((option) => (
                                            <div
                                                key={option.id}
                                                className="flex items-center gap-4"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateActiveQuestion((question) => ({
                                                            ...question,
                                                            correctOptionId: option.id,
                                                        }))
                                                    }
                                                    className={[
                                                        "size-[38px] rounded-full border-2 transition",
                                                        activeQuestion.correctOptionId === option.id
                                                            ? "border-[#A688F6] bg-[radial-gradient(circle,#A688F6_0_42%,white_45%)]"
                                                            : "border-[#B7B0C3] bg-white hover:border-[#A688F6]",
                                                    ].join(" ")}
                                                    aria-label="Зөв хариулт болгох"
                                                />

                                                <input
                                                    value={option.value}
                                                    onChange={(event) =>
                                                        updateActiveQuestion((question) => ({
                                                            ...question,
                                                            options: question.options.map((item) =>
                                                                item.id === option.id
                                                                    ? { ...item, value: event.target.value }
                                                                    : item
                                                            ),
                                                        }))
                                                    }
                                                    className={baseFieldClassName}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addOption}
                                        className="mt-5 inline-flex items-center gap-3 text-[20px] font-medium text-[#1E1828] transition hover:text-[#7F66D8]"
                                    >
                                        <Plus className="size-6" />
                                        <span>Сонголт нэмэх</span>
                                    </button>

                                    <p className="mt-4 text-[18px] text-[#26212E]">
                                        Зөв хариултын өмнөх тойргийг сонгоно уу
                                    </p>
                                </div>
                            ) : (
                                <textarea
                                    placeholder="Зөв хариултыг оруулна уу..."
                                    className="min-h-[140px] w-full resize-none rounded-[20px] border border-[#E6DEF6] bg-white px-5 py-4 text-[18px] text-[#1C1825] outline-none transition placeholder:text-[#85808F] focus:border-[#B59AF8] focus:ring-4 focus:ring-[#B59AF8]/15"
                                />
                            )}

                            <div className="space-y-4">
                                <h3 className="text-[28px] font-semibold tracking-[-0.03em] text-[#17131F]">
                                    Оноо
                                </h3>

                                <input
                                    type="number"
                                    min={1}
                                    value={activeQuestion.score}
                                    onChange={(event) =>
                                        updateActiveQuestion((question) => ({
                                            ...question,
                                            score: Number(event.target.value),
                                        }))
                                    }
                                    className={baseFieldClassName}
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-4 pt-6 sm:flex-row sm:items-center sm:justify-end">
                                <button
                                    type="button"
                                    className="px-6 py-3 text-[20px] font-medium text-[#17131F] transition hover:text-[#7F66D8]"
                                >
                                    Цуцлах
                                </button>

                                <Button
                                    type="button"
                                    className="h-[60px] rounded-[22px] bg-[linear-gradient(135deg,#9E85FF_0%,#7F66D8_100%)] px-10 text-[18px] font-semibold text-white shadow-[0_18px_36px_rgba(126,97,214,0.22)] hover:opacity-95"
                                >
                                    Хадгалах
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </section>
            </div>
        </main>
    );
}
