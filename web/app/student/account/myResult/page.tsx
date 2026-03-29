"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useUser } from "@clerk/nextjs";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useEffect } from "react";
import { cloudflareProfileSyncedEvent } from "@/components/auth/cloudflare-student-sync";
import ExamCard from "../../_component/ExamCard";
import {
  formatStudentExamTimestamp,
  getStudentExamPresentation,
} from "../../_data/student-exam-presentation";

type SubmissionSummary = {
  id: string;
  examId: string;
  title: string;
  subject: string;
  grade: string;
  duration: number;
  questionCount: number;
  correctAnswers: number;
  scorePercent: number;
  submittedAt: number;
};

type SubmissionAnswerReview = {
  questionId: string;
  order: number;
  prompt: string;
  type: "mcq" | "open" | "short";
  answerText: string | null;
  selectedChoiceId: string | null;
  correctChoiceId: string | null;
  isCorrect: boolean | null;
  choices: {
    id: string;
    label: string;
    text: string;
  }[];
};

type SubmissionDetail = SubmissionSummary & {
  answers: SubmissionAnswerReview[];
};

type MyExamSubmissionsData = {
  myExamSubmissions: SubmissionSummary[];
};

type StudentExamSubmissionDetailData = {
  studentExamSubmissionDetail: SubmissionDetail;
};

type ReviewPaletteStatus = "correct" | "wrong" | "pending";

const GET_MY_EXAM_SUBMISSIONS = gql`
  query GetMyExamSubmissions {
    myExamSubmissions {
      id
      examId
      title
      subject
      grade
      duration
      questionCount
      correctAnswers
      scorePercent
      submittedAt
    }
  }
`;

