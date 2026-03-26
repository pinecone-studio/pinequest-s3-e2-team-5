"use client";

import { useState, useSyncExternalStore } from "react";
import { ChevronLeft } from "lucide-react";
import {
  completedExamStorageKey,
  defaultCompletedExams,
  mergeCompletedExams,
  type CompletedExamRecord,
} from "../../_data/completed-exams";
import ExamCard from "../../_component/ExamCard";

type ReviewPaletteStatus = "default" | "correct" | "wrong";

type ReviewQuestion = {
  id: string;
  order: number;
  prompt: string;
  scoreLabel: string;
  type: "text" | "choice";
  placeholder?: string;
  options?: {
    id: string;
    label: string;
    text: string;
  }[];
  selectedOptionId?: string;
  correctOptionId?: string;
};

const reviewPalette = [
  { order: 1, status: "correct" },
  { order: 2, status: "wrong" },
  { order: 3, status: "correct" },
  { order: 4, status: "correct" },
  { order: 5, status: "correct" },
  { order: 6, status: "correct" },
  { order: 7, status: "correct" },
  { order: 8, status: "correct" },
  { order: 9, status: "wrong" },
  { order: 10, status: "correct" },
  { order: 11, status: "correct" },
  { order: 12, status: "correct" },
  { order: 13, status: "correct" },
  { order: 14, status: "correct" },
  { order: 15, status: "correct" },
  { order: 16, status: "correct" },
  { order: 17, status: "wrong" },
  { order: 18, status: "correct" },
  { order: 19, status: "correct" },
  { order: 20, status: "correct" },
  { order: 21, status: "correct" },
  { order: 22, status: "correct" },
  { order: 23, status: "correct" },
  { order: 24, status: "wrong" },
  { order: 25, status: "correct" },
] as const satisfies { order: number; status: ReviewPaletteStatus }[];

const additionalReviewPrompts = [
  "Иргэний үндсэн эрхийн нэг аль вэ?",
  "Төрийн гурван өндөрлөгт аль нь багтдаг вэ?",
  "Үндсэн хууль ямар үүрэгтэй вэ?",
  "Нийгмийн бүлгийн жишээ аль вэ?",
  "Сонгуулийн гол зорилго юу вэ?",
  "Хариуцлагатай иргэн гэж хэнийг хэлэх вэ?",
  "Орон нутгийн өөрөө удирдах байгууллага аль вэ?",
  "Хууль зөрчвөл ямар үр дагавартай вэ?",
  "Ардчилалд хэвлэл мэдээлэл ямар үүрэгтэй вэ?",
  "Татварын үндсэн зориулалт юу вэ?",
  "Хүний эрхийг хамгаалах байгууллага аль вэ?",
  "Нийгмийн шударга ёс гэж юу вэ?",
  "Улсын бэлгэдэлд аль нь хамаарах вэ?",
  "Боловсролын гол ач холбогдол юу вэ?",
  "Иргэний үүргийн жишээ аль вэ?",
  "Төр ба иргэний харилцааны үндэс юу вэ?",
  "Хуулийн өмнө хүн бүр ямар байх ёстой вэ?",
  "Иргэний нийгмийн байгууллагын үүрэг юу вэ?",
  "Зөрчил гарвал ямар хариуцлага үүсэх вэ?",
  "Нийтийн ашиг сонирхол гэж юуг хэлэх вэ?",
  "Иргэдийн оролцоо нийгэмд ямар нөлөөтэй вэ?",
  "Төрийн байгууллага юунд захирагдах ёстой вэ?",
] as const;

const reviewOptionTemplates = [
  [
    { id: "a", label: "A.", text: "Хувийн сонирхлыг дээдлэх" },
    { id: "b", label: "Б.", text: "Хуулиар олгогдсон боломж" },
    { id: "c", label: "В.", text: "Бусдыг үл хүндэтгэх" },
    { id: "d", label: "Г.", text: "Дүрэм зөрчих эрх" },
  ],
  [
    { id: "a", label: "A.", text: "Иргэдийн дуу хоолойг тусгах" },
    { id: "b", label: "Б.", text: "Нууцаар шийдвэр гаргах" },
    { id: "c", label: "В.", text: "Хувийн ашиг сонирхлыг түрүүлэх" },
    { id: "d", label: "Г.", text: "Хариуцлагаас зайлсхийх" },
  ],
  [
    { id: "a", label: "A.", text: "Нийгмийн дэг журмыг хамгаалах" },
    { id: "b", label: "Б.", text: "Зөвхөн шийтгэл өгөх" },
    { id: "c", label: "В.", text: "Маргаан үүсгэх" },
    { id: "d", label: "Г.", text: "Хяналтгүй орхих" },
  ],
  [
    { id: "a", label: "A.", text: "Хамтын амьдралыг зохион байгуулах" },
    { id: "b", label: "Б.", text: "Хүчээр захирах" },
    { id: "c", label: "В.", text: "Мэдээллийг нуух" },
    { id: "d", label: "Г.", text: "Эрхийг хязгаарлах" },
  ],
] as const;

