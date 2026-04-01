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

type TeacherDashboardCard = ExamCard & {
  category: DashboardCategoryKey;
  renderKey: string;
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

  return `${day}.${month}.${year}`;
}

function parseScheduleDateTime(
  scheduledDate: string | null,
  startTime: string | null,
) {
  if (!scheduledDate || !startTime) {
    return null;
  }

  const dateMatch = scheduledDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = startTime.match(/^(\d{2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;

  const startsAt = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0,
  );

  return Number.isNaN(startsAt.getTime()) ? null : startsAt;
}

function getExamCategory(exam: TeacherExamRecord): DashboardCategoryKey {
  if (!exam.openStatus) {
    return "closed";
  }

  const scheduledAt = parseScheduleDateTime(exam.scheduledDate, exam.startTime);
  if (!scheduledAt) {
    return "scheduled";
  }

  const startsAt = scheduledAt.getTime();
  const closesAt = startsAt + Math.max(0, exam.duration) * 60 * 1000;
  const now = Date.now();

  if (startsAt > now) {
    return "scheduled";
  }

  if (now >= closesAt) {
    return "closed";
  }

  return "active";
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

function getExamCardBaseKey(exam: TeacherExamRecord) {
  return [
    exam.id,
    exam.scheduledDate ?? "unscheduled",
    exam.startTime ?? "unstarted",
    exam.classroomName ?? exam.grade,
  ].join(":");
}

export default function TeacherDashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardCategoryKey>("active");
  const { data } = useQuery<TeacherScheduledExamsData>(
    GET_TEACHER_SCHEDULED_EXAMS,
  );

  const cards = useMemo<TeacherDashboardCard[]>(() => {
    const renderKeyCounts = new Map<string, number>();

    return (data?.teacherScheduledExams ?? []).map((exam) => {
      const baseKey = getExamCardBaseKey(exam);
      const occurrence = renderKeyCounts.get(baseKey) ?? 0;

      renderKeyCounts.set(baseKey, occurrence + 1);

      return {
        ...mapExamToCard(exam),
        category: getExamCategory(exam),
        renderKey: `${baseKey}:${occurrence}`,
      };
    });
  }, [data]);

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
            key={card.renderKey}
            card={card}
            href={`/teacher/dashboard/${card.id}`}
          />
        ))}
      </div>
    </section>
  );
}
