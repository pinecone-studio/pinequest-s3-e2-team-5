"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { ChevronLeft, TriangleAlert } from "lucide-react";
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
    reasonForTermination: string | null;
    hasIntegrityViolation: boolean;
    integrityReason:
      | "BACKGROUND"
      | "SESSION_REPLACED"
      | "NO_FACE"
      | "MULTIPLE_FACES"
      | null;
    integrityMessage: string | null;
    answers: {
      questionId: string;
      order: number;
      question: string;
      type: "mcq" | "open" | "short";
      submittedText: string | null;
      correctAnswerText: string | null;
      aiExplanation: string | null;
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
type ReviewOptionState = "neutral" | "correct" | "wrong" | "selected-correct";

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
      reasonForTermination
      hasIntegrityViolation
      integrityReason
      integrityMessage
      exam {
        id
        title
      }
      answers {
        questionId
        order
        question
        type
        submittedText
        correctAnswerText
        aiExplanation
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
): ReviewOptionState {
  const isSelected = question.selectedChoiceId === optionId;
  const isCorrect = question.correctChoiceId === optionId;

  if (isSelected && isCorrect) {
    return "selected-correct";
  }

  if (isCorrect) {
    return "correct";
  }

  if (isSelected) {
    return "wrong";
  }

  return "neutral";
}

function getReviewOptionClasses(state: ReviewOptionState) {
  if (state === "selected-correct") {
    return {
      row: "border-[#CFE7D0] bg-[#E8F6E8]",
      radio: "border-[#63B56B]",
      dot: "bg-[#63B56B]",
    };
  }

  if (state === "correct") {
    return {
      row: "border-[#CFE7D0] bg-[#E8F6E8]",
      radio: "border-[#63B56B]",
      dot: "bg-[#63B56B]",
    };
  }

  if (state === "wrong") {
    return {
      row: "border-[#EDD7D7] bg-[#F5E7E7]",
      radio: "border-[#D96563]",
      dot: "bg-[#D96563]",
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

function getIntegrityReasonLabel(
  reason: TeacherStudentSubmissionDetailData["teacherStudentSubmissionDetail"]["integrityReason"],
) {
  switch (reason) {
    case "BACKGROUND":
      return "Аппаас гарсан";
    case "SESSION_REPLACED":
      return "Төхөөрөмж солигдсон";
    case "NO_FACE":
      return "Нүүр илрээгүй";
    case "MULTIPLE_FACES":
      return "Олон нүүр илэрсэн";
    default:
      return "Зөрчил";
  }
}

function getPercentRingStyle(percent: number) {
  const safePercent = Math.min(100, Math.max(0, percent));

  return {
    background: `conic-gradient(#8E76F6 0% ${safePercent}%, #ECE8F7 ${safePercent}% 100%)`,
  };
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
            ? answer.selectedChoiceId
              ? answer.isCorrect
                ? "correct"
                : "wrong"
              : "pending"
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
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[18px] font-semibold leading-tight text-[#25222D]">
                  {detail.studentName}
                </h2>
                <span className="text-[17px] font-medium text-[#4C465A]">
                  {detail.section}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 rounded-[14px] border border-[#EAE5F2] p-3">
                <div className="border-r border-[#EAE5F2] pr-2">
                  <p className="text-[14px] text-[#9993A7]">Эхэлсэн</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#2B2734]">
                    {formatTimestamp(detail.startedAt).split(" ")[1]}
                  </p>
                </div>
                <div className="pl-2">
                  <p className="text-[14px] text-[#9993A7]">Дууссан</p>
                  <p className="mt-1 text-[16px] font-semibold text-[#2B2734]">
                    {formatTimestamp(detail.submittedAt).split(" ")[1]}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-[14px] text-[#6E687C]">Нийт оноо</p>
                    <p className="text-[33px] leading-none font-semibold text-[#272231]">
                      {detail.score}
                    </p>
                  </div>
                  <div>
                    <p className="text-[14px] text-[#6E687C]">Хугацаа</p>
                    <p className="text-[16px] font-medium text-[#272231]">
                      {detail.durationMinutes} мин
                    </p>
                  </div>
                </div>

                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={getPercentRingStyle(detail.percent)}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[18px] font-semibold text-[#4B4265]">
                    {detail.percent}%
                  </div>
                </div>
              </div>

              {detail.hasIntegrityViolation ? (
                <div className="mt-4 rounded-[16px] border border-[#F1C7C4] bg-[#FFF6F5] p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#E86A61]/12 px-3 py-1 text-[12px] font-semibold text-[#C94A41]">
                      Зөрчил
                    </span>
                    <span className="text-[13px] font-medium text-[#B24B44]">
                      {getIntegrityReasonLabel(detail.integrityReason)}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] leading-6 text-[#7D3A36]">
                    {detail.integrityMessage ?? "Integrity зөрчлийн улмаас шалгалт автоматаар илгээгдсэн."}
                  </p>
                </div>
              ) : null}
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

            {detail.reasonForTermination ? (
              <div className="rounded-[24px] border border-[#E6E0F4] bg-white px-7 py-8 shadow-[0_6px_16px_rgba(53,31,107,0.06)]">
                <div className="flex items-center gap-3 text-[#24212B]">
                  <TriangleAlert className="h-8 w-8 text-[#D96563]" />
                  <h3 className="text-[18px] font-semibold">Зөрчил</h3>
                </div>

                <div className="mt-7 space-y-4">
                  <p className="text-[17px] font-semibold text-[#24212B]">
                    Автомат илгээлт
                  </p>
                  <p className="max-w-[240px] text-[16px] leading-8 text-[#2C2933]">
                    {detail.reasonForTermination}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="space-y-4">
          {detail.answers.map((question) => (
            <article
              key={question.questionId}
              id={`review-question-${question.order}`}
              className="scroll-mt-24 rounded-[18px] border border-[#E8E2F1] bg-white px-5 py-4 shadow-[0_4px_12px_rgba(53,31,107,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[18px] font-semibold text-[#1F1B27]">
                  {question.order}. {question.question}
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
                <div className="mt-5 space-y-2.5">
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
                            "flex-1 rounded-[14px] border px-4 py-3 text-left text-[15px] font-medium text-[#3A3447]",
                            optionClasses.row,
                          ].join(" ")}
                        >
                          {option.label}. {option.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-[14px] bg-[#F4E6E6] px-4 py-3.5 text-[15px] font-medium text-[#4A414E]">
                  {question.submittedText || "Хариулаагүй байна."}
                </div>
              )}

              {question.type === "mcq" &&
              question.isCorrect === false &&
              question.aiExplanation ? (
                <div className="mt-4 rounded-[12px] border-l-[3px] border-[#74BE7B] bg-[#F5F5F5] px-4 py-3.5 text-[15px] leading-7 text-[#4A4455]">
                  {question.aiExplanation}
                </div>
              ) : null}

              {question.type !== "mcq" && question.correctAnswerText ? (
                <div className="mt-4 rounded-[12px] border-l-[3px] border-[#74BE7B] bg-[#F5F5F5] px-4 py-3.5 text-[15px] leading-7 text-[#4A4455]">
                  {question.correctAnswerText}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
