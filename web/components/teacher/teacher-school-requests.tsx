"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApolloErrorMessage } from "@/lib/apollo-error";

type ClassroomItem = {
  id: string;
  className: string;
  classCode: string;
  studentCount: number;
  createdAt: number;
};

type myClassroomData = {
  classroomsByTeacher: ClassroomItem[];
};

type ClassroomCardPresentation = {
  id: string;
  title: string;
  gradeLabel: string;
  sectionLabel: string;
  classCode: string;
  studentCount: number;
  accentColor: string;
  softAccentColor: string;
};

const classroomCardAccent = {
  accentColor: "#8B6FF7",
  softAccentColor: "#F5F0FF",
};

const gradeOptions = ["9", "10", "11", "12"];
const sectionOptions = ["А", "Б", "В", "Г", "Д", "Е", "Ё"];

const dialogFieldClassName =
  "h-[58px] w-full rounded-[16px] border border-[#E9E0F7] bg-white px-4 text-[16px] text-[#1A1623] outline-none transition placeholder:text-[#8E8A94] focus:border-[#B59AF8] focus:ring-4 focus:ring-[#B59AF8]/12";

function buildClassroomName({
  grade,
  section,
}: {
  grade: string;
  section: string;
}) {
  return `${grade}${section}`;
}

function parseClassroomPresentation(
  classroom: ClassroomItem,
): ClassroomCardPresentation {
  const rawClassName = classroom.className.trim();
  const [classroomKey] = rawClassName.split(" - ");
  const keyMatch = classroomKey?.match(/^(\d{1,2})(.*)$/);
  const gradeValue = keyMatch?.[1]?.trim() ?? "";
  const sectionValue = keyMatch?.[2]?.trim() ?? "";
  const fallbackTitle = rawClassName || "Шинэ анги";

  return {
    id: classroom.id,
    title: fallbackTitle,
    gradeLabel: gradeValue ? `${gradeValue}-р анги` : rawClassName,
    sectionLabel: sectionValue || "Тодорхойгүй",
    classCode: classroom.classCode,
    studentCount: classroom.studentCount ?? 0,
    accentColor: classroomCardAccent.accentColor,
    softAccentColor: classroomCardAccent.softAccentColor,
  };
}

export const getMyClassrooms = gql`
  query {
    classroomsByTeacher {
      id
      className
      classCode
      studentCount
      createdAt
    }
  }
`;

export const createClassroomMutation = gql`
  mutation CreateClassroom($input: createClassroomInput!) {
    createClassroom(input: $input) {
      id
      className
      classCode
      createdAt
    }
  }
`;

interface createClassroomData {
  createClassroom: {
    id: string;
    className: string;
    classCode: string;
    createdAt: number;
  };
}

