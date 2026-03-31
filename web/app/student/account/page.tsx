"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { CheckCheck, Clock3, Info, Loader2, PenLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cloudflareProfileSyncedEvent } from "@/components/auth/cloudflare-student-sync";
import ExamCard from "../_component/ExamCard";
import {
  getStudentExamHeader,
  getStudentExamPresentation,
} from "../_data/student-exam-presentation";

type AvailableExam = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  grade: string;
  duration: number;
  questionCount: number;
  scheduledDate: string;
  startTime: string;
};

type StudentExamQuestion = {
  id: string;
  type: "mcq" | "open" | "short";
  question: string;
  order: number;
  choices: {
    id: string;
    label: string;
    text: string;
  }[];
};

type AvailableExamsData = {
  availableExamsForStudent: AvailableExam[];
};

type StudentExamDetailData = {
  studentExamDetail: AvailableExam & {
    questions: StudentExamQuestion[];
  };
};

type SubmitStudentExamData = {
  submitStudentExam: {
    id: string;
  };
};

type StudentAnswerDraft = {
  selectedChoiceId?: string;
  answerText?: string;
};

const GET_AVAILABLE_EXAMS = gql`
  query GetAvailableExamsForStudent {
    availableExamsForStudent {
      id
      title
      subject
      description
      grade
      scheduledDate
      startTime
      duration
      questionCount
    }
  }
`;

const GET_STUDENT_EXAM_DETAIL = gql`
  query GetStudentExamDetail($examId: String!) {
    studentExamDetail(examId: $examId) {
      id
      title
      subject
      description
      grade
      scheduledDate
      startTime
      duration
      questionCount
      questions {
        id
        type
        question
        order
        choices {
          id
          label
          text
        }
      }
    }
  }
`;

const SUBMIT_STUDENT_EXAM = gql`
  mutation SubmitStudentExam($input: SubmitStudentExamInput!) {
    submitStudentExam(input: $input) {
      id
    }
  }
`;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

function formatScheduledDate(date: string | null | undefined) {
  if (!date) {
    return "Товлоогүй";
  }

  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    return date;
  }

  return `${year}/${month}/${day}`;
}

function formatScheduledTime(time: string | null | undefined) {
  if (!time) {
    return "--:--";
  }

  return time.slice(0, 5);
}

