"use client";

import { gql } from "@apollo/client";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { BarChart3, ChevronLeft, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  type ChartData,
  type ChartOptions,
} from "@/components/charts/chart-kit";
import { getSubjectDisplayLabel } from "../_data/dashboard";

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

type TeacherAnalyticsDetailData = {
  teacherExamAnalytics: {
    exam: {
      id: string;
      title: string;
      subject: string;
      grade: string;
      classroomName: string | null;
    };
    totalStudents: number;
    students: {
      id: string;
      percent: number;
    }[];
    questionInsights: {
      questionId: string;
      order: number;
      question: string;
      type: "mcq" | "open" | "short";
      wrongRate: number | null;
      submissionCount: number;
      incorrectCount: number;
    }[];
  };
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

const GET_TEACHER_ANALYTICS_DETAIL = gql`
  query GetTeacherAnalyticsDetail($examId: String!) {
    teacherExamAnalytics(examId: $examId) {
      totalStudents
      exam {
        id
        title
        subject
        grade
        classroomName
      }
      students {
        id
        percent
      }
      questionInsights {
        questionId
        order
        question
        type
        wrongRate
        submissionCount
        incorrectCount
      }
    }
  }
`;

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

function isCompletedExam(exam: TeacherAnalyticsExamRecord) {
  if (!exam.openStatus) {
    return true;
  }

  const scheduledAt = parseScheduleDateTime(exam.scheduledDate, exam.startTime);
  if (!scheduledAt) {
    return false;
  }

  const endAt = scheduledAt.getTime() + exam.duration * 60 * 1000;
  return endAt <= Date.now();
}

function getCompletedExamSortValue(exam: TeacherAnalyticsExamRecord) {
  const scheduledAt = parseScheduleDateTime(exam.scheduledDate, exam.startTime);
  if (!scheduledAt) {
    return 0;
  }

  return scheduledAt.getTime();
}

function parseClassroomMeta(
  classroomName: string | null | undefined,
  gradeFallback: string,
) {
  const normalized = classroomName?.trim() ?? "";
  const [classroomKey] = normalized.split(" - ");
  const match = classroomKey?.match(/^(\d{1,2})(.*)$/);
  const group = match?.[2]?.trim() || "-";

  return {
    grade: gradeFallback,
    group,
  };
}

const chartOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: "#2C2638",
      displayColors: false,
      padding: 12,
      callbacks: {
        label: (context) => `${context.parsed.y}% алдаа`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
      ticks: {
        color: "#8A8397",
        font: {
          size: 12,
        },
      },
    },
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        stepSize: 20,
        color: "#8A8397",
        font: {
          size: 12,
        },
      },
      grid: {
        color: "#EEEAF7",
      },
      border: {
        display: false,
      },
    },
  },
};