const baseReviewQuestions: ReviewQuestion[] = [
  {
    id: "review-q1",
    order: 1,
    prompt: "Нийгэм гэж юу вэ?",
    scoreLabel: "1/1 оноо",
    type: "text",
    placeholder: "Хариултаа бичнэ үү...",
  },
  {
    id: "review-q2",
    order: 2,
    prompt: "Ардчиллын гол зарчим аль нь вэ?",
    scoreLabel: "0/1 оноо",
    type: "choice",
    selectedOptionId: "c",
    correctOptionId: "b",
    options: [
      { id: "a", label: "A.", text: "Нэг хүний засаглал" },
      { id: "b", label: "Б.", text: "Иргэдийн оролцоо" },
      { id: "c", label: "В.", text: "Хүчээр захирах" },
      { id: "d", label: "Г.", text: "Хаант засаглал" },
    ],
  },
  {
    id: "review-q3",
    order: 3,
    prompt: "Хууль ямар үүрэгтэй вэ?",
    scoreLabel: "0/1 оноо",
    type: "choice",
    selectedOptionId: "c",
    correctOptionId: "c",
    options: [
      { id: "a", label: "A.", text: "Зөвхөн шийтгэх" },
      { id: "b", label: "Б.", text: "Нийгмийг задлах" },
      { id: "c", label: "В.", text: "Харилцааг зохицуулах" },
      { id: "d", label: "Г.", text: "Зөвхөн төрд үйлчлэх" },
    ],
  },
];

const generatedReviewQuestions: ReviewQuestion[] = additionalReviewPrompts.map(
  (prompt, index) => {
    const order = index + 4;
    const paletteItem = reviewPalette.find((item) => item.order === order);
    const options = reviewOptionTemplates[index % reviewOptionTemplates.length];
    const correctOptionId = options[1].id;
    const selectedOptionId =
      paletteItem?.status === "wrong" ? options[2].id : correctOptionId;

    return {
      id: `review-q${order}`,
      order,
      prompt,
      scoreLabel: paletteItem?.status === "wrong" ? "0/1 оноо" : "1/1 оноо",
      type: "choice",
      selectedOptionId,
      correctOptionId,
      options: [...options],
    };
  },
);

const reviewQuestions: ReviewQuestion[] = [
  ...baseReviewQuestions,
  ...generatedReviewQuestions,
];

const summaryRows = [
  { label: "Анги", value: "10-1" },
  { label: "Хугацаа", value: "28мин" },
  { label: "Оноо", value: "23/30" },
  { label: "Хувь", value: "76%" },
  { label: "Алдсан", value: "4" },
  { label: "Нийт дасгал", value: "28" },
] as const;

function getPaletteClasses(status: ReviewPaletteStatus) {
  if (status === "correct") {
    return "border-[#9CD89F] bg-[#EDFAEE] text-[#68A56C]";
  }

  if (status === "wrong") {
    return "border-[#F0A6A0] bg-[#FFF1F0] text-[#D86A62]";
  }

  return "border-[#D9D1F2] bg-white text-[#7E66DC]";
}

function getReviewOptionState(
  question: ReviewQuestion,
  optionId: string,
): "neutral" | "correct" | "wrong" {
  if (question.correctOptionId === optionId) {
    return "correct";
  }

  if (question.selectedOptionId === optionId) {
    return "wrong";
  }

  return "neutral";
}

function getReviewOptionClasses(state: "neutral" | "correct" | "wrong") {
  if (state === "correct") {
    return {
      row: "border-[#CDEBCE] bg-[#E8F7E9]",
      radio: "border-[#76B779]",
      dot: "bg-[#76B779]",
    };
  }

  if (state === "wrong") {
    return {
      row: "border-[#F0C2BD] bg-[#FBEAEA]",
      radio: "border-[#D66F68]",
      dot: "bg-[#D66F68]",
    };
  }

  return {
    row: "border-[#EAE6F5] bg-white",
    radio: "border-[#C8C3D8]",
    dot: "",
  };
}

