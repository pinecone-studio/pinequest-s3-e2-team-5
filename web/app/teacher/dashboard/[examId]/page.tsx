"use client";

import { ChevronDown, ChevronLeft, PencilLine, Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { examCards, studentResultsByExam } from "../../_data/dashboard";

function parseScore(score: string) {
  const [earnedRaw, totalRaw] = score.split("/");
  const earned = Number.parseInt(earnedRaw, 10);
  const total = Number.parseInt(totalRaw, 10);

  return {
    earned: Number.isFinite(earned) ? earned : 0,
    total: Number.isFinite(total) ? total : 0,
  };
}

export default function TeacherExamAnalysisPage() {
  const params = useParams<{ examId: string }>();
  const examId = params.examId;
  const exam = examCards.find((item) => item.id === examId) ?? examCards[0];
  const students = useMemo(() => {
    return studentResultsByExam[exam.id] ?? [];
  }, [exam.id]);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");

  const sections = useMemo(() => {
    return Array.from(new Set(students.map((student) => student.section)));
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesQuery = student.name
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesSection = section === "all" || student.section === section;

      return matchesQuery && matchesSection;
    });
  }, [query, section, students]);

  return (
    <section className="space-y-12">
      <div className="space-y-10">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-3 text-[18px] font-medium text-[#36313F] transition hover:text-[#7E66DC]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F0FA]">
            <ChevronLeft className="h-5 w-5" />
          </span>
          <span>Буцах</span>
        </Link>

        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-[#111111]">
              Шалгалтын анализ
            </h1>
            <p className="mt-1 text-[17px] text-[#5F5C66]">
              Нийт орсон сурагч: {students.length}
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="flex h-[52px] min-w-[376px] items-center gap-3 rounded-[14px] border border-[#E7E0F4] bg-white px-4 text-[#8990A5] shadow-[0_2px_10px_rgba(76,55,129,0.03)]">
              <Search className="h-5 w-5" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Нэрээр хайх"
                className="w-full border-0 bg-transparent text-[16px] text-[#111111] outline-none placeholder:text-[#8990A5]"
              />
            </label>

            <div className="relative">
              <select
                value={section}
                onChange={(event) => setSection(event.target.value)}
                className="h-[52px] min-w-[164px] appearance-none rounded-[14px] border border-[#E7E0F4] bg-white px-4 pr-11 text-[16px] text-[#111111] shadow-[0_2px_10px_rgba(76,55,129,0.03)] outline-none"
              >
                <option value="all">Бүлэг</option>
                {sections.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7A7890]" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-[56px_minmax(240px,1.45fr)_160px_160px_160px_160px_56px] items-center px-8 text-[16px] font-semibold text-[#111111]">
          <span>№</span>
          <span>Сурагч</span>
          <span>Бүлэг</span>
          <span>Оноо</span>
          <span>Хувь</span>
          <span>Хугацаа</span>
          <span />
        </div>

        <div className="space-y-0">
          {filteredStudents.map((student, index) => (
            <div
              key={student.id}
              className={`grid grid-cols-[56px_minmax(240px,1.45fr)_160px_160px_160px_160px_56px] items-center rounded-[6px] px-8 py-7 text-[16px] text-[#1A1A1A] ${
                index % 2 === 0 ? "bg-[#F7F6FE]" : "bg-[#FCFCFE]"
              }`}
            >
              <span>{index + 1}</span>
              <span className="font-medium">{student.name}</span>
              <span>{student.section}</span>
              <span>{student.score}</span>
              <span>
                {(() => {
                  const { earned, total } = parseScore(student.score);
                  const percent = total > 0 ? Math.round((earned / total) * 100) : 0;

                  return `${percent}%`;
                })()}
              </span>
              <span>{student.durationMinutes} мин</span>
              <Link
                href={`/teacher/dashboard/${exam.id}/students/${student.id}`}
                className="flex justify-center text-[#A5AEC5] transition hover:text-[#8B6FF7]"
                aria-label={`${student.name} шалгалтыг нээх`}
              >
                <PencilLine className="h-5 w-5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
