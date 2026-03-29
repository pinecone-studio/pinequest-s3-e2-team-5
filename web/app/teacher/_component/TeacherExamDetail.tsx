"use client";

import { gql } from "@apollo/client";
import type { Reference } from "@apollo/client/cache";
import { useMutation, useQuery } from "@apollo/client/react";
import Link from "next/link";
import { ChevronLeft, PencilLine, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApolloErrorMessage } from "@/lib/apollo-error";
import { getSubjectDisplayLabel } from "../_data/dashboard";

type TeacherExamDetailProps = {
  examId: string;
};

type TeacherExamDetailData = {
  teacherExamDetail: {
    exam: {
      id: string;
      title: string;
      subject: string;
      grade: string;
      duration: number;
      questionCount: number;
      classroomName: string | null;
      scheduledDate: string | null;
      startTime: string | null;
    };
    questions: {
      id: string;
      type: "mcq" | "open" | "short";
      prompt: string;
      order: number;
      correctChoiceId: string | null;
      choices: {
        id: string;
        label: string;
        text: string;
      }[];
    }[];
  };
};

type DeleteExamData = {
  deleteExam: {
    __typename?: "Exam";
    id: string;
  };
};

const GET_TEACHER_EXAM_DETAIL = gql`
  query GetTeacherExamDetail($examId: String!) {
    teacherExamDetail(examId: $examId) {
      exam {
        id
        title
        subject
        grade
        duration
        questionCount
        classroomName
        scheduledDate
        startTime
      }
      questions {
        id
        type
        prompt
        order
        correctChoiceId
        choices {
          id
          label
          text
        }
      }
    }
  }
`;

const DELETE_EXAM = gql`
  mutation DeleteExam($examId: String!) {
    deleteExam(examId: $examId) {
      id
    }
  }
`;

function formatScheduledDate(date: string | null) {
  if (!date) {
    return "-";
  }

  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    return date;
  }

  return `${month}.${day}.${year}`;
}

