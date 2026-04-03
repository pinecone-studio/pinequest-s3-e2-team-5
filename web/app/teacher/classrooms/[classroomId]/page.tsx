"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  ChevronDown,
  ChevronLeft,
  MoreVertical,
  QrCode,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApolloErrorMessage } from "@/lib/apollo-error";

type TeacherClassroomDetailData = {
  teacherClassroomDetail: {
    classroom: {
      id: string;
      className: string;
      classCode: string;
      studentCount: number;
      createdAt: number;
    };
    examCount: number;
    averagePercent: number;
    students: {
      id: string;
      studentId: string;
      name: string;
      score: string | null;
      percent: number | null;
      durationMinutes: number | null;
      submittedAt: number | null;
      hasIntegrityViolation: boolean;
      integrityReason:
        | "BACKGROUND"
        | "SESSION_REPLACED"
        | "NO_FACE"
        | "MULTIPLE_FACES"
        | null;
      integrityMessage: string | null;
    }[];
  };
};

type UpdateClassroomData = {
  updateClassroom: {
    id: string;
    className: string;
  };
};

type SubjectPalette = {
  accentColor: string;
};

const subjectPaletteMap: Record<string, SubjectPalette> = {
  Нийгэм: { accentColor: "#8B6FF7" },
  "Иргэний боловсрол": { accentColor: "#73A5F4" },
  Математик: { accentColor: "#69B7D5" },
  "Англи хэл": { accentColor: "#7CA970" },
  Хими: { accentColor: "#D98AEF" },
  Физик: { accentColor: "#6C95EA" },
};

const GET_TEACHER_CLASSROOM_DETAIL = gql`
  query GetTeacherClassroomDetail($classroomId: String!) {
    teacherClassroomDetail(classroomId: $classroomId) {
      examCount
      averagePercent
      classroom {
        id
        className
        classCode
        studentCount
        createdAt
      }
      students {
        id
        studentId
        name
        score
        percent
        durationMinutes
        submittedAt
        hasIntegrityViolation
        integrityReason
        integrityMessage
      }
    }
  }
`;

const UPDATE_CLASSROOM_MUTATION = gql`
  mutation UpdateClassroom($input: updateClassroomInput!) {
    updateClassroom(input: $input) {
      id
      className
    }
  }
`;

const gradeOptions = ["9", "10", "11", "12"];

const dialogFieldClassName =
  "h-[58px] w-full rounded-[16px] border border-[#E9E0F7] bg-white px-4 text-[16px] text-[#1A1623] outline-none transition placeholder:text-[#8E8A94] focus:border-[#B59AF8] focus:ring-4 focus:ring-[#B59AF8]/12";

function parseClassroomName(className: string) {
  const rawClassName = className.trim();
  const [classroomKey, ...subjectParts] = rawClassName.split(" - ");
  const subjectLabel = subjectParts.join(" - ").trim() || rawClassName;
  const keyMatch = classroomKey?.match(/^(\d{1,2})(.*)$/);
  const gradeValue = keyMatch?.[1]?.trim() ?? "";
  const sectionValue = keyMatch?.[2]?.trim() ?? "";
  const palette =
    subjectPaletteMap[subjectLabel] ?? subjectPaletteMap["Нийгэм"];

  return {
    subjectLabel,
    gradeLabel: gradeValue ? `${gradeValue}-р анги` : rawClassName,
    sectionLabel: sectionValue || "Тодорхойгүй",
    accentColor: palette.accentColor,
  };
}

function buildClassroomName({
  grade,
  section,
  subjectLabel,
}: {
  grade: string;
  section: string;
  subjectLabel: string;
}) {
  return `${grade}${section} - ${subjectLabel}`;
}

function formatSubmittedDate(timestamp: number | null) {
  if (!timestamp) {
    return "-";
  }

  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}

function formatRowValue(value: number | string | null, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return `${value}${suffix}`;
}

function getIntegrityReasonLabel(
  reason: TeacherClassroomDetailData["teacherClassroomDetail"]["students"][number]["integrityReason"],
) {
  switch (reason) {
    case "BACKGROUND":
      return "Аппаас гарсан";
    case "SESSION_REPLACED":
      return "Session солигдсон";
    case "NO_FACE":
      return "Нүүр алга";
    case "MULTIPLE_FACES":
      return "Олон нүүр";
    default:
      return "Зөрчил";
  }
}

