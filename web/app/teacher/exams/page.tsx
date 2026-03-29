"use client";

import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { useAuth } from "@clerk/nextjs";
import { ChevronDown, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TeacherExamCard } from "../_component/TeacherExamCard";
import { subjectTabs, type ExamCard, type SubjectKey } from "../_data/dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getApolloErrorMessage } from "@/lib/apollo-error";

type TeacherExamRecord = {
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

type TeacherClassroom = {
  id: string;
  className: string;
  classCode: string;
};

type MyExamsData = {
  myExams: TeacherExamRecord[];
};

type TeacherClassroomsData = {
  classroomsByTeacher: TeacherClassroom[];
};

type ExamData = {
  createExam: {
    id: string;
    title: string;
  };
};

type ScheduleExamData = {
  scheduleExam: {
    id: string;
  };
};

const GET_MY_EXAMS = gql`
  query GetMyExams {
    myExams {
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
  }
`;

const GET_MY_CLASSROOMS = gql`
  query GetMyClassroomsForSchedule {
    classroomsByTeacher {
      id
      className
      classCode
    }
  }
`;

const CREATE_EXAM = gql`
  mutation CreateExam($input: createExamInput!) {
    createExam(input: $input) {
      id
      title
    }
  }
`;

const SCHEDULE_EXAM = gql`
  mutation ScheduleExam($input: scheduleExamInput!) {
    scheduleExam(input: $input) {
      id
    }
  }
`;

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

type GradeOption = (typeof gradeOptions)[number];

const durationOptions = [30, 45, 60, 90, 120] as const;

const fieldClassName =
  "h-[56px] w-full rounded-[14px] border border-[#E9E0F7] bg-white px-4 text-[16px] text-[#1A1623] outline-none transition placeholder:text-[#8E8A94] focus:border-[#B69AF8] focus:ring-4 focus:ring-[#B69AF8]/15";
const scheduleDialogFieldClassName =
  "h-[50px] w-full rounded-[12px] border border-[#E9E0F7] bg-white px-4 text-[16px] text-[#1A1623] outline-none transition placeholder:text-[#8E8A94] focus:border-[#B69AF8] focus:ring-4 focus:ring-[#B69AF8]/15 disabled:cursor-not-allowed disabled:bg-[#FAF8FE] disabled:text-[#8E8A94]";

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

function getDefaultScheduleDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultScheduleTime() {
  const nextHour = new Date();
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

  return [
    String(nextHour.getHours()).padStart(2, "0"),
    String(nextHour.getMinutes()).padStart(2, "0"),
  ].join(":");
}

function getGradeLabelFromClassroomName(className: string): GradeOption | string {
  const match = className.match(/^(\d{1,2})/);

  if (!match) {
    return className;
  }

  return `${match[1]}-р анги`;
}

function mapExamToCard(exam: TeacherExamRecord): ExamCard {
  return {
    id: exam.id,
    title: subjectOptions.find((item) => item.value === exam.subject)?.label || exam.subject,
    topic: exam.title,
    grade: exam.grade,
    date: formatScheduledDate(exam.scheduledDate),
    startTime: exam.startTime || "--:--",
    duration: exam.duration,
    taskCount: exam.questionCount,
    subject: exam.subject as Exclude<SubjectKey, "all">,
    classroomName: exam.classroomName,
  };
}

export default function TeacherExamsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<SubjectKey>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(60);
  const [selectedCreateClassroomId, setSelectedCreateClassroomId] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [createError, setCreateError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [schedulingExam, setSchedulingExam] = useState<ExamCard | null>(null);
  const [scheduleGrade, setScheduleGrade] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleStartTime, setScheduleStartTime] = useState("");

  const router = useRouter();
  const { data: examsData, refetch: refetchExams } =
    useQuery<MyExamsData>(GET_MY_EXAMS, {
      skip: !isLoaded || !isSignedIn,
    });
  const {
    data: classroomsData,
    error: classroomsError,
    refetch: refetchClassrooms,
  } = useQuery<TeacherClassroomsData>(GET_MY_CLASSROOMS, {
    skip: !isLoaded || !isSignedIn,
    fetchPolicy: "network-only",
  });
  const [createExam, { loading: isCreating }] =
    useMutation<ExamData>(CREATE_EXAM);
  const [scheduleExam, { loading: isScheduling }] =
    useMutation<ScheduleExamData>(SCHEDULE_EXAM);

  const cards = useMemo(
    () => (examsData?.myExams ?? []).map(mapExamToCard),
    [examsData],
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !schedulingExam) {
      return;
    }

    void refetchClassrooms();
  }, [isLoaded, isSignedIn, schedulingExam, refetchClassrooms]);

  const filteredCards = useMemo(() => {
    if (activeTab === "all") {
      return cards;
    }

    return cards.filter((exam) => exam.subject === activeTab);
  }, [activeTab, cards]);

  const classrooms = classroomsData?.classroomsByTeacher ?? [];
  const selectedCreateClassroom =
    classrooms.find((classroom) => classroom.id === selectedCreateClassroomId) ??
    null;
  const selectedCreateGrade = selectedCreateClassroom
    ? getGradeLabelFromClassroomName(selectedCreateClassroom.className)
    : "";
  const scheduleGradeOptions = gradeOptions.map((option) => ({
    label: option,
    classroomId:
      classrooms.find(
        (classroom) => getGradeLabelFromClassroomName(classroom.className) === option,
      )?.id ?? "",
  }));
  const effectiveScheduleGrade =
    scheduleGrade ||
    scheduleGradeOptions.find((option) => option.classroomId)?.label ||
    "";
  const effectiveScheduleClassroomId =
    scheduleGradeOptions.find((option) => option.label === effectiveScheduleGrade)
      ?.classroomId || "";
  const hasCreateClassroomOptions = classrooms.length > 0;
  const hasSchedulableGrades = scheduleGradeOptions.some((option) =>
    Boolean(option.classroomId),
  );
  const classroomErrorMessage = classroomsError
    ? getApolloErrorMessage(classroomsError, "Ангиудыг ачаалж чадсангүй.")
    : "";
  const canContinue = Boolean(
    subject && title.trim() && selectedCreateClassroomId && duration > 0,
  );

  const handleCreateExam = async () => {
    if (!canContinue) {
      setCreateError("Хичээл, сэдэв, анги, хугацааг бүрэн бөглөнө үү.");
      return;
    }

    if (!selectedCreateGrade) {
      setCreateError("Анги дээр үүсгэсэн classroom-оос нэгийг сонгоно уу.");
      return;
    }

    try {
      setCreateError("");

      const res = await createExam({
        variables: {
          input: {
            title: title.trim(),
            subject,
            description: uploadedFileName ? `Файл: ${uploadedFileName}` : "",
            duration,
            grade: selectedCreateGrade,
          },
        },
      });

      const examId = res.data?.createExam.id;

      if (examId) {
        setIsCreateDialogOpen(false);
        await refetchExams();
        router.push(`/teacher/exams/${examId}/edit`);
        return;
      }

      setCreateError("Шинэ шалгалтын ID буцаагдсангүй.");
    } catch (error) {
      setCreateError(
        getApolloErrorMessage(error, "Шинэ шалгалт үүсгэж чадсангүй."),
      );
    }
  };

  const openScheduleDialog = (exam: ExamCard) => {
    const defaultScheduleGrade =
      gradeOptions.find((option) => option === exam.grade) ?? "";

    setSchedulingExam(exam);
    setScheduleError("");
    setScheduleGrade(defaultScheduleGrade);
    setScheduleDate(getDefaultScheduleDate());
    setScheduleStartTime(getDefaultScheduleTime());
    if (isLoaded && isSignedIn) {
      void refetchClassrooms();
    }
  };

  const handleScheduleExam = async () => {
    if (!schedulingExam) {
      return;
    }

    if (!effectiveScheduleClassroomId || !scheduleDate || !scheduleStartTime) {
      setScheduleError("Бүлэг, өдөр, эхлэх цагаа бүрэн сонгоно уу.");
      return;
    }

    try {
      setScheduleError("");

      await scheduleExam({
        variables: {
          input: {
            examId: schedulingExam.id,
            classroomId: effectiveScheduleClassroomId,
            scheduledDate: scheduleDate,
            startTime: scheduleStartTime,
          },
        },
      });

      await refetchExams();
      setSchedulingExam(null);
    } catch (error) {
      setScheduleError(
        getApolloErrorMessage(error, "Шалгалт товлоход алдаа гарлаа."),
      );
    }
  };

  return (
    <>
      <section className="space-y-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[38px] font-semibold tracking-tight text-[#17131F]">
              Шалгалтууд
            </h1>
            <p className="mt-1 text-[16px] font-medium text-[#787482]">
              Хичээлийн шалгалтууд
            </p>
          </div>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open);

              if (!open) {
                setCreateError("");
              }
            }}
          >
            <DialogTrigger asChild>
              <button className="inline-flex h-14 items-center gap-3 rounded-[22px] bg-[#9E81F0] px-8 text-[18px] font-semibold text-white shadow-[inset_0_-5px_0_rgba(103,79,184,0.38),0_12px_22px_rgba(158,129,240,0.28)] transition hover:translate-y-[-1px] hover:opacity-95">
                <Plus className="h-6 w-6" />
                Шинэ шалгалт
              </button>
            </DialogTrigger>

            <DialogContent
              showCloseButton={false}
              className="max-w-[calc(100%-2rem)] rounded-[20px] border border-[#E8E2F1] bg-white px-6 py-6 shadow-[0_20px_70px_rgba(28,18,54,0.18)] sm:max-w-[580px]"
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
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      className={`${fieldClassName} appearance-none pr-14 text-[#1A1623] ${
                        subject ? "" : "text-[#8E8A94]"
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
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E8A94]" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-[16px] font-medium text-[#111111]">
                    Сэдвийн нэр
                  </label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Жишээ: Алгебр Тест-1"
                    className={fieldClassName}
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="block text-[16px] font-medium text-[#111111]">
                    Анги
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCreateClassroomId}
                      onChange={(event) =>
                        setSelectedCreateClassroomId(event.target.value)
                      }
                      disabled={!hasCreateClassroomOptions}
                      className={`${fieldClassName} appearance-none pr-14 ${
                        selectedCreateClassroomId ? "" : "text-[#8E8A94]"
                      }`}
                    >
                      <option value="" disabled>
                        {hasCreateClassroomOptions
                          ? "Анги сонгох"
                          : "Анги олдсонгүй"}
                      </option>
                      {classrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.className}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E8A94]" />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-[16px] font-medium text-[#111111]">
                    Файл
                  </label>
                  <label className="flex h-[56px] w-full cursor-pointer items-center gap-3 rounded-[14px] border border-[#E9E0F7] bg-white px-4 text-[16px] text-[#6E6A74] transition hover:border-[#D6C9F6]">
                    <Upload className="h-5 w-5 text-[#6E6A74]" />
                    <span>{uploadedFileName || "Файл оруулах"}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) =>
                        setUploadedFileName(event.target.files?.[0]?.name ?? "")
                      }
                    />
                  </label>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-[16px] font-medium text-[#111111]">
                    Хугацаа(минут)
                  </label>
                  <div className="relative">
                    <select
                      value={String(duration)}
                      onChange={(event) =>
                        setDuration(Number(event.target.value))
                      }
                      className={`${fieldClassName} appearance-none pr-14`}
                    >
                      {durationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option} мин
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E8A94]" />
                  </div>
                </div>
              </div>

              {createError ? (
                <p className="mt-4 text-[14px] text-[#D25B56]">{createError}</p>
              ) : classroomErrorMessage ? (
                <p className="mt-4 text-[14px] text-[#D25B56]">
                  {classroomErrorMessage}
                </p>
              ) : !hasCreateClassroomOptions ? (
                <p className="mt-4 text-[14px] text-[#6E6A74]">
                  Эхлээд `School` хэсгээс анги үүсгэсний дараа энд classroom нэрс
                  харагдана.
                </p>
              ) : null}

              <div className="-mx-6 -mb-6 mt-8 flex items-center justify-end gap-6 border-t border-[#ECE6F3] px-6 py-5">
                <button
                  type="button"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="text-[18px] font-medium text-[#111111] transition hover:text-[#7E66DC]"
                >
                  Буцах
                </button>
                <button
                  type="button"
                  onClick={handleCreateExam}
                  disabled={isCreating || !hasCreateClassroomOptions}
                  className="inline-flex h-12 items-center justify-center rounded-[14px] bg-[#9E81F0] px-8 text-[18px] font-semibold text-white shadow-[inset_0_-5px_0_rgba(103,79,184,0.32),0_12px_22px_rgba(158,129,240,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isCreating ? "Үүсгэж байна..." : "Үргэлжлүүлэх"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border-b border-[#E4E7F0]">
          <div className="flex flex-wrap items-end gap-8 text-[18px] font-semibold lg:gap-10">
            {subjectTabs.map((tab) => {
              const isActive = tab.key === activeTab;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`border-b-2 pb-3 transition-colors ${
                    isActive
                      ? "border-[#9A7BFF] text-[#9A7BFF]"
                      : "border-transparent text-[#25232A]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-4">
          {filteredCards.map((card) => (
            <TeacherExamCard
              key={card.id}
              card={card}
              href={`/teacher/exams/${card.id}`}
              showActionButton
              onActionClick={openScheduleDialog}
            />
          ))}
        </div>
      </section>

      <Dialog
        open={Boolean(schedulingExam)}
        onOpenChange={(open) => {
          if (!open) {
            setSchedulingExam(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="flex max-w-[calc(100%-2rem)] flex-col rounded-[20px] border border-[#E8E2F1] bg-white px-6 py-7 shadow-[0_24px_80px_rgba(28,18,54,0.18)] sm:min-h-[456px] sm:max-w-[580px] sm:px-8 sm:py-8"
        >
          <DialogHeader className="gap-0">
            <DialogTitle className="text-[24px] font-semibold tracking-tight text-[#111111]">
              Шалгалт авах
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <div className="space-y-3">
              <label className="block text-[16px] font-semibold text-[#111111]">
                Бүлэг
              </label>
              <div className="relative">
                <select
                  value={effectiveScheduleGrade}
                  onChange={(event) => setScheduleGrade(event.target.value)}
                  className={`${scheduleDialogFieldClassName} appearance-none pr-14 ${
                    effectiveScheduleGrade ? "" : "text-[#8E8A94]"
                  }`}
                >
                  <option value="" disabled>
                    {hasSchedulableGrades ? "Бүлэг сонгох" : "Бүлэг олдсонгүй"}
                  </option>
                  {scheduleGradeOptions.map((option) => (
                    <option
                      key={option.label}
                      value={option.label}
                      disabled={!option.classroomId}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E8A94]" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[16px] font-semibold text-[#111111]">
                Өдөр
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(event) => setScheduleDate(event.target.value)}
                className={scheduleDialogFieldClassName}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-[16px] font-semibold text-[#111111]">
                Эхлэх цаг
              </label>
              <input
                type="time"
                value={scheduleStartTime}
                onChange={(event) => setScheduleStartTime(event.target.value)}
                className={scheduleDialogFieldClassName}
              />
            </div>
          </div>

          {scheduleError ? (
            <p className="mt-4 text-[14px] text-[#D25B56]">{scheduleError}</p>
          ) : classroomErrorMessage ? (
            <p className="mt-4 text-[14px] text-[#D25B56]">
              {classroomErrorMessage}
            </p>
          ) : !hasSchedulableGrades ? (
            <p className="mt-4 text-[14px] text-[#6E6A74]">
              `School` хэсэг дээр 9, 10, 11, 12 ангид classroom үүсгэсэн бол энд
              сонголт болж гарна.
            </p>
          ) : null}

          <div className="mt-auto flex items-center justify-end gap-8 pt-10">
            <button
              type="button"
              onClick={() => setSchedulingExam(null)}
              className="text-[16px] font-medium text-[#111111] transition hover:text-[#7E66DC]"
            >
              Буцах
            </button>
            <button
              type="button"
              onClick={handleScheduleExam}
              disabled={isScheduling || !effectiveScheduleClassroomId}
              className="inline-flex h-[52px] min-w-[170px] items-center justify-center rounded-[14px] bg-[#9E81F0] px-8 text-[18px] font-semibold text-white shadow-[inset_0_-5px_0_rgba(103,79,184,0.32),0_12px_22px_rgba(158,129,240,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isScheduling ? "Товлож байна..." : "Товлох"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
