"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { TeacherExamCard } from "../_component/TeacherExamCard";
import { type ExamCard, type SubjectKey } from "../_data/dashboard";

type DashboardCategoryKey = "active" | "scheduled" | "closed";

const dashboardTabs: { key: DashboardCategoryKey; label: string }[] = [
  { key: "active", label: "Идэвхтэй" },
  { key: "scheduled", label: "Товлогдсон" },
  { key: "closed", label: "Хаагдсан" },
];

type TeacherExamRecord = {
  id: string;
  title: string;
  subject: string;
  openStatus: boolean;
  grade: string;
  duration: number;
  questionCount: number;
  classroomName: string | null;
  scheduledDate: string | null;
  startTime: string | null;
};

type TeacherScheduledExamsData = {
  teacherScheduledExams: TeacherExamRecord[];
};

const GET_TEACHER_SCHEDULED_EXAMS = gql`
  query GetTeacherScheduledExams {
    teacherScheduledExams {
      id
      title
      subject
      openStatus
      grade
      duration
      questionCount
      classroomName
      scheduledDate
      startTime
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

function getExamCategory(exam: TeacherExamRecord): DashboardCategoryKey {
  if (!exam.openStatus) {
    return "closed";
  }

  if (!exam.scheduledDate || !exam.startTime) {
    return "scheduled";
  }

  const scheduledAt = new Date(`${exam.scheduledDate}T${exam.startTime}`);

  if (Number.isNaN(scheduledAt.getTime())) {
    return "scheduled";
  }

  return scheduledAt.getTime() > Date.now() ? "scheduled" : "active";
}

function mapExamToCard(exam: TeacherExamRecord): ExamCard {
  return {
    id: exam.id,
    title: exam.classroomName || exam.grade,
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

export default function TeacherDashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardCategoryKey>("active");
  const { data } = useQuery<TeacherScheduledExamsData>(
    GET_TEACHER_SCHEDULED_EXAMS,
  );

  const cards = useMemo(
    () =>
      (data?.teacherScheduledExams ?? []).map((exam) => ({
        ...mapExamToCard(exam),
        category: getExamCategory(exam),
      })),
    [data],
  );
  const filteredCards = useMemo(() => {
    return cards.filter((exam) => exam.category === activeTab);
  }, [activeTab, cards]);

  return (
    <section className="space-y-8">
      <div className="border-b border-[#E4E7F0]">
        <div className="flex flex-wrap items-end gap-8 text-[18px] font-semibold text-[#1B1A1F] lg:gap-10">
          {dashboardTabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "border-b-2 pb-3 transition-colors",
                  isActive
                    ? "border-[#9A7BFF] text-[#9A7BFF]"
                    : "border-transparent text-[#25232A]",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {filteredCards.map((card) => (
          <TeacherExamCard
            key={card.id}
            card={card}
            href={`/teacher/dashboard/${card.id}`}
          />
        ))}
      </div>
    </section>
  );
}