export default function TeacherClassroomDetailPage() {
  const params = useParams<{ classroomId: string }>();
  const classroomId = params.classroomId;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [section, setSection] = useState("");
  const [editError, setEditError] = useState("");
  const { data, loading, error, refetch } =
    useQuery<TeacherClassroomDetailData>(GET_TEACHER_CLASSROOM_DETAIL, {
      variables: { classroomId },
      skip: !classroomId,
    });
  const [updateClassroom, { loading: updatingClassroom }] =
    useMutation<UpdateClassroomData>(UPDATE_CLASSROOM_MUTATION);

  const errorMessage = error
    ? getApolloErrorMessage(error, "Ангийн мэдээлэл ачаалж чадсангүй.")
    : "";
  const detail = data?.teacherClassroomDetail;
  const classroom = detail?.classroom;
  const parsedClassroom = classroom
    ? parseClassroomName(classroom.className)
    : null;

  useEffect(() => {
    if (!parsedClassroom) {
      return;
    }

    setSelectedSubject(parsedClassroom.subjectLabel);
    setSelectedGrade(parsedClassroom.gradeLabel.replace("-р анги", "").trim());
    setSection(
      parsedClassroom.sectionLabel === "Тодорхойгүй"
        ? ""
        : parsedClassroom.sectionLabel,
    );
  }, [parsedClassroom]);

  if (loading) {
    return (
      <main className="p-8 text-sm text-[#6F687D]">
        Ангийн мэдээллийг уншиж байна...
      </main>
    );
  }

  if (errorMessage || !detail || !classroom || !parsedClassroom) {
    return (
      <main className="p-8 text-sm text-[#D25B56]">
        {errorMessage || "Анги олдсонгүй."}
      </main>
    );
  }

  const handleUpdateClassroom = async () => {
    try {
      const normalizedSection = section.trim().toUpperCase();
      if (!selectedSubject || !selectedGrade || !normalizedSection) {
        throw new Error("Хичээл, анги, бүлгээ бүрэн бөглөнө үү.");
      }

      setEditError("");

      await updateClassroom({
        variables: {
          input: {
            classroomId,
            className: buildClassroomName({
              grade: selectedGrade,
              section: normalizedSection,
              subjectLabel: selectedSubject,
            }),
          },
        },
      });

      await refetch();
      setIsEditDialogOpen(false);
    } catch (mutationError) {
      setEditError(
        getApolloErrorMessage(
          mutationError,
          "Ангийн мэдээллийг шинэчилж чадсангүй.",
        ),
      );
    }
  };

  return (
    <section className="mx-auto max-w-[1040px]">
      <Link
        href="/teacher"
        className="inline-flex items-center gap-3 h-[112px] text-[18px] font-medium text-[#36313F] transition hover:text-[#7E66DC]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F0FA]">
          <ChevronLeft className="h-5 w-5" />
        </span>
        <span>Буцах</span>
      </Link>

      <div className="grid gap-6 xl:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="self-start xl:sticky xl:top-28">
          <section className="relative h-[186px] w-[264px] overflow-hidden rounded-[24px] border border-[#E8E2F1] bg-white py-5 shadow-[0_10px_28px_rgba(53,31,107,0.06)]">
            <div className="relative flex h-full flex-col">
              <div className="space-y-5">
                <div className="flex items-center gap-3 pr-6">
                  <span
                    className="h-[28px] w-[12px] shrink-0 rounded-r-[12px] opacity-45"
                    style={{ backgroundColor: parsedClassroom.accentColor }}
                  />
                  <h2 className="text-[18px] font-semibold tracking-tight text-[#17131F]">
                    {parsedClassroom.subjectLabel}
                  </h2>
                </div>

                <div className="space-y-5 px-6">
                  <p className="text-[16px] font-medium text-[#17131F]">
                    {parsedClassroom.gradeLabel}
                  </p>

                  <div className="flex items-center gap-4 text-[16px] font-medium text-[#17131F]">
                    <span>Бүлэг</span>
                    <span>{parsedClassroom.sectionLabel}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto border-t border-[#ECE6F3] px-6 pt-2">
                <div className=" flex w-54 h-7 items-center justify-between">
                  <div className="flex items-center gap-2.5 text-[#17131F]">
                    <Users className="h-5 w-5" />
                    <span className="text-[16px] font-medium">
                      {classroom.studentCount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[#17131F]">
                    <QrCode className="h-5 w-5" />
                    <span className="text-[16px] font-medium">
                      {classroom.classCode}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </aside>

        <section className="overflow-hidden rounded-[16px] border border-[#E8E2F1] bg-white shadow-[0_4px_12px_rgba(53,31,107,0.04)]">
          <div className="grid grid-cols-[52px_minmax(150px,1.6fr)_108px_96px_108px_120px_40px] items-center border-b border-[#ECE6F3] bg-white px-5 py-4 text-[14px] font-semibold text-[#111111] md:px-6">
            <span>№</span>
            <span>Сурагч</span>
            <span>Оноо</span>
            <span>Хувь</span>
            <span>Хугацаа</span>
            <span>Өдөр</span>
            <span />
          </div>

          {detail.students.length > 0 ? (
            <div>
              {detail.students.map((student, index) => (
                <div
                  key={student.id}
                  className={`grid grid-cols-[52px_minmax(150px,1.6fr)_108px_96px_108px_120px_40px] items-center px-5 py-5 text-[14px] text-[#1A1A1A] md:px-6 ${
                    index % 2 === 0 ? "bg-[#F7F6FE]" : "bg-white"
                  }`}
                >
                  <span>{index + 1}</span>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{student.name}</span>
                    {student.hasIntegrityViolation ? (
                      <span
                        title={student.integrityMessage ?? undefined}
                        className="inline-flex w-fit rounded-full bg-[#FFF1F0] px-2.5 py-1 text-[11px] font-semibold text-[#C84C43]"
                      >
                        Зөрчил: {getIntegrityReasonLabel(student.integrityReason)}
                      </span>
                    ) : null}
                  </div>
                  <span>{formatRowValue(student.score)}</span>
                  <span>{formatRowValue(student.percent, "%")}</span>
                  <span>{formatRowValue(student.durationMinutes, " мин")}</span>
                  <span>{formatSubmittedDate(student.submittedAt)}</span>
                  <span className="flex justify-center text-[#A5AEC5]">
                    <MoreVertical className="h-4 w-4" />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-[15px] text-[#6F687D]">
              Одоогоор энэ ангид бүртгэлтэй сурагч алга байна.
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditError("");
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/35 supports-backdrop-filter:backdrop-blur-sm"
          className="max-w-[calc(100%-2rem)] rounded-[28px] border border-[#E8E2F1] bg-white px-7 pb-8 pt-8 shadow-[0_30px_90px_rgba(20,14,35,0.24)] sm:max-w-[826px] sm:px-7"
        >
          <DialogHeader className="gap-0">
            <DialogTitle className="text-[30px] font-semibold tracking-tight text-[#111111]">
              Анги засах
            </DialogTitle>
          </DialogHeader>

          <div className="mt-8 space-y-8">
            <div className="space-y-3">
              <label className="block text-[16px] font-semibold text-[#111111]">
                Хичээл
              </label>
              <div className="relative">
                <select
                  value={selectedSubject}
                  onChange={(event) => setSelectedSubject(event.target.value)}
                  className={`${dialogFieldClassName} appearance-none pr-14 ${
                    selectedSubject ? "" : "text-[#8E8A94]"
                  }`}
                >
                  <option value="" disabled>
                    Хичээл сонгох
                  </option>
                  {Object.keys(subjectPaletteMap).map((subjectLabel) => (
                    <option key={subjectLabel} value={subjectLabel}>
                      {subjectLabel}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E8A94]" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[16px] font-semibold text-[#111111]">
                Анги
              </label>
              <div className="relative">
                <select
                  value={selectedGrade}
                  onChange={(event) => setSelectedGrade(event.target.value)}
                  className={`${dialogFieldClassName} appearance-none pr-14 ${
                    selectedGrade ? "" : "text-[#8E8A94]"
                  }`}
                >
                  <option value="" disabled>
                    Анги
                  </option>
                  {gradeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}-р анги
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E8A94]" />
              </div>
            </div>

            <div className="space-y-2 pb-2 ">
              <label className="block text-[16px] font-semibold text-[#111111]">
                Бүлэг
              </label>
              <input
                value={section}
                onChange={(event) => setSection(event.target.value)}
                placeholder="Бүлэг"
                className={dialogFieldClassName}
                maxLength={4}
              />
            </div>
          </div>

          {editError ? (
            <p className="mt-5 text-[14px] text-[#D25B56]">{editError}</p>
          ) : null}

          <div className="mt-10 flex items-center justify-end gap-8">
            <button
              type="button"
              onClick={() => setIsEditDialogOpen(false)}
              className="text-[18px] font-medium text-[#111111] transition hover:text-[#7E66DC]"
            >
              Буцах
            </button>

            <button
              type="button"
              onClick={() => void handleUpdateClassroom()}
              disabled={updatingClassroom}
              className="inline-flex h-14 min-w-[196px] items-center justify-center rounded-[20px] bg-[#9E81F0] px-8 text-[18px] font-semibold text-white shadow-[inset_0_-5px_0_rgba(103,79,184,0.32),0_12px_22px_rgba(158,129,240,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {updatingClassroom ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