export function TeacherSchoolRequests() {
  const { isLoaded, isSignedIn } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [creatingClassroom, setCreatingClassroom] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [section, setSection] = useState("");

  const [createClassRoom] = useMutation<createClassroomData>(
    createClassroomMutation,
  );

  const {
    data: myClassroomData,
    loading: myClassroomLoading,
    error: myClassroomError,
    refetch: refetchClassrooms,
  } = useQuery<myClassroomData>(getMyClassrooms, {
    skip: !isLoaded || !isSignedIn,
    fetchPolicy: "network-only",
  });

  const resetCreateDialog = () => {
    setSelectedGrade("");
    setSection("");
    setStatusMessage("");
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const nextClassrooms = [
      ...(myClassroomData?.classroomsByTeacher ?? []),
    ].sort((left, right) => right.createdAt - left.createdAt);
    setClassrooms(nextClassrooms);
  }, [isLoaded, isSignedIn, myClassroomData]);

  const handleCreateClassroom = async () => {
    try {
      const normalizedSection = section.trim().toUpperCase();
      if (!selectedGrade || !normalizedSection) {
        throw new Error("Анги, бүлгээ бүрэн бөглөнө үү.");
      }

      setCreatingClassroom(true);
      setStatusMessage("");

      const res = await createClassRoom({
        variables: {
          input: {
            className: buildClassroomName({
              grade: selectedGrade,
              section: normalizedSection,
            }),
          },
        },
      });

      if (res.error) {
        throw new Error(res.error.message);
      }

      const refreshed = await refetchClassrooms();
      setClassrooms(
        [...(refreshed.data?.classroomsByTeacher ?? [])].sort(
          (left, right) => right.createdAt - left.createdAt,
        ),
      );
      setIsCreateDialogOpen(false);
      resetCreateDialog();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Анги үүсгэж чадсангүй. Дахин оролдоно уу.";
      setStatusMessage(message);
    } finally {
      setCreatingClassroom(false);
    }
  };

  const classroomCards = classrooms.map(parseClassroomPresentation);
  const classroomErrorMessage = myClassroomError
    ? getApolloErrorMessage(
        myClassroomError,
        "Ангийн мэдээлэл ачаалж чадсангүй. Дахин оролдоно уу.",
      )
    : "";

  return (
    <section className="space-y-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[38px] font-semibold tracking-tight text-[#17131F]">
            Ангиуд
          </h1>
          <p className="mt-1 text-[16px] font-medium text-[#787482]">
            Анги үүсгэж, сурагч нэмэх
          </p>
        </div>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open && !creatingClassroom) {
              resetCreateDialog();
            }
          }}
        >
          <button
            type="button"
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex h-14 items-center gap-3 rounded-[22px] bg-[#9E81F0] px-8 text-[18px] font-semibold text-white shadow-[inset_0_-5px_0_rgba(103,79,184,0.38),0_12px_22px_rgba(158,129,240,0.28)] transition hover:translate-y-[-1px] hover:opacity-95"
          >
            <Plus className="h-6 w-6" />
            Анги нэмэх
          </button>

          <DialogContent
            showCloseButton={false}
            overlayClassName="bg-black/35 supports-backdrop-filter:backdrop-blur-sm"
            className="max-w-[calc(100%-2rem)] rounded-[28px] border border-[#E8E2F1] bg-white px-7 pb-8 pt-8 shadow-[0_30px_90px_rgba(20,14,35,0.24)] sm:max-w-[826px] sm:px-7"
          >
            <DialogHeader className="gap-0">
              <DialogTitle className="text-[30px] font-semibold tracking-tight text-[#111111]">
                Анги нэмэх
              </DialogTitle>
            </DialogHeader>

            <div className="mt-8 space-y-8">
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

              <div className="space-y-3">
                <label className="block text-[16px] font-semibold text-[#111111]">
                  Бүлэг
                </label>
                <div className="relative">
                  <select
                    value={section}
                    onChange={(event) => setSection(event.target.value)}
                    className={`${dialogFieldClassName} appearance-none pr-14 ${section ? "" : "text-[#8E8A94]"}`}
                  >
                    <option value="" disabled>
                      Бүлэг
                    </option>
                    {sectionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E8A94]" />
                </div>
              </div>
            </div>

            {statusMessage ? (
              <p className="mt-5 text-[14px] text-[#D25B56]">{statusMessage}</p>
            ) : null}

            <div className="mt-10 flex items-center justify-end gap-8">
              <button
                type="button"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetCreateDialog();
                }}
                className="text-[18px] font-medium text-[#111111] transition hover:text-[#7E66DC]"
              >
                Буцах
              </button>

              <button
                type="button"
                onClick={handleCreateClassroom}
                disabled={creatingClassroom}
                className="inline-flex h-14 min-w-[196px] items-center justify-center rounded-[20px] bg-[#9E81F0] px-8 text-[18px] font-semibold text-white shadow-[inset_0_-5px_0_rgba(103,79,184,0.32),0_12px_22px_rgba(158,129,240,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {creatingClassroom ? "Үүсгэж байна..." : "Үргэлжлүүлэх"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {classroomErrorMessage ? (
        <div className="rounded-[18px] border border-[#F0C2BD] bg-[#FBEAEA] px-5 py-4 text-[14px] text-[#B63B3B]">
          {classroomErrorMessage}
        </div>
      ) : null}

      {myClassroomLoading ? (
        <div className="rounded-[24px] border border-[#E7E8F0] bg-white px-6 py-8 text-[16px] text-[#6E6A74] shadow-[0_8px_24px_rgba(36,20,71,0.04)]">
          Ангиудыг ачаалж байна...
        </div>
      ) : classroomCards.length > 0 ? (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(286px,286px))]">
          {classroomCards.map((classroom) => (
            <Link
              key={classroom.id}
              href={`/teacher/classrooms/${classroom.id}`}
              className="block rounded-[24px] border border-[#E8E2F1] bg-white px-5 py-5 shadow-[0_10px_24px_rgba(54,35,106,0.06)] transition hover:-translate-y-1 hover:border-[#D8CEF3] hover:shadow-[0_18px_34px_rgba(54,35,106,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 block h-8 w-[3px] rounded-full"
                    style={{ backgroundColor: classroom.accentColor }}
                  />
                  <h2 className="text-[20px] font-semibold tracking-tight text-[#17131F]">
                    {classroom.title}
                  </h2>
                </div>

                <span
                  className="rounded-full px-3 py-1 text-[12px] font-semibold"
                  style={{
                    color: classroom.accentColor,
                    backgroundColor: classroom.softAccentColor,
                  }}
                >
                  {classroom.classCode}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-4 text-[14px] text-[#111111]">
                  <span>Анги</span>
                  <span className="text-right font-medium">
                    {classroom.gradeLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-[14px] text-[#111111]">
                  <span>Бүлэг</span>
                  <span className="text-right font-medium">
                    {classroom.sectionLabel}
                  </span>
                </div>

                <div className="h-px bg-[#ECE6F3]" />

                <div className="flex items-center justify-between gap-4 text-[14px] text-[#111111]">
                  <span>Сурагчдын тоо</span>
                  <span className="text-right font-medium">
                    {classroom.studentCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-[#D9D0EE] bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(36,20,71,0.03)]">
          <h2 className="text-[22px] font-semibold tracking-tight text-[#17131F]">
            Анги алга байна
          </h2>
          <p className="mt-2 text-[15px] text-[#7A7484]">
            `Анги нэмэх` товчоор шинэ анги үүсгээд сурагчдад class code-оо өгнө.
          </p>
        </div>
      )}
    </section>
  );
}
