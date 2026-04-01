"use client";

import { gql } from "@apollo/client";
import type { Reference } from "@apollo/client/cache";
import { useMutation, useQuery } from "@apollo/client/react";
import Link from "next/link";
import { ChevronLeft, PencilLine, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MathInline } from "@/components/math";
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
      description: string | null;
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
      question: string;
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

type UpdateExamData = {
  updateExam: {
    id: string;
    title: string;
    subject: string;
    description: string | null;
    duration: number;
    grade: string;
  };
};

type DeleteQuestionData = {
  deleteQuestion: {
    id: string;
  };
};

const subjectOptions = [
  { value: "social", label: "Нийгэм" },
  { value: "civics", label: "Иргэний боловсрол" },
  { value: "math", label: "Математик" },
  { value: "english", label: "Англи хэл" },
  { value: "chemistry", label: "Хими" },
  { value: "physics", label: "Физик" },
] as const;

const gradeOptions = [
  "9-р анги",
  "10-р анги",
  "11-р анги",
  "12-р анги",
] as const;

const durationOptions = [30, 45, 60, 90, 120] as const;

const examDialogFieldClassName =
  "h-[56px] w-full rounded-[16px] border border-[#E9E0F7] bg-white px-4 text-[16px] text-[#1A1623] outline-none transition placeholder:text-[#8E8A94] focus:border-[#B69AF8] focus:ring-4 focus:ring-[#B69AF8]/15";

