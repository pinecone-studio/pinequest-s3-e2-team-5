"use client";

import { ArrowLeft, ChevronDown, EllipsisVertical, Search } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  examCards,
  studentResultsByExam,
} from "../../_data/dashboard";

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
    <section className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/teacher/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-[14px] font-medium text-[#5F5C66] transition hover:text-[#111111]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard руу буцах</span>
          </Link>
          <h1 className="text-[30px] font-semibold tracking-tight text-[#111111]">
            Шалгалтын анализ
          </h1>
          <p className="mt-2 text-[15px] text-[#5F5C66]">
            Нийт орсон сурагч: {filteredStudents.length}
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex h-[46px] min-w-[320px] items-center gap-3 rounded-[12px] border border-[#E5DDF5] bg-white px-4 text-[#7A7890]">
            <Search className="h-5 w-5" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Нэрээр хайх"
              className="w-full border-0 bg-transparent text-[16px] text-[#111111] outline-none placeholder:text-[#7A7890]"
            />
          </label>

          <div className="relative">
            <select
              value={section}
              onChange={(event) => setSection(event.target.value)}
              className="h-[46px] min-w-[210px] appearance-none rounded-[12px] border border-[#E5DDF5] bg-white px-4 text-[16px] text-[#111111] outline-none"
            >
              <option value="all">Анги</option>
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

      <div className="space-y-3">
        <div className="grid grid-cols-[56px_minmax(240px,1fr)_150px_150px_160px_40px] items-center px-8 text-[16px] font-semibold text-[#111111]">
          <span>№</span>
          <span>Сурагч</span>
          <span>Анги</span>
          <span>Оноо</span>
          <span>Өдөр</span>
          <span />
        </div>

        <div className="space-y-4">
          {filteredStudents.map((student, index) => (
            <div
              key={student.id}
              className="grid grid-cols-[56px_minmax(240px,1fr)_150px_150px_160px_40px] items-center rounded-[14px] border border-[#F1F0F8] bg-[#F8F8FF] px-8 py-6 text-[16px] text-[#1A1A1A]"
            >
              <span>{index + 1}</span>
              <span className="font-medium">{student.name}</span>
              <span>{student.section}</span>
              <span>{student.score}</span>
              <span>{student.submittedAt}</span>
              <button type="button" className="flex justify-center text-[#99A0B6]">
                <EllipsisVertical className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden text-sm text-[#6A6772]">
        {exam.title} · {exam.grade}
      </div>
    </section>
  );
}
