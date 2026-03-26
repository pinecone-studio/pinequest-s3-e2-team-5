"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import type { ExamCard, StudentResult } from "../_data/dashboard";

type ReviewPaletteStatus = "default" | "correct" | "wrong";

type ReviewQuestion = {
  id: string;
  order: number;
  prompt: string;
  scoreLabel: string;
  type: "text" | "choice";
  answerText?: string;
  submittedText?: string;
  options?: {
    id: string;
    label: string;
    text: string;
  }[];
  selectedOptionId?: string;
  correctOptionId?: string;
};

const reviewPalette = [
  { order: 1, status: "wrong" },
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
    scoreLabel: "0/1 оноо",
    type: "text",
    submittedText: "Мэдэхгүй",
    answerText:
      "Нийгэм гэдэг нь хүмүүс хоорондоо хамтран амьдарч, харилцаж, дүрэм журам, үнэт зүйл, байгууллага, соёлын хүрээнд зохион байгуулалттай оршиж буй хамтын амьдралын тогтолцоо юм.",
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
    scoreLabel: "1/1 оноо",
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

function getPaletteClasses(status: ReviewPaletteStatus) {
  if (status === "correct") {
    return "border-[#7FCF84] bg-[#F2FBF2] text-[#47A34D]";
  }

  if (status === "wrong") {
    return "border-[#EE8F88] bg-[#FFF5F4] text-[#DB5B52]";
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
      row: "border-[#CFEED1] bg-[#E3F6E5]",
      radio: "border-[#62BC69]",
      dot: "bg-[#76B779]",
    };
  }

  if (state === "wrong") {
    return {
      row: "border-[#F3D0CC] bg-[#F8E4E3]",
      radio: "border-[#D66F68]",
      dot: "bg-[#D66F68]",
    };
  }

  return {
    row: "border-[#E8E2F1] bg-white",
    radio: "border-[#BBB5C7]",
    dot: "",
  };
}

function formatStudentDisplayName(name: string) {
  if (name.includes(".")) {
    return name;
  }

  const parts = name.trim().split(/\s+/);

  if (parts.length < 2) {
    return name;
  }

  const [familyName] = parts;
  const givenName = parts[parts.length - 1];

  return `${familyName.charAt(0)}.${givenName}`;
}

function parseScore(score: string) {
  const [earnedRaw, totalRaw] = score.split("/");
  const earned = Number.parseInt(earnedRaw, 10);
  const total = Number.parseInt(totalRaw, 10);

  return {
    earned: Number.isFinite(earned) ? earned : 0,
    total: Number.isFinite(total) ? total : 0,
  };
}

function buildSummaryRows(exam: ExamCard, student: StudentResult) {
  const { earned, total } = parseScore(student.score);
  const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;
  const missed = Math.max(total - earned, 0);
  const [hourRaw, minuteRaw] = exam.startTime.split(":");
  const startHour = Number.parseInt(hourRaw, 10);
  const startMinute = Number.parseInt(minuteRaw, 10);
  const normalizedHour = Number.isFinite(startHour) ? startHour : 0;
  const normalizedMinute = Number.isFinite(startMinute) ? startMinute : 0;
  const startTotalMinutes = normalizedHour * 60 + normalizedMinute;
  const endTotalMinutes = startTotalMinutes + student.durationMinutes;

  const formatClock = (totalMinutes: number) => {
    const hours24 = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const meridiem = hours24 >= 12 ? "pm" : "am";
    const hours12 = hours24 % 12 || 12;

    return `${hours12}:${String(minutes).padStart(2, "0")}:00 ${meridiem}`;
  };

  return [
    [
      { label: "Эхэлсэн", value: formatClock(startTotalMinutes) },
      { label: "Дууссан", value: formatClock(endTotalMinutes) },
    ],
    [
      { label: "Нийт даалгал", value: String(total) },
      { label: "Алдсан", value: String(missed) },
    ],
    [
      { label: "Оноо", value: student.score },
      { label: "Хувь", value: `${percentage}%` },
    ],
  ];
}

function formatStudentSection(section: string) {
  const [grade, groupRaw] = section.split("-");
  const groupNumber = Number.parseInt(groupRaw, 10);

  if (!grade || !Number.isFinite(groupNumber) || groupNumber <= 0) {
    return section;
  }

  return `${grade}${String.fromCharCode(64 + groupNumber)}`;
}

