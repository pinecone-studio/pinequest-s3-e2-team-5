"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";

type StudentReviewDetailProps = {
  examId: string;
  studentId: string;
};

type TeacherStudentSubmissionDetailData = {
  teacherStudentSubmissionDetail: {
    exam: {
      id: string;
      title: string;
    };
    studentId: string;
    studentName: string;
    section: string;
    score: string;
    percent: number;
    durationMinutes: number;
    startedAt: number;
    submittedAt: number;
    answers: {
      questionId: string;
      order: number;
      prompt: string;
      type: "mcq" | "open" | "short";
      submittedText: string | null;
      selectedChoiceId: string | null;
      correctChoiceId: string | null;
      isCorrect: boolean | null;
      choices: {
        id: string;
        label: string;
        text: string;
      }[];
    }[];
  };
};

type ReviewPaletteStatus = "pending" | "correct" | "wrong";

const GET_TEACHER_STUDENT_SUBMISSION_DETAIL = gql`
  query GetTeacherStudentSubmissionDetail($examId: String!, $studentId: String!) {
    teacherStudentSubmissionDetail(examId: $examId, studentId: $studentId) {
      studentId
      studentName
      section
      score
      percent
      durationMinutes
      startedAt
      submittedAt
      exam {
        id
        title
      }
      answers {
        questionId
        order
        prompt
        type
        submittedText
        selectedChoiceId
        correctChoiceId
        isCorrect
        choices {
          id
          label
          text
        }
      }
    }
  }
`;

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
  question: TeacherStudentSubmissionDetailData["teacherStudentSubmissionDetail"]["answers"][number],
  optionId: string,
): "neutral" | "correct" | "wrong" {
  if (question.correctChoiceId === optionId) {
    return "correct";
  }

  if (question.selectedChoiceId === optionId) {
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

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}.${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours(),
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function StudentReviewDetail({
  examId,
  studentId,
}: StudentReviewDetailProps) {
  const [focusedQuestion, setFocusedQuestion] = useState(1);
  const { data, loading, error } = useQuery<TeacherStudentSubmissionDetailData>(
    GET_TEACHER_STUDENT_SUBMISSION_DETAIL,
    {
      variables: { examId, studentId },
    },
  );

  const detail = data?.teacherStudentSubmissionDetail;
  const reviewPalette = useMemo<{ order: number; status: ReviewPaletteStatus }[]>(
    () =>
      detail?.answers.map((answer) => ({
        order: answer.order,
        status:
          answer.type === "mcq"
            ? answer.isCorrect
              ? "correct"
              : "wrong"
            : "pending",
      })) ?? [],
    [detail],
  );

  if (loading) {
    return <div className="p-8 text-sm text-[#6F687D]">Уншиж байна...</div>;
  }

  if (error || !detail) {
    return (
      <div className="p-8 text-sm text-red-600">
        {error?.message ?? "Сурагчийн дэлгэрэнгүй мэдээлэл олдсонгүй."}
      </div>
    );
  }

  const summaryRows = [
    [
      { label: "Эхэлсэн", value: formatTimestamp(detail.startedAt) },
      { label: "Дууссан", value: formatTimestamp(detail.submittedAt) },
    ],
    [
      { label: "Нийт даалгал", value: String(detail.answers.length) },
      { label: "Хугацаа", value: `${detail.durationMinutes} мин` },
    ],
    [
      { label: "Оноо", value: detail.score },
      { label: "Хувь", value: `${detail.percent}%` },
    ],
  ];

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
                href={`/teacher/dashboard/${examId}`}
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
                  {detail.studentName}
                </h2>
                <span className="text-[17px] font-medium text-[#25222D]">
                  {detail.section}
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
          {detail.answers.map((question) => (
            <article
              key={question.questionId}
              id={`review-question-${question.order}`}
              className="scroll-mt-24 rounded-[18px] border border-[#E8E2F1] bg-white p-5 shadow-[0_4px_12px_rgba(53,31,107,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[18px] font-semibold text-[#1F1B27]">
                  {question.order}. {question.prompt}
                </h2>
                <span className="shrink-0 pt-0.5 text-[15px] font-medium text-[#2C2933]">
                  {question.type === "mcq"
                    ? question.isCorrect
                      ? "1/1 оноо"
                      : "0/1 оноо"
                    : "Шалгах хүлээгдэж байна"}
                </span>
              </div>

              {question.type === "mcq" ? (
                <div className="mt-5 space-y-3.5">
                  {question.choices.map((option) => {
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
                            {option.label}. {option.text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-[14px] bg-[#F8E4E3] px-4 py-3.5 text-[15px] text-[#27242F]">
                  {question.submittedText || "Хариулаагүй байна."}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
