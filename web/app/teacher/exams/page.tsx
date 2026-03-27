"use client";

import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { ChevronDown, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TeacherExamCard } from "../_component/TeacherExamCard";
import { examCards, subjectTabs, type SubjectKey } from "../_data/dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getApolloErrorMessage } from "@/lib/apollo-error";

interface ExamData {
  createExam: {
    id: string;
    title: string;
  };
}

const CREATE_EXAM = gql`
  mutation CreateExam($input: createExamInput!) {
    createExam(input: $input) {
      id
      title
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

const durationOptions = [30, 45, 60, 90, 120] as const;

const fieldClassName =
  "h-[56px] w-full rounded-[16px] border border-[#E9E0F7] bg-white px-4 text-[16px] text-[#1A1623] outline-none transition placeholder:text-[#8E8A94] focus:border-[#B69AF8] focus:ring-4 focus:ring-[#B69AF8]/15";

export default function TeacherExamsPage() {
  const [activeTab, setActiveTab] = useState<SubjectKey>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(60);
  const [grade, setGrade] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [createError, setCreateError] = useState("");

  const router = useRouter();
  const [createExam, { loading: isCreating }] = useMutation<ExamData>(CREATE_EXAM);

  const filteredCards = useMemo(() => {
    if (activeTab === "all") {
      return examCards;
    }

    return examCards.filter((exam) => exam.subject === activeTab);
  }, [activeTab]);

  const canContinue = Boolean(subject && title.trim() && grade && duration > 0);

  const handleCreateExam = async () => {
    if (!canContinue) {
      setCreateError("Хичээл, сэдэв, анги, хугацааг бүрэн бөглөнө үү.");
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
            grade,
          },
        },
      });

      const examId = res.data?.createExam.id;

      if (examId) {
        setIsCreateDialogOpen(false);
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

  return (
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
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                    className={`${fieldClassName} appearance-none pr-14 ${
                      grade ? "" : "text-[#8E8A94]"
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
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E8A94]" />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="block text-[16px] font-medium text-[#111111]">
                  Файл
                </label>
                <label className="flex h-[56px] w-full cursor-pointer items-center gap-3 rounded-[16px] border border-[#E9E0F7] bg-white px-4 text-[16px] text-[#6E6A74] transition hover:border-[#D6C9F6]">
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
                disabled={isCreating}
                className="inline-flex h-12 items-center justify-center rounded-[20px] bg-[#9E81F0] px-8 text-[18px] font-semibold text-white shadow-[inset_0_-5px_0_rgba(103,79,184,0.32),0_12px_22px_rgba(158,129,240,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
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
          />
        ))}
      </div>
    </section>
  );
}