function getExamEndTime(
  startTime: string | null | undefined,
  durationMinutes: number,
) {
  if (!startTime) {
    return "--:--";
  }

  const [hours, minutes] = startTime.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return startTime;
  }

  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const endHours = Math.floor(normalizedMinutes / 60);
  const endMinutes = normalizedMinutes % 60;

  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
    2,
    "0",
  )}`;
}

export default function StudentAccountPage() {
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [startedExamId, setStartedExamId] = useState<string | null>(null);
  const [submittedExamName, setSubmittedExamName] = useState<string | null>(
    null,
  );
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [focusedQuestion, setFocusedQuestion] = useState(1);
  const [answers, setAnswers] = useState<Record<string, StudentAnswerDraft>>(
    {},
  );
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState("");

  const activeExamId = startedExamId ?? selectedExamId;
  const {
    data: availableExamsData,
    loading: availableExamsLoading,
    error: availableExamsError,
    refetch: refetchAvailableExams,
  } = useQuery<AvailableExamsData>(GET_AVAILABLE_EXAMS);

  useEffect(() => {
    console.log(availableExamsData);
  }, [availableExamsData]);

  const {
    data: activeExamData,
    loading: activeExamLoading,
    error: activeExamError,
  } = useQuery<StudentExamDetailData>(GET_STUDENT_EXAM_DETAIL, {
    variables: { examId: activeExamId ?? "" },
    skip: !activeExamId,
  });
  const [submitStudentExam, { loading: submitLoading }] =
    useMutation<SubmitStudentExamData>(SUBMIT_STUDENT_EXAM);

  const availableExams = availableExamsData?.availableExamsForStudent ?? [];
  const activeExam = activeExamData?.studentExamDetail ?? null;
  const questionPalette = useMemo(
    () => activeExam?.questions.map((question) => question.order) ?? [],
    [activeExam],
  );

  useEffect(() => {
    if (!startedExamId) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedExamId]);

  useEffect(() => {
    const handleProfileSynced = () => {
      void refetchAvailableExams();
    };

    window.addEventListener(cloudflareProfileSyncedEvent, handleProfileSynced);

    return () => {
      window.removeEventListener(
        cloudflareProfileSyncedEvent,
        handleProfileSynced,
      );
    };
  }, [refetchAvailableExams]);

  const handleFocusQuestion = (order: number) => {
    setFocusedQuestion(order);

    const questionElement = document.getElementById(`question-${order}`);
    questionElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectChoice = (
    questionId: string,
    optionId: string,
    order: number,
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: {
        ...previous[questionId],
        selectedChoiceId: optionId,
      },
    }));
    setFocusedQuestion(order);
  };

  const handleChangeTextAnswer = (questionId: string, answerText: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: {
        ...previous[questionId],
        answerText,
      },
    }));
  };

  const handleStartExam = () => {
    if (!activeExam) {
      return;
    }

    setSubmitError("");
    setSubmittedExamName(null);
    setStartedExamId(activeExam.id);
    setExamStartedAt(Date.now());
    setSecondsLeft(activeExam.duration * 60);
    setFocusedQuestion(activeExam.questions[0]?.order ?? 1);
    setAnswers({});
  };

  const handleSubmitExam = async () => {
    if (!activeExam) {
      return;
    }

    try {
      setSubmitError("");

      await submitStudentExam({
        variables: {
          input: {
            examId: activeExam.id,
            startedAt: examStartedAt,
            answers: activeExam.questions.map((question) => ({
              questionId: question.id,
              selectedChoiceId: answers[question.id]?.selectedChoiceId ?? null,
              answerText: answers[question.id]?.answerText?.trim() || null,
            })),
          },
        },
      });

      await refetchAvailableExams();
      setSubmittedExamName(
        getStudentExamHeader(activeExam.subject, activeExam.title),
      );
      setStartedExamId(null);
      setSelectedExamId(null);
      setExamStartedAt(null);
      setSecondsLeft(0);
      setFocusedQuestion(1);
      setAnswers({});
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Шалгалт илгээхэд алдаа гарлаа.",
      );
    }
  };

  if (availableExamsLoading && !availableExamsData) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-[#6B7280]">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
        Шалгалтуудыг ачаалж байна...
      </div>
    );
  }

  if (availableExamsError) {
    return (
      <div className="rounded-[18px] border border-[#F0C2BD] bg-[#FBEAEA] px-5 py-4 text-[#B63B3B]">
        {availableExamsError.message}
      </div>
    );
  }

  if (startedExamId && activeExamLoading && !activeExam) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-[#6B7280]">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
        Шалгалтыг бэлдэж байна...
      </div>
    );
  }

  if (activeExamError) {
    return (
      <div className="rounded-[18px] border border-[#F0C2BD] bg-[#FBEAEA] px-5 py-4 text-[#B63B3B]">
        {activeExamError.message}
      </div>
    );
  }

  if (startedExamId && activeExam) {
    return (
      <section className="relative left-1/2 -mt-10 min-h-[calc(100vh-72px)] w-screen -translate-x-1/2 bg-[#FCFCFF]">
        <div className="border-b border-[#ECE8F6] bg-white">
          <div className="mx-auto flex h-[72px] w-full max-w-[1245px] items-center justify-between px-8">
            <p className="text-[18px] font-semibold tracking-tight text-[#161616]">
              {getStudentExamHeader(activeExam.subject, activeExam.title)}
            </p>

            <div className="inline-flex items-center gap-2 rounded-[16px] bg-[#F6F1FF] px-4 py-2 text-[16px] font-medium text-[#38324A]">
              <Clock3 className="h-5 w-5" strokeWidth={2.1} />
              <span>{formatTime(secondsLeft)}</span>
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1245px] gap-5 px-8 py-8 lg:grid-cols-[208px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[18px] border border-[#E6E1F2] bg-white p-3 shadow-[0_4px_12px_rgba(53,31,107,0.03)]">
            <p className="mb-4 text-[14px] font-semibold text-[#2A2733]">
              Асуулт
            </p>

            <div className="mx-auto grid w-fit grid-cols-5 gap-2.5">
              {questionPalette.map((order) => {
                const question = activeExam.questions.find(
                  (currentQuestion) => currentQuestion.order === order,
                );
                const isFocused = focusedQuestion === order;
                const answerDraft = question ? answers[question.id] : undefined;
                const isAnswered = Boolean(
                  answerDraft?.selectedChoiceId ||
                  answerDraft?.answerText?.trim(),
                );

                return (
                  <button
                    key={order}
                    type="button"
                    onClick={() => handleFocusQuestion(order)}
                    className={[
                      "flex h-7 w-7 cursor-pointer items-center justify-center rounded-[10px] border text-[12px] font-medium transition",
                      isAnswered
                        ? "border-[#9D86EA] bg-[#EEE8FF] text-[#7E66DC]"
                        : isFocused
                          ? "border-[#D9D1F2] bg-[#FAFAFF] text-[#2F2A3B]"
                          : "border-[#9D86EA] bg-white text-[#7E66DC]",
                    ].join(" ")}
                  >
                    {order}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-6">
            {activeExam.questions.map((question) => (
              <article
                key={question.id}
                id={`question-${question.order}`}
                className="rounded-[16px] border border-[#E8E4F3] bg-white p-4 shadow-[0_4px_12px_rgba(53,31,107,0.03)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-[16px] font-semibold text-[#27242F]">
                    {question.order}. {question.question}
                  </h2>
                  <span className="shrink-0 text-[14px] font-medium text-[#5E5A68]">
                    1 оноо
                  </span>
                </div>

                {question.type === "mcq" ? (
                  <div className="mt-4 space-y-3">
                    {question.choices.map((option) => {
                      const isSelected =
                        answers[question.id]?.selectedChoiceId === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            handleSelectChoice(
                              question.id,
                              option.id,
                              question.order,
                            )
                          }
                          className={[
                            "flex w-full items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition",
                            isSelected
                              ? "border-[#DCD5FA] bg-[#F2EEFF]"
                              : "border-[#EAE6F5] bg-white hover:border-[#DCD5FA]",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              isSelected
                                ? "border-[#8C73E2]"
                                : "border-[#C8C3D8]",
                            ].join(" ")}
                          >
                            {isSelected ? (
                              <span className="h-2.5 w-2.5 rounded-full bg-[#8C73E2]" />
                            ) : null}
                          </span>
                          <span className="text-[15px] font-medium text-[#383540]">
                            {option.label}. {option.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    value={answers[question.id]?.answerText ?? ""}
                    onChange={(event) =>
                      handleChangeTextAnswer(question.id, event.target.value)
                    }
                    placeholder="Хариултаа энд бичнэ үү..."
                    className="mt-4 min-h-[132px] w-full rounded-[12px] border border-[#EAE6F5] bg-white px-4 py-3 text-[15px] text-[#383540] outline-none transition focus:border-[#A592FF] focus:ring-4 focus:ring-[#A592FF]/10"
                  />
                )}
              </article>
            ))}

            {submitError ? (
              <div className="rounded-[16px] border border-[#F0C2BD] bg-[#FBEAEA] px-4 py-3 text-[#B63B3B]">
                {submitError}
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => void handleSubmitExam()}
                disabled={submitLoading}
                className="flex h-[48px] min-w-[180px] items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,#9D86EA_0%,#8E74E0_100%)] px-8 text-[16px] font-semibold text-white shadow-[inset_0_-8px_0_rgba(95,74,171,0.20),0_10px_18px_rgba(144,118,226,0.20)] transition hover:brightness-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitLoading ? "Илгээж байна..." : "Шалгалт илгээх"}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (submittedExamName) {
    return (
      <section className="animate-in fade-in slide-in-from-bottom-2 flex justify-center pt-12 duration-300">
        <div className="w-full max-w-[936px] rounded-[24px] border border-[#DCD7FF] bg-[#F8F6FF] px-10 py-6 shadow-[0_10px_24px_rgba(124,99,230,0.05)]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEE9FF] text-[#8B74E2]">
              <CheckCheck className="h-5 w-5" strokeWidth={2.2} />
            </div>

            <div>
              <h2 className="text-[24px] font-semibold tracking-tight text-[#222126]">
                Шалгалт амжилттай илгээгдлээ
              </h2>
              <p className="text-[17px] text-[#9A98A6]">{submittedExamName}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (selectedExamId) {
    return (
      <section className="animate-in fade-in slide-in-from-bottom-2 flex min-h-[calc(100vh-148px)] w-full items-start justify-center px-4 pt-24 duration-300 sm:pt-32">
        <div className="flex w-full max-w-[534px] flex-col gap-6 rounded-[30px] border border-[#E2DBFB] bg-[#FBFAFF] px-5 pb-5 pt-6 shadow-[0_10px_28px_rgba(132,112,222,0.06)]">
          {activeExamLoading || !activeExam ? (
            <div className="flex min-h-[240px] items-center justify-center text-[#6B7280]">
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Шалгалтын мэдээллийг ачаалж байна...
            </div>
          ) : (
            <>
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <h1 className="text-[18px] font-semibold leading-none text-[#1D1A24] sm:text-[19px]">
                    {
                      getStudentExamPresentation(activeExam.subject)
                        .subjectLabel
                    }{" "}
                    <span className="font-medium text-[#7A7386]">
                      /{activeExam.title}/
                    </span>
                  </h1>

                  <p className="text-[14px] leading-6 font-normal text-[#A7A1B2]">
                    {activeExam.description || "Тайлбар оруулаагүй байна."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[14px] font-medium text-[#25222B] shadow-[0_2px_8px_rgba(79,56,145,0.04)]">
                    <Clock3 className="h-[14px] w-[14px]" strokeWidth={2.15} />
                    <span>{activeExam.duration} мин</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[14px] font-medium text-[#25222B] shadow-[0_2px_8px_rgba(79,56,145,0.04)]">
                    <PenLine
                      className="h-[14px] w-[14px] text-black"
                      strokeWidth={2.15}
                    />
                    <span>{activeExam.questionCount} дасгал</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-2">
                  <div className="border-l border-[#D8D1F6] pl-3">
                    <p className="text-[12px] font-medium uppercase tracking-wide text-[#B1A9BF]">
                      Эхлэх
                    </p>
                    <span className="mt-1 block text-[16px] font-semibold leading-none text-[#26222F] sm:text-[17px]">
                      {formatScheduledTime(activeExam.startTime)}
                    </span>
                  </div>
                  <div className="border-l border-[#D8D1F6] pl-3">
                    <p className="text-[12px] font-medium uppercase tracking-wide text-[#B1A9BF]">
                      Дуусах
                    </p>
                    <span className="mt-1 block text-[16px] font-semibold leading-none text-[#26222F] sm:text-[17px]">
                      {getExamEndTime(
                        activeExam.startTime,
                        activeExam.duration,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full rounded-[14px] border border-[#DDD7F5] bg-[#F3F1FF] px-4 py-3">
                <div className="flex items-start gap-3">
                  <Info
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#16151B]"
                    strokeWidth={2.1}
                  />
                  <p className="text-[12px] leading-6 font-medium text-[#3A3645] sm:text-[13px]">
                    Шалгалтыг эхлүүлсэн тохиолдолд хугацаа зогсохгүй үргэлжлэн
                    тоологдож, дуусмагц автоматаар илгээгдэхийг анхаарна уу.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <div className="flex w-full items-center justify-end gap-10 pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedExamId(null)}
                    className="cursor-pointer text-[15px] leading-none font-semibold text-[#232028] transition hover:text-[#7C63E6]"
                  >
                    Буцах
                  </button>

                  <button
                    type="button"
                    onClick={handleStartExam}
                    disabled={activeExam.questionCount === 0}
                    className="flex h-[36px] min-w-[102px] cursor-pointer items-center justify-center rounded-[13px] bg-[linear-gradient(180deg,#A789F4_0%,#8C6EE4_100%)] px-7 text-[15px] leading-none font-semibold text-white shadow-[inset_0_-4px_0_rgba(104,78,187,0.28),0_7px_14px_rgba(144,118,226,0.20)] transition hover:brightness-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Эхлэх
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-gray-900">
          Боломжтой шалгалтууд
        </h1>
        <p className="mt-1 text-[14px] text-[#5B5B5B]">
          Одоогоор идэвхтэй байгаа шалгалтуудаа өгнө үү.
        </p>
      </div>

      {availableExams.length === 0 ? (
        <div className="rounded-[20px] border border-[#E7E8F0] bg-white px-6 py-8 text-[#6B7280]">
          Танд одоогоор нээлттэй шалгалт алга байна.
        </div>
      ) : (
        <div className="mx-auto grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(264px,264px))]">
          {availableExams.map((exam) => {
            const presentation = getStudentExamPresentation(exam.subject);

            return (
              <ExamCard
                key={exam.id}
                iconKey={presentation.iconKey}
                subject={presentation.subjectLabel}
                topic={exam.title}
                grade={exam.grade}
                minutes={exam.duration}
                exercises={exam.questionCount}
                scheduledDate={exam.scheduledDate}
                startTime={exam.startTime}
                date="Идэвхтэй"
                bg={presentation.bg}
                iconBg={presentation.iconBg}
                onClick={() => {
                  setSubmittedExamName(null);
                  setSelectedExamId(exam.id);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