type StudentReviewDetailProps = {
  exam: ExamCard;
  student: StudentResult;
};

export function StudentReviewDetail({
  exam,
  student,
}: StudentReviewDetailProps) {
  const [focusedQuestion, setFocusedQuestion] = useState(1);
  const summaryRows = buildSummaryRows(exam, student);
  const displaySection = formatStudentSection(student.section);

  const handleFocusQuestion = (order: number) => {
    setFocusedQuestion(order);

    const questionElement = document.getElementById(`review-question-${order}`);
    questionElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="self-start lg:sticky lg:top-28">
          <div className="space-y-4">
            <div>
              <Link
                href={`/teacher/dashboard/${exam.id}`}
                className="inline-flex items-center gap-3 text-[18px] font-medium text-[#36313F] transition hover:text-[#7E66DC]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F0FA]">
                  <ChevronLeft className="h-5 w-5" />
                </span>
                Буцах
              </Link>
            </div>

            <div className="rounded-[18px] border border-[#E8E2F1] bg-white p-4 shadow-[0_4px_12px_rgba(53,31,107,0.04)]">
              <div className="flex items-center justify-between rounded-[14px] bg-[#F2F0FF] px-4 py-2.5">
                <h2 className="text-[17px] font-semibold text-[#25222D]">
                  {formatStudentDisplayName(student.name)}
                </h2>
                <span className="text-[17px] font-medium text-[#25222D]">
                  {displaySection}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {summaryRows.map((group, index) => (
                  <div key={`summary-group-${index}`}>
                    <div className="space-y-2.5">
                      {group.map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center justify-between gap-3 text-[14px]"
                        >
                          <span className="font-semibold text-[#23202A]">
                            {row.label}
                          </span>
                          <span className="text-right text-[14px] text-[#23202A]">
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {index < summaryRows.length - 1 ? (
                      <div className="mt-3 h-px bg-[#EAE5F2]" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border border-[#E8E2F1] bg-white p-4 shadow-[0_4px_12px_rgba(53,31,107,0.04)]">
              <p className="mb-4 text-[17px] font-semibold text-[#23202A]">
                Асуулт
              </p>

              <div className="grid grid-cols-5 gap-3">
                {reviewPalette.map((item) => (
                  <button
                    key={item.order}
                    type="button"
                    onClick={() => handleFocusQuestion(item.order)}
                    className={[
                      "flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] border text-[14px] font-medium transition",
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
          </div>
        </aside>

        <div className="space-y-4">
          {reviewQuestions.map((question) => (
            <article
              key={question.id}
              id={`review-question-${question.order}`}
              className="scroll-mt-24 rounded-[18px] border border-[#E8E2F1] bg-white p-5 shadow-[0_4px_12px_rgba(53,31,107,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[18px] font-semibold text-[#1F1B27]">
                  {question.order}. {question.prompt}
                </h2>
                <span className="shrink-0 pt-0.5 text-[15px] font-medium text-[#2C2933]">
                  {question.scoreLabel}
                </span>
              </div>

              {question.type === "text" ? (
                <div className="mt-5 space-y-5">
                  <div className="rounded-[14px] bg-[#F8E4E3] px-4 py-3.5 text-[15px] text-[#27242F]">
                    {question.submittedText ?? "Мэдэхгүй"}
                  </div>

                  <div className="overflow-hidden rounded-[14px] bg-[#F4F4F4]">
                    <div className="flex">
                      <div className="w-1.5 bg-[#75C278]" />
                      <div className="px-4 py-3.5 text-[15px] leading-8 text-[#27242F]">
                        {question.answerText}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-3.5">
                  {question.options?.map((option) => {
                    const state = getReviewOptionState(question, option.id);
                    const optionClasses = getReviewOptionClasses(state);

                    return (
                      <div key={option.id} className="flex items-center gap-3.5">
                        <span
                          className={[
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-white",
                            optionClasses.radio,
                          ].join(" ")}
                        >
                          {state !== "neutral" ? (
                            <span
                              className={`h-4 w-4 rounded-full ${optionClasses.dot}`}
                            />
                          ) : null}
                        </span>

                        <div
                          className={[
                            "flex-1 rounded-[14px] border px-4 py-3.5 text-left",
                            optionClasses.row,
                          ].join(" ")}
                        >
                          <span className="text-[15px] font-medium text-[#27242F]">
                            {option.label} {option.text}
                          </span>
                        </div>
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