export default function UrDunPage() {
  const [selectedResult, setSelectedResult] =
    useState<CompletedExamRecord | null>(null);
  const [focusedQuestion, setFocusedQuestion] = useState(1);

  const completedExams = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        const stored = window.localStorage.getItem(completedExamStorageKey);
        if (!stored) {
          return defaultCompletedExams;
        }

        const parsed = JSON.parse(stored) as CompletedExamRecord[];
        return mergeCompletedExams([...parsed, ...defaultCompletedExams]);
      } catch {
        return defaultCompletedExams;
      }
    },
    () => defaultCompletedExams,
  );

  const renderedCompletedExams = completedExams;

  const handleFocusQuestion = (order: number) => {
    setFocusedQuestion(order);

    const questionElement = document.getElementById(`review-question-${order}`);
    questionElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (selectedResult) {
    return (
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <button
          type="button"
          onClick={() => setSelectedResult(null)}
          className="mb-6 inline-flex items-center gap-3 text-[18px] font-medium text-[#36313F] transition hover:text-[#7E66DC]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F0FA]">
            <ChevronLeft className="h-5 w-5" />
          </span>
          Буцах
        </button>

        <div className="grid gap-5 lg:grid-cols-[212px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="rounded-[18px] border border-[#E6E1F2] bg-white p-4 shadow-[0_4px_12px_rgba(53,31,107,0.03)]">
              <h2 className="text-[16px] font-semibold text-[#25222D]">
                C.Анужин
              </h2>

              <div className="mt-4 space-y-2.5">
                {summaryRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-3 text-[14px]"
                  >
                    <span className="font-semibold text-[#3A3643]">
                      {row.label}
                    </span>
                    <span className="text-[#54505E]">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border border-[#E6E1F2] bg-white p-3 shadow-[0_4px_12px_rgba(53,31,107,0.03)]">
              <p className="mb-4 text-[14px] font-semibold text-[#2A2733]">
                Асуулт
              </p>

              <div className="mx-auto grid w-fit grid-cols-5 gap-2.5">
                {reviewPalette.map((item) => (
                  <button
                    key={item.order}
                    type="button"
                    onClick={() => handleFocusQuestion(item.order)}
                    className={[
                      "flex h-7 w-7 cursor-pointer items-center justify-center rounded-[10px] border text-[12px] font-medium transition",
                      focusedQuestion === item.order
                        ? "border-[#7E66DC] ring-2 ring-[#7E66DC]/15"
                        : "",
                      getPaletteClasses(item.status),
                    ].join(" ")}
                  >
                    {item.order}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            {reviewQuestions.map((question) => (
              <article
                key={question.id}
                id={`review-question-${question.order}`}
                className="scroll-mt-24 rounded-[16px] border border-[#E8E4F3] bg-white p-4 shadow-[0_4px_12px_rgba(53,31,107,0.03)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-[16px] font-semibold text-[#27242F]">
                    {question.order}. {question.prompt}
                  </h2>
                  <span className="shrink-0 text-[14px] font-medium text-[#5E5A68]">
                    {question.scoreLabel}
                  </span>
                </div>

                {question.type === "text" ? (
                  <div className="mt-4 rounded-[12px] border border-[#E9E4F6] bg-white px-4 py-3 text-[15px] text-[#A19CAA]">
                    {question.placeholder}
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {question.options?.map((option) => {
                      const state = getReviewOptionState(question, option.id);
                      const optionClasses = getReviewOptionClasses(state);

                      return (
                        <div
                          key={option.id}
                          className={[
                            "flex w-full items-center gap-3 rounded-[12px] border px-4 py-3 text-left",
                            optionClasses.row,
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              optionClasses.radio,
                            ].join(" ")}
                          >
                            {state !== "neutral" ? (
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${optionClasses.dot}`}
                              />
                            ) : null}
                          </span>

                          <span className="text-[15px] font-medium text-[#383540]">
                            {option.label} {option.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-gray-900">
          Миний үр дүнгүүд
        </h1>
        <p className="mt-1 text-[14px] text-[#5B5B5B]">
          Өмнө өгсөн шалгалтуудын дүнгүүд.
        </p>
      </div>

      <div className="mx-auto grid  gap-10 [grid-template-columns:repeat(auto-fit,minmax(264px,264px))]">
        {renderedCompletedExams.map((exam) => (
          <ExamCard
            key={`${exam.id}-${exam.date}`}
            {...exam}
            onClick={() => {
              setSelectedResult(exam);
              setFocusedQuestion(1);
            }}
          />
        ))}
      </div>
    </div>
  );
}