export function TeacherExamDetail({ examId }: TeacherExamDetailProps) {
  const [focusedQuestion, setFocusedQuestion] = useState(1);
  const [actionError, setActionError] = useState("");
  const router = useRouter();
  const { data, loading, error } = useQuery<TeacherExamDetailData>(
    GET_TEACHER_EXAM_DETAIL,
    {
      variables: { examId },
    },
  );
  const [deleteExam, { loading: deleteExamLoading }] =
    useMutation<DeleteExamData>(DELETE_EXAM);

  if (loading) {
    return <div className="p-8 text-sm text-[#6F687D]">Уншиж байна...</div>;
  }

  if (error || !data?.teacherExamDetail) {
    return (
      <div className="p-8 text-sm text-red-600">
        {error?.message ?? "Шалгалтын мэдээлэл ачаалж чадсангүй."}
      </div>
    );
  }

  const { exam, questions } = data.teacherExamDetail;

  const handleFocusQuestion = (displayOrder: number) => {
    setFocusedQuestion(displayOrder);

    const questionElement = document.getElementById(
      `teacher-exam-question-${displayOrder}`,
    );
    questionElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDeleteExam = async () => {
    if (!window.confirm("Энэ шалгалтыг бүх асуулттай нь устгах уу?")) {
      return;
    }

    try {
      setActionError("");
      await deleteExam({
        variables: { examId },
        optimisticResponse: {
          deleteExam: {
            __typename: "Exam",
            id: examId,
          },
        },
        update(cache) {
          cache.modify({
            fields: {
              myExams(existingRefs: readonly Reference[] = [], { readField }) {
                return existingRefs.filter(
                  (reference) => readField("id", reference) !== examId,
                );
              },
              teacherScheduledExams(
                existingRefs: readonly Reference[] = [],
                { readField },
              ) {
                return existingRefs.filter(
                  (reference) => readField("id", reference) !== examId,
                );
              },
            },
          });
          cache.evict({
            id: cache.identify({ __typename: "Exam", id: examId }),
          });
          cache.gc();
        },
      });
      router.push("/teacher/exams");
    } catch (mutationError) {
      setActionError(
        getApolloErrorMessage(
          mutationError,
          "Шалгалт устгахад алдаа гарлаа.",
        ),
      );
    }
  };

  const infoGroups = [
    [
      {
        label: "Хичээл",
        value: getSubjectDisplayLabel(exam.subject),
        accent: true,
      },
      { label: "Сэдэв", value: exam.title },
      { label: "Анги", value: exam.grade },
    ],
    [
      { label: "Бүлэг", value: exam.classroomName || "Товлоогүй" },
      { label: "Өдөр", value: formatScheduledDate(exam.scheduledDate) },
      { label: "Эхлэх", value: exam.startTime || "--:--" },
    ],
    [
      { label: "Нийт даалгал", value: String(exam.questionCount) },
      { label: "Хугацаа", value: `${exam.duration} мин` },
    ],
  ];

  return (
    <section className="space-y-6">
      <div>
        <Link
          href="/teacher/exams"
          className="inline-flex items-center gap-3 text-[18px] font-medium text-[#36313F] transition hover:text-[#7E66DC]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F0FA]">
            <ChevronLeft className="h-5 w-5" />
          </span>
          Буцах
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="self-start lg:sticky lg:top-28">
          <div className="space-y-4">
            <section className="rounded-[18px] border border-[#E8E2F1] bg-white p-5 shadow-[0_4px_12px_rgba(53,31,107,0.04)]">
              <div className="space-y-4">
                {infoGroups.map((group, groupIndex) => (
                  <div key={`info-group-${groupIndex}`}>
                    <div className="space-y-2.5">
                      {group.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-end justify-between gap-4 text-[15px] text-[#23202A]"
                        >
                          <span
                            className={
                              item.accent
                                ? "relative pb-1 font-semibold after:absolute after:bottom-0 after:left-0 after:h-[4px] after:w-full after:rounded-full after:bg-[#CFC5F8]"
                                : "font-medium"
                            }
                          >
                            {item.label}
                          </span>
                          <span className="text-right text-[15px]">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {groupIndex < infoGroups.length - 1 ? (
                      <div className="mt-4 h-px bg-[#ECE6F3]" />
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-5 text-[#7F7A89]">
                <Link
                  href={`/teacher/exams/${exam.id}/edit`}
                  className="transition hover:text-[#7E66DC]"
                  aria-label="Шалгалт засах"
                >
                  <PencilLine className="h-6 w-6" strokeWidth={1.9} />
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDeleteExam()}
                  disabled={deleteExamLoading}
                  className="transition hover:text-[#DE5A52]"
                  aria-label="Шалгалт устгах"
                >
                  <Trash2 className="h-6 w-6" strokeWidth={1.9} />
                </button>
              </div>

              {actionError ? (
                <p className="mt-4 text-[14px] text-[#D25B56]">{actionError}</p>
              ) : null}
            </section>

            <section className="rounded-[18px] border border-[#E8E2F1] bg-white p-5 shadow-[0_4px_12px_rgba(53,31,107,0.04)]">
              <p className="text-[17px] font-semibold text-[#23202A]">Асуулт</p>

              <div className="mt-4 grid grid-cols-5 gap-3">
                {questions.map((question, index) => {
                  const displayOrder = index + 1;

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => handleFocusQuestion(displayOrder)}
                      className={`flex h-11 w-11 items-center justify-center rounded-[10px] border text-[15px] font-medium transition ${
                        focusedQuestion === displayOrder
                          ? "border-[#9077F7] bg-[#F0EEFF] text-[#6F5DE2]"
                          : "border-[#E8E2F1] bg-white text-[#2A2732] hover:border-[#D6CFF3]"
                      }`}
                    >
                      {displayOrder}
                    </button>
                  );
                })}

                <Link
                  href={`/teacher/exams/${exam.id}/edit`}
                  className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#E8E2F1] bg-white text-[#2A2732] transition hover:border-[#D6CFF3] hover:text-[#7E66DC]"
                  aria-label="Асуулт нэмэх"
                >
                  <Plus className="h-6 w-6" strokeWidth={1.8} />
                </Link>
              </div>
            </section>
          </div>
        </aside>

        <div className="space-y-4">
          {questions.map((question, index) => {
            const displayOrder = index + 1;

            return (
              <article
                key={question.id}
                id={`teacher-exam-question-${displayOrder}`}
                className="scroll-mt-24 rounded-[18px] border border-[#E8E2F1] bg-white p-5 shadow-[0_4px_12px_rgba(53,31,107,0.04)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-[18px] font-semibold text-[#1F1B27]">
                    {displayOrder}. {question.prompt}
                  </h2>
                  <span className="shrink-0 pt-0.5 text-[15px] font-medium text-[#2C2933]">
                    1 оноо
                  </span>
                </div>

                {question.type === "mcq" ? (
                  <div className="mt-5 space-y-4">
                    {question.choices.map((option) => {
                      const isSelected = option.id === question.correctChoiceId;

                      return (
                        <div key={option.id} className="flex items-center gap-3.5">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-white ${
                              isSelected ? "border-[#8F76F6]" : "border-[#BAB4C5]"
                            }`}
                          >
                            {isSelected ? (
                              <span className="h-4 w-4 rounded-full bg-[#8F76F6]" />
                            ) : null}
                          </span>

                          <div
                            className={`flex-1 rounded-[14px] border px-4 py-3.5 text-left ${
                              isSelected
                                ? "border-[#DDD5FF] bg-[#F0EEFF]"
                                : "border-[#E8E2F1] bg-white"
                            }`}
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
                  <div className="mt-5 rounded-[16px] border border-[#E8E2F1] bg-white px-4 py-4 text-[15px] leading-8 text-[#27242F]">
                    Нээлттэй асуулт
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