export default function TeacherAnalyticsPage() {
  const client = useApolloClient();
  const { data, loading, error } = useQuery<TeacherAnalyticsExamsData>(
    GET_TEACHER_ANALYTICS_EXAMS,
    {
      fetchPolicy: "network-only",
    },
  );
  const [detailRecords, setDetailRecords] = useState<
    TeacherAnalyticsDetailData["teacherExamAnalytics"][]
  >([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [selectedExamCardKey, setSelectedExamCardKey] = useState("");

  const completedExams = useMemo(
    () =>
      [...(data?.teacherScheduledExams ?? [])]
        .filter(isCompletedExam)
        .sort(
          (left, right) =>
            getCompletedExamSortValue(right) - getCompletedExamSortValue(left),
        ),
    [data],
  );

  useEffect(() => {
    if (!completedExams.length) {
      setDetailRecords([]);
      setDetailsError("");
      setDetailsLoading(false);
      return;
    }

    let cancelled = false;

    const loadAllDetails = async () => {
      setDetailsLoading(true);
      setDetailsError("");

      try {
        const responses = await Promise.all(
          completedExams.map((exam) =>
            client.query<TeacherAnalyticsDetailData>({
              query: GET_TEACHER_ANALYTICS_DETAIL,
              variables: { examId: exam.id },
              fetchPolicy: "network-only",
            }),
          ),
        );

        if (!cancelled) {
          setDetailRecords(
            responses
              .map((response) => response.data.teacherExamAnalytics)
              .filter(Boolean),
          );
        }
      } catch (caughtError) {
        if (!cancelled) {
          setDetailsError(
            caughtError instanceof Error
              ? caughtError.message
              : "Analytics ачаалж чадсангүй.",
          );
        }
      } finally {
        if (!cancelled) {
          setDetailsLoading(false);
        }
      }
    };

    void loadAllDetails();

    return () => {
      cancelled = true;
    };
  }, [client, completedExams]);

  const examSummaries = useMemo(
    () =>
      detailRecords.map((record, index) => {
        const sourceExam = completedExams[index];
        const meta = parseClassroomMeta(
          record.exam.classroomName,
          record.exam.grade,
        );
        return {
          cardKey: [
            sourceExam?.id ?? record.exam.id,
            sourceExam?.classroomName ?? record.exam.classroomName ?? "",
            sourceExam?.scheduledDate ?? "",
            sourceExam?.startTime ?? "",
            String(index),
          ].join(":"),
          examId: record.exam.id,
          title: record.exam.title,
          subjectLabel: getSubjectDisplayLabel(record.exam.subject),
          gradeLabel: meta.grade,
          groupLabel: meta.group,
          totalStudents: record.students.length,
          averagePercent: record.students.length
            ? Math.round(
                record.students.reduce(
                  (sum, student) => sum + student.percent,
                  0,
                ) / record.students.length,
              )
            : 0,
          questionInsights: record.questionInsights
            .filter((item) => item.type === "mcq")
            .map((item) => ({
              label: `Асуулт-${item.order}`,
              wrongRate: item.wrongRate ?? 0,
              incorrectCount: item.incorrectCount,
              submissionCount: item.submissionCount,
            })),
        };
      }),
    [completedExams, detailRecords],
  );

  useEffect(() => {
    if (!examSummaries.length) {
      setSelectedExamCardKey("");
      return;
    }

    if (
      !selectedExamCardKey ||
      !examSummaries.some((item) => item.cardKey === selectedExamCardKey)
    ) {
      setSelectedExamCardKey(examSummaries[0].cardKey);
    }
  }, [examSummaries, selectedExamCardKey]);

  const selectedExamSummary = useMemo(
    () =>
      examSummaries.find((item) => item.cardKey === selectedExamCardKey) ??
      examSummaries[0] ??
      null,
    [examSummaries, selectedExamCardKey],
  );

  const chartPoints = useMemo(
    () =>
      [...(selectedExamSummary?.questionInsights ?? [])]
        .sort((left, right) => right.wrongRate - left.wrongRate)
        .slice(0, 8)
        .sort((left, right) => left.wrongRate - right.wrongRate),
    [selectedExamSummary],
  );

  const chartData = useMemo<ChartData<"bar">>(
    () => ({
      labels: chartPoints.map((item) => item.label),
      datasets: [
        {
          data: chartPoints.map((item) => item.wrongRate),
          backgroundColor: "rgba(216, 202, 251, 0.88)",
          borderRadius: 0,
          borderSkipped: false,
          maxBarThickness: 32,
          categoryPercentage: 0.78,
          barPercentage: 0.84,
        },
      ],
    }),
    [chartPoints],
  );

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-[#6F687D]">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
        Analytics ачаалж байна...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[20px] border border-[#F0C2BD] bg-[#FFF4F2] px-5 py-4 text-[#B63B3B]">
        {error.message}
      </div>
    );
  }

  if (!completedExams.length) {
    return (
      <div className="rounded-[20px] border border-[#E8E2F1] bg-white px-6 py-8 text-[15px] text-[#6F687D]">
        Дууссан шалгалт одоогоор алга байна.
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[1080px] space-y-8">
      <Link
        href="/teacher/dashboard"
        className="inline-flex cursor-pointer items-center gap-3 text-[18px] font-medium text-[#36313F] transition hover:text-[#7E66DC]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F0FA]">
          <ChevronLeft className="h-5 w-5" />
        </span>
        <span>Буцах</span>
      </Link>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="self-start">
          <div className="space-y-4">
            {examSummaries.map((item) => {
              const isActive = item.cardKey === selectedExamSummary?.cardKey;

              return (
                <button
                  key={item.cardKey}
                  type="button"
                  onClick={() => setSelectedExamCardKey(item.cardKey)}
                  className={`w-full cursor-pointer rounded-[16px] border bg-white p-4 text-left shadow-[0_4px_12px_rgba(53,31,107,0.04)] transition ${
                    isActive
                      ? "border-[#CFC2F3] ring-2 ring-[#CFC2F3]/50"
                      : "border-[#E8E2F1] hover:border-[#D8CCFB]"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="border-l-4 border-[#D8CCFB] pl-2">
                      <h2 className="text-[17px] font-semibold text-[#2B2633]">
                        {item.title}
                      </h2>
                    </div>

                    <div className="space-y-2 text-[15px] text-[#3A3645]">
                      <div className="flex items-center gap-3">
                        <span className="text-[#5E586D]">Анги</span>
                        <span className="font-medium">
                          {item.gradeLabel}
                          {item.groupLabel !== "-" ? ` ${item.groupLabel}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#5E586D]">Хичээл</span>
                        <span className="font-medium">{item.subjectLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="my-4 h-px bg-[#ECE6F3]" />

                  <div className="flex items-center justify-between text-[15px] text-[#413B50]">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#8B819F]" />
                      <span>{item.totalStudents}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-[#8B819F]" />
                      <span>{item.averagePercent}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="self-start rounded-[16px] border border-[#E8E2F1] bg-white px-6 py-6 shadow-[0_4px_12px_rgba(53,31,107,0.04)]">
          <div className="space-y-1">
            <h1 className="text-[18px] font-semibold text-[#1D1A24]">
              {selectedExamSummary
                ? `${selectedExamSummary.title} - Хамгийн их алддаг асуултууд`
                : "Хамгийн их алддаг асуултууд"}
            </h1>
            <p className="text-[14px] text-[#8A8397]">
              Алдааны давтамж өндөртэй
            </p>
          </div>

          <div className="mt-5 border-t border-[#ECE6F3] pt-5">
            {detailsLoading ? (
              <div className="flex h-[300px] items-center justify-center text-[#6F687D]">
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Chart ачаалж байна...
              </div>
            ) : detailsError ? (
              <div className="rounded-[16px] border border-[#F0C2BD] bg-[#FFF4F2] px-4 py-3 text-[#B63B3B]">
                {detailsError}
              </div>
            ) : chartPoints.length > 0 ? (
              <>
                <BarChart
                  data={chartData}
                  options={chartOptions}
                  className="h-[270px]"
                />
                <div className="mt-2 flex justify-end text-[14px] text-[#8A8397]">
                  Асуултууд
                </div>
              </>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-[#6F687D]">
                Auto-graded analytics хараахан алга байна.
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