const GET_TEACHER_EXAM_DETAIL = gql`
  query GetTeacherExamDetail($examId: String!) {
    teacherExamDetail(examId: $examId) {
      exam {
        id
        title
        subject
        description
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
        question
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

const UPDATE_EXAM = gql`
  mutation UpdateExam($input: updateExamInput!) {
    updateExam(input: $input) {
      id
      title
      subject
      description
      duration
      grade
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

const DELETE_QUESTION = gql`
  mutation DeleteQuestion($questionId: String!) {
    deleteQuestion(questionId: $questionId) {
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

  return `${day}.${month}.${year}`;
}

function hasMathContent(value: string) {
  return /\$[^$]+\$|(\\[a-zA-Z]+)|\^|_/.test(value);
}

function renderMathText(value: string) {
  if (!value.trim()) {
    return null;
  }

  const formulaMatches = [...value.matchAll(/\$([^$]+)\$/g)];

  if (formulaMatches.length > 0) {
    const nodes: ReactNode[] = [];
    let cursor = 0;

    formulaMatches.forEach((match, index) => {
      const [fullMatch, latex] = match;
      const start = match.index ?? 0;
      const plainText = value.slice(cursor, start);

      if (plainText) {
        nodes.push(<span key={`text-${index}`}>{plainText}</span>);
      }

      nodes.push(
        <MathInline
          key={`math-${index}`}
          math={latex}
          className="mx-1 align-middle text-[1em] text-[#27242F]"
        />,
      );

      cursor = start + fullMatch.length;
    });

    const trailingText = value.slice(cursor);
    if (trailingText) {
      nodes.push(<span key="text-trailing">{trailingText}</span>);
    }

    return nodes;
  }

  if (hasMathContent(value)) {
    return <MathInline math={value} className="align-middle text-[1em] text-[#27242F]" />;
  }

  return value;
}

export function TeacherExamDetail({ examId }: TeacherExamDetailProps) {
  const [focusedQuestion, setFocusedQuestion] = useState(1);
  const [actionError, setActionError] = useState("");
  const [questionActionError, setQuestionActionError] = useState("");
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [examMeta, setExamMeta] =
    useState<TeacherExamDetailData["teacherExamDetail"]["exam"] | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editDuration, setEditDuration] = useState(60);
  const [editExamError, setEditExamError] = useState("");
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
    null,
  );
  const router = useRouter();
  const { data, loading, error, refetch } = useQuery<TeacherExamDetailData>(
    GET_TEACHER_EXAM_DETAIL,
    {
      variables: { examId },
    },
  );
  const [updateExam, { loading: updateExamLoading }] =
    useMutation<UpdateExamData>(UPDATE_EXAM);
  const [deleteExam, { loading: deleteExamLoading }] =
    useMutation<DeleteExamData>(DELETE_EXAM);
  const [deleteQuestion] = useMutation<DeleteQuestionData>(DELETE_QUESTION);

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

  const resolvedExam = examMeta ?? data.teacherExamDetail.exam;
  const { questions } = data.teacherExamDetail;

  const handleFocusQuestion = (displayOrder: number) => {
    setFocusedQuestion(displayOrder);

    const questionElement = document.getElementById(
      `teacher-exam-question-${displayOrder}`,
    );
    questionElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openExamEditDialog = () => {
    setEditSubject(resolvedExam.subject);
    setEditTitle(resolvedExam.title);
    setEditGrade(resolvedExam.grade);
    setEditDuration(resolvedExam.duration);
    setEditExamError("");
    setIsExamDialogOpen(true);
  };

  const handleUpdateExam = async () => {
    if (!examId) {
      setEditExamError("Шалгалтын ID олдсонгүй.");
      return;
    }

    if (!editSubject || !editTitle.trim() || !editGrade || editDuration <= 0) {
      setEditExamError("Хичээл, сэдэв, анги, хугацааг бүрэн бөглөнө үү.");
      return;
    }

    try {
      setEditExamError("");

      const res = await updateExam({
        variables: {
          input: {
            examId,
            title: editTitle.trim(),
            subject: editSubject,
            description: resolvedExam.description ?? "",
            duration: editDuration,
            grade: editGrade,
          },
        },
      });

      if (res.data?.updateExam) {
        setExamMeta({
          ...resolvedExam,
          ...res.data.updateExam,
        });
        setIsExamDialogOpen(false);
        return;
      }

      setEditExamError("Шалгалтын мэдээлэл шинэчлэгдсэнгүй.");
    } catch (mutationError) {
      setEditExamError(
        getApolloErrorMessage(
          mutationError,
          "Шалгалтын мэдээлэл шинэчлэхэд алдаа гарлаа.",
        ),
      );
    }
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

  const handleDeleteQuestion = async (
    questionId: string,
    displayOrder: number,
  ) => {
    if (!window.confirm("Энэ асуултыг устгах уу?")) {
      return;
    }

    try {
      setQuestionActionError("");
      setDeletingQuestionId(questionId);
      await deleteQuestion({
        variables: { questionId },
      });
      await refetch();
      setFocusedQuestion((current) => {
        if (questions.length <= 1) {
          return 1;
        }

        return Math.max(1, Math.min(current, displayOrder - 1 || 1));
      });
    } catch (mutationError) {
      setQuestionActionError(
        getApolloErrorMessage(
          mutationError,
          "Асуулт устгахад алдаа гарлаа.",
        ),
      );
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const infoGroups = [
    [
      {
        label: "Хичээл",
        value: getSubjectDisplayLabel(resolvedExam.subject),
        accent: true,
      },
      { label: "Сэдэв", value: resolvedExam.title },
      { label: "Анги", value: resolvedExam.grade },
    ],
    [
      { label: "Бүлэг", value: resolvedExam.classroomName || "Товлоогүй" },
      { label: "Өдөр", value: formatScheduledDate(resolvedExam.scheduledDate) },
      { label: "Эхлэх", value: resolvedExam.startTime || "--:--" },
    ],
    [
      { label: "Нийт даалгал", value: String(questions.length) },
      { label: "Хугацаа", value: `${resolvedExam.duration} мин` },
    ],
  ];

  return (
    <section className="space-y-6">
      <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] rounded-[24px] border border-[#E8E2F1] bg-white px-6 py-6 shadow-[0_20px_70px_rgba(28,18,54,0.18)] sm:max-w-[580px]"
        >
          <DialogHeader className="gap-0">
            <DialogTitle className="text-[28px] font-semibold tracking-tight text-[#111111]">
              Үндсэн мэдээлэл
            </DialogTitle>
          </DialogHeader>

          <div className="mt-3 space-y-5">
            <div className="space-y-2.5">
              <label className="block text-[16px] font-medium text-[#111111]">
                Хичээл
              </label>
              <div className="relative">
                <select
                  value={editSubject}
                  onChange={(event) => setEditSubject(event.target.value)}
                  className={`${examDialogFieldClassName} appearance-none pr-14 ${
                    editSubject ? "" : "text-[#8E8A94]"
                  }`}
                >
                  <option value="" disabled>
                    Хичээл сонгох
                  </option>
                  {subjectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-[16px] font-medium text-[#111111]">
                Сэдвийн нэр
              </label>
              <input
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                placeholder="Жишээ: Алгебр Тест-1"
                className={examDialogFieldClassName}
              />
            </div>

            <div className="space-y-2.5">
              <label className="block text-[16px] font-medium text-[#111111]">
                Анги
              </label>
              <div className="relative">
                <select
                  value={editGrade}
                  onChange={(event) => setEditGrade(event.target.value)}
                  className={`${examDialogFieldClassName} appearance-none pr-14 ${
                    editGrade ? "" : "text-[#8E8A94]"
                  }`}
                >
                  <option value="" disabled>
                    Анги сонгох
                  </option>
                  {gradeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-[16px] font-medium text-[#111111]">
                Хугацаа(минут)
              </label>
              <div className="relative">
                <select
                  value={String(editDuration)}
                  onChange={(event) => setEditDuration(Number(event.target.value))}
                  className={`${examDialogFieldClassName} appearance-none pr-14`}
                >
                  {durationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {editExamError ? (
            <p className="mt-4 text-[14px] text-[#D25B56]">{editExamError}</p>
          ) : null}

          <div className="-mx-6 -mb-6 mt-8 flex items-center justify-end gap-6 border-t border-[#ECE6F3] px-6 py-5">
            <button
              type="button"
              onClick={() => setIsExamDialogOpen(false)}
              className="text-[18px] font-medium text-[#111111] transition hover:text-[#7E66DC]"
            >
              Буцах
            </button>
            <button
              type="button"
              onClick={handleUpdateExam}
              disabled={updateExamLoading}
              className="inline-flex h-12 items-center justify-center rounded-[20px] bg-[#9E81F0] px-8 text-[18px] font-semibold text-white shadow-[inset_0_-5px_0_rgba(103,79,184,0.32),0_12px_22px_rgba(158,129,240,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {updateExamLoading ? "Хадгалж байна..." : "Үргэлжлүүлэх"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

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

              <div className="mt-5 flex items-center gap-4 text-[#7F7A89]">
                <button
                  type="button"
                  onClick={openExamEditDialog}
                  className="transition hover:text-[#7E66DC]"
                  aria-label="Шалгалтын мэдээлэл засах"
                >
                  <PencilLine className="h-6 w-6" strokeWidth={1.9} />
                </button>
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
                  href={`/teacher/exams/${resolvedExam.id}/edit`}
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
                    {displayOrder}. {renderMathText(question.question)}
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
                              {option.label}. {renderMathText(option.text)}
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

                <div className="mt-5 flex items-center gap-5 text-[#7F7A89]">
                  <Link
                    href={{
                      pathname: `/teacher/exams/${resolvedExam.id}/edit`,
                      query: { questionId: question.id },
                    }}
                    className="transition hover:text-[#7E66DC]"
                    aria-label={`${displayOrder}-р асуулт засах`}
                  >
                    <PencilLine className="h-6 w-6" strokeWidth={1.9} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDeleteQuestion(question.id, displayOrder)}
                    disabled={deletingQuestionId === question.id}
                    className="transition hover:text-[#DE5A52] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`${displayOrder}-р асуулт устгах`}
                  >
                    <Trash2 className="h-6 w-6" strokeWidth={1.9} />
                  </button>
                </div>
              </article>
            );
          })}

          {questionActionError ? (
            <p className="text-[14px] text-[#D25B56]">{questionActionError}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
