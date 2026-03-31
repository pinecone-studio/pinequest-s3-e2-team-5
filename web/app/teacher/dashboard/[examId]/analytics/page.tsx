"use client";

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { ChevronLeft, Loader2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

type TeacherExamAnalyticsPageData = {
  teacherExamAnalytics: {
    exam: {
      id: string;
      title: string;
    };
    totalStudents: number;
    students: {
      id: string;
      studentId: string;
      name: string;
      section: string;
      score: string;
      percent: number;
      submittedAt: number;
      durationMinutes: number;
    }[];
    questionInsights: {
      questionId: string;
      order: number;
      question: string;
      type: "mcq" | "open" | "short";
      submissionCount: number;
      correctCount: number;
      incorrectCount: number;
      unansweredCount: number;
      pendingReviewCount: number;
      wrongRate: number | null;
    }[];
  };
};

const GET_TEACHER_EXAM_ANALYTICS = gql`
  query GetTeacherExamAnalyticsPage($examId: String!) {
    teacherExamAnalytics(examId: $examId) {
      totalStudents
      exam {
        id
        title
      }
      students {
        id
        studentId
        name
        section
        score
        percent
        submittedAt
        durationMinutes
      }
      questionInsights {
        questionId
        order
        question
        type
        submissionCount
        correctCount
        incorrectCount
        unansweredCount
        pendingReviewCount
        wrongRate
      }
    }
  }
`;

function getInsightTone(type: "mcq" | "open" | "short", wrongRate: number | null) {
  if (type !== "mcq") {
    return "border-[#E8E2F1] bg-white text-[#6F687D]";
  }

  if ((wrongRate ?? 0) >= 60) {
    return "border-[#F0C2BD] bg-[#FFF4F2] text-[#C95348]";
  }

  if ((wrongRate ?? 0) >= 30) {
    return "border-[#F2D68B] bg-[#FFF8E6] text-[#B8860B]";
  }

  return "border-[#CDEBCE] bg-[#F2FBF2] text-[#47974D]";
}

export default function TeacherExamAnalyticsDetailPage() {
  const params = useParams<{ examId: string }>();
  const examId = params.examId;
  const { data, loading, error } = useQuery<TeacherExamAnalyticsPageData>(
    GET_TEACHER_EXAM_ANALYTICS,
    {
      variables: { examId },
      skip: !examId,
    },
  );

  const analytics = data?.teacherExamAnalytics;
  const insights = useMemo(
    () => analytics?.questionInsights ?? [],
    [analytics?.questionInsights],
  );
  const topMistakes = useMemo(
    () =>
      [...insights]
        .filter((item) => item.type === "mcq")
        .sort((left, right) => (right.wrongRate ?? 0) - (left.wrongRate ?? 0))
        .slice(0, 3),
    [insights],
  );
  const pendingReviewCount = useMemo(
    () =>
      insights.reduce(
        (sum, item) => sum + (item.type === "mcq" ? 0 : item.pendingReviewCount),
        0,
      ),
    [insights],
  );
  const averageScore = useMemo(() => {
    if (!analytics?.students.length) {
      return 0;
    }

    const total = analytics.students.reduce(
      (sum, student) => sum + student.percent,
      0,
    );

    return Math.round(total / analytics.students.length);
  }, [analytics]);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-[#6F687D]">
        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
        Analytics ачаалж байна...
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="rounded-[18px] border border-[#F0C2BD] bg-[#FFF4F2] px-5 py-4 text-[#B63B3B]">
        {error?.message ?? "Analytics мэдээлэл олдсонгүй."}
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="space-y-6">
        <Link
          href="/teacher/analytics"
          className="inline-flex items-center gap-3 text-[18px] font-medium text-[#36313F] transition hover:text-[#7E66DC]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F0FA]">
            <ChevronLeft className="h-5 w-5" />
          </span>
          Буцах
        </Link>

        <div>
          <h1 className="text-[30px] font-semibold tracking-tight text-[#111111]">
            Асуултын analytics
          </h1>
          <p className="mt-1 text-[16px] text-[#7A7488]">{analytics.exam.title}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[20px] border border-[#E8E2F1] bg-white p-5">
          <p className="text-[14px] text-[#8A8397]">Нийт орсон сурагч</p>
          <p className="mt-3 text-[30px] font-semibold text-[#1D1A24]">
            {analytics.totalStudents}
          </p>
        </div>
        <div className="rounded-[20px] border border-[#E8E2F1] bg-white p-5">
          <p className="text-[14px] text-[#8A8397]">Дундаж хувь</p>
          <p className="mt-3 text-[30px] font-semibold text-[#1D1A24]">
            {averageScore}%
          </p>
        </div>
        <div className="rounded-[20px] border border-[#E8E2F1] bg-white p-5">
          <p className="text-[14px] text-[#8A8397]">Manual review хүлээж буй</p>
          <p className="mt-3 text-[30px] font-semibold text-[#1D1A24]">
            {pendingReviewCount}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-[20px] border border-[#E8E2F1] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF4F2] text-[#D25B56]">
                <TriangleAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold text-[#1D1A24]">
                  Хамгийн их алдсан
                </h2>
                <p className="text-[14px] text-[#8A8397]">
                  MCQ асуултын auto-graded үр дүн
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {topMistakes.length === 0 ? (
                <p className="text-[14px] text-[#6F687D]">
                  Auto-graded analytics хараахан алга байна.
                </p>
              ) : (
                topMistakes.map((item) => (
                  <div
                    key={item.questionId}
                    className="rounded-[16px] border border-[#F0EAFB] bg-[#FBFAFE] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[15px] font-semibold text-[#23202A]">
                        {item.order}-р асуулт
                      </span>
                      <span className="rounded-full bg-[#FFF1F0] px-2.5 py-1 text-[12px] font-semibold text-[#D25B56]">
                        {item.wrongRate ?? 0}% алдаа
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-[14px] leading-6 text-[#5F5A6C]">
                      {item.question}
                    </p>
                    <p className="mt-3 text-[13px] text-[#8A8397]">
                      {item.incorrectCount}/{item.submissionCount} сурагч буруу
                      хариулсан
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          {insights.map((item) => (
            <article
              key={item.questionId}
              className="rounded-[20px] border border-[#E8E2F1] bg-white p-5"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[16px] font-semibold text-[#1D1A24]">
                      {item.order}-р асуулт
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold ${getInsightTone(
                        item.type,
                        item.wrongRate,
                      )}`}
                    >
                      {item.type === "mcq"
                        ? `${item.wrongRate ?? 0}% алдаа`
                        : "Manual review"}
                    </span>
                  </div>
                  <h2 className="text-[17px] font-medium leading-7 text-[#2A2633]">
                    {item.question}
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-4 xl:min-w-[420px]">
                  <div className="rounded-[14px] bg-[#F7F6FE] px-4 py-3">
                    <p className="text-[12px] text-[#8A8397]">Зөв</p>
                    <p className="mt-1 text-[20px] font-semibold text-[#47974D]">
                      {item.correctCount}
                    </p>
                  </div>
                  <div className="rounded-[14px] bg-[#FFF4F2] px-4 py-3">
                    <p className="text-[12px] text-[#8A8397]">Буруу</p>
                    <p className="mt-1 text-[20px] font-semibold text-[#D25B56]">
                      {item.incorrectCount}
                    </p>
                  </div>
                  <div className="rounded-[14px] bg-[#FFF9EC] px-4 py-3">
                    <p className="text-[12px] text-[#8A8397]">Хоосон</p>
                    <p className="mt-1 text-[20px] font-semibold text-[#B8860B]">
                      {item.unansweredCount}
                    </p>
                  </div>
                  <div className="rounded-[14px] bg-[#F7F6FE] px-4 py-3">
                    <p className="text-[12px] text-[#8A8397]">Review</p>
                    <p className="mt-1 text-[20px] font-semibold text-[#7E66DC]">
                      {item.pendingReviewCount}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
