"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { BarChart3 } from "lucide-react";
import { useMemo } from "react";
import { TeacherExamCard } from "../_component/TeacherExamCard";
import { type ExamCard, type SubjectKey } from "../_data/dashboard";

type TeacherAnalyticsExamRecord = {
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

type TeacherAnalyticsExamsData = {
  teacherScheduledExams: TeacherAnalyticsExamRecord[];
};

const GET_TEACHER_ANALYTICS_EXAMS = gql`
  query GetTeacherAnalyticsExams {
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

function isCompletedExam(exam: TeacherAnalyticsExamRecord) {
  if (!exam.openStatus) {
    return true;
  }

  if (!exam.scheduledDate || !exam.startTime) {
    return false;
  }

  const scheduledAt = new Date(`${exam.scheduledDate}T${exam.startTime}`);

  if (Number.isNaN(scheduledAt.getTime())) {
    return false;
  }

  const endAt = scheduledAt.getTime() + exam.duration * 60 * 1000;

  return endAt <= Date.now();
}

function mapExamToCard(exam: TeacherAnalyticsExamRecord): ExamCard {
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

export default function TeacherAnalyticsPage() {
  const { data, loading } = useQuery<TeacherAnalyticsExamsData>(
    GET_TEACHER_ANALYTICS_EXAMS,
  );

  const filteredCards = useMemo(
    () =>
      (data?.teacherScheduledExams ?? [])
        .filter(isCompletedExam)
        .map((exam) => mapExamToCard(exam)),
    [data],
  );

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-[#E4E7F0] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#F3F0FA] text-[#7E66DC]">
            <BarChart3 className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-[30px] font-semibold tracking-tight text-[#111111]">
              Шалгалтын аналитик
            </h1>
            <p className="mt-1 text-[16px] text-[#7A7488]">
              Сурагчдын гүйцэтгэл
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[20px] border border-[#E8E2F1] bg-white px-6 py-8 text-[15px] text-[#6F687D]">
          Analytics шалгалтуудыг ачаалж байна...
        </div>
      ) : filteredCards.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {filteredCards.map((card) => (
            <TeacherExamCard
              key={card.id}
              card={card}
              href={`/teacher/dashboard/${card.id}/analytics`}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-[#E8E2F1] bg-white px-6 py-8 text-[15px] text-[#6F687D]">
          Дууссан шалгалт одоогоор алга байна.
        </div>
      )}
    </section>
  );
}