const GET_STUDENT_EXAM_SUBMISSION_DETAIL = gql`
  query GetStudentExamSubmissionDetail($submissionId: String!) {
    studentExamSubmissionDetail(submissionId: $submissionId) {
      id
      examId
      title
      subject
      grade
      duration
      questionCount
      correctAnswers
      scorePercent
      submittedAt
      scheduledDate
      startTime
      answers {
        questionId
        order
        prompt
        type
        answerText
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
    return "border-[#9CD89F] bg-[#EDFAEE] text-[#68A56C]";
  }

  if (status === "wrong") {
    return "border-[#F0A6A0] bg-[#FFF1F0] text-[#D86A62]";
  }

  return "border-[#F2D68B] bg-[#FFF8E6] text-[#B8860B]";
}

function getReviewOptionState(
  question: SubmissionAnswerReview,
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

export default function StudentResultPage() {
  const { user } = useUser();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [focusedQuestion, setFocusedQuestion] = useState(1);

  const {
    data: submissionsData,
    loading: submissionsLoading,
    error: submissionsError,
    refetch: refetchSubmissions,
  } = useQuery<MyExamSubmissionsData>(GET_MY_EXAM_SUBMISSIONS);
  const {
    data: detailData,
    loading: detailLoading,
    error: detailError,
  } = useQuery<StudentExamSubmissionDetailData>(
    GET_STUDENT_EXAM_SUBMISSION_DETAIL,
    {
      variables: { submissionId: selectedSubmissionId ?? "" },
      skip: !selectedSubmissionId,
    },
  );

  const submissions = submissionsData?.myExamSubmissions ?? [];
  const selectedResult = detailData?.studentExamSubmissionDetail ?? null;
  const displayName =
    [user?.lastName, user?.firstName].filter(Boolean).join(" ") ||
    user?.fullName ||
    user?.username ||
    "Сурагч";

  useEffect(() => {
    const handleProfileSynced = () => {
      void refetchSubmissions();
    };

    window.addEventListener(cloudflareProfileSyncedEvent, handleProfileSynced);

    return () => {
      window.removeEventListener(
        cloudflareProfileSyncedEvent,
        handleProfileSynced,
      );
    };
  }, [refetchSubmissions]);

  const palette = useMemo<
    { order: number; status: ReviewPaletteStatus }[]
  >(() => {
    return (
      selectedResult?.answers.map((answer) => ({
        order: answer.order,
        status:
          answer.type === "mcq"
            ? answer.isCorrect
              ? "correct"
              : "wrong"
            : "pending",
      })) ?? []
    );
  }, [selectedResult]);

  const handleFocusQuestion = (order: number) => {
    setFocusedQuestion(order);

    const questionElement = document.getElementById(`review-question-${order}`);
    questionElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (submissionsLoading && !submissionsData) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-[#6B7280]">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
        Үр дүнгүүдийг ачаалж байна...
      </div>
    );
  }

  if (submissionsError) {
    return (
      <div className="rounded-[18px] border border-[#F0C2BD] bg-[#FBEAEA] px-5 py-4 text-[#B63B3B]">
        {submissionsError.message}
      </div>
    );
  }

  if (selectedSubmissionId && detailLoading && !selectedResult) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-[#6B7280]">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
        Дэлгэрэнгүй мэдээллийг ачаалж байна...
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="rounded-[18px] border border-[#F0C2BD] bg-[#FBEAEA] px-5 py-4 text-[#B63B3B]">
        {detailError.message}
      </div>
    );
  }

  if (selectedResult) {
    const summaryRows = [
      {
        label: "Огноо",
        value: formatStudentExamTimestamp(selectedResult.submittedAt),
      },
      {
        label: "Оноо",
        value: `${selectedResult.correctAnswers}/${selectedResult.questionCount}`,
      },
      { label: "Хувь", value: `${selectedResult.scorePercent}%` },
      { label: "Хугацаа", value: `${selectedResult.duration} мин` },
      { label: "Нийт дасгал", value: String(selectedResult.questionCount) },
    ];

    return (
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <button
          type="button"
          onClick={() => setSelectedSubmissionId(null)}
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
                {displayName}
              </h2>
              <p className="mt-1 text-[14px] text-[#6B7280]">
                {
                  getStudentExamPresentation(selectedResult.subject)
                    .subjectLabel
                }{" "}
                / {selectedResult.title}
              </p>

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
                {palette.map((item) => (
                  <button
                    key={item.order}
                    type="button"
                    onClick={() => handleFocusQuestion(item.order)}
                    className={[
                      "flex h-7 w-7 cursor-pointer items-center justify-center rounded-[10px] border text-[12px] font-medium transition",
                      focusedQuestion === item.order
                        ? "ring-2 ring-[#7E66DC]/15"
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
            {selectedResult.answers.map((question) => (
              <article
                key={question.questionId}
                id={`review-question-${question.order}`}
                className="scroll-mt-24 rounded-[16px] border border-[#E8E4F3] bg-white p-4 shadow-[0_4px_12px_rgba(53,31,107,0.03)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-[16px] font-semibold text-[#27242F]">
                    {question.order}. {question.prompt}
                  </h2>
                  <span className="shrink-0 text-[14px] font-medium text-[#5E5A68]">
                    {question.type === "mcq"
                      ? question.isCorrect
                        ? "1/1 оноо"
                        : "0/1 оноо"
                      : "Шалгах хүлээгдэж байна"}
                  </span>
                </div>

                {question.type === "mcq" ? (
                  <div className="mt-4 space-y-3">
                    {question.choices.map((option) => {
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
                            {option.label}. {option.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[12px] border border-[#E9E4F6] bg-white px-4 py-3 text-[15px] leading-7 text-[#5C5964]">
                    {question.answerText?.trim() || "Хариулаагүй байна."}
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

      {submissions.length === 0 ? (
        <div className="rounded-[20px] border border-[#E7E8F0] bg-white px-6 py-8 text-[#6B7280]">
          Та одоогоор ямар нэг шалгалт илгээгээгүй байна.
        </div>
      ) : (
        <div className="mx-auto grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(264px,264px))]">
          {submissions.map((submission) => {
            const presentation = getStudentExamPresentation(submission.subject);

            return (
              <ExamCard
                key={submission.id}
                iconKey={presentation.iconKey}
                subject={presentation.subjectLabel}
                topic={submission.title}
                grade={submission.grade}
                minutes={submission.duration}
                exercises={submission.questionCount}
                date={formatStudentExamTimestamp(submission.submittedAt)}
                bg={presentation.bg}
                iconBg={presentation.iconBg}
                onClick={() => {
                  setSelectedSubmissionId(submission.id);
                  setFocusedQuestion(1);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
