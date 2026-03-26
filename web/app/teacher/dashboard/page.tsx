"use client";

import { Clock3, FileText, PencilLine, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  examCards,
  getSubjectCardPalette,
  subjectTabs,
  type SubjectKey,
} from "../_data/dashboard";

export default function TeacherDashboardPage() {
  const [activeTab, setActiveTab] = useState<SubjectKey>("all");

  const filteredCards = useMemo(() => {
    if (activeTab === "all") {
      return examCards;
    }

    return examCards.filter((exam) => exam.subject === activeTab);
  }, [activeTab]);

  return (
    <section className="space-y-8">
      <div className="border-b border-[#E4E7F0]">
        <div className="flex flex-wrap items-end gap-8 text-[18px] font-semibold text-[#1B1A1F] lg:gap-10">
          {subjectTabs.map((tab) => {
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
        {filteredCards.map((card) => {
          const palette = getSubjectCardPalette(card.subject);
          const SubjectIcon = card.subject === "social" ? FileText : Users;

          return (
            <Link
              key={card.id}
              href={`/teacher/dashboard/${card.id}`}
              className="group block rounded-2xl border px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-md"
              style={{
                backgroundColor: palette.cardBackground,
                borderColor: palette.borderColor,
              }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: palette.iconBackground }}
              >
                <SubjectIcon className="h-5 w-5 text-[#111111]" strokeWidth={2} />
              </div>

              <div className="mt-4">
                <h2 className="text-[18px] font-semibold text-[#111111]">
                  {card.title}
                  <span className="font-normal"> /{card.topic}/</span>
                </h2>
                <p className="text-sm text-[#6B6B6B]">{card.grade}</p>
              </div>

              <div className="mt-5 flex gap-2 text-xs">
                <span className="flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 shadow-sm">
                  <Clock3 className="h-3.5 w-3.5" />
                  {card.duration} мин
                </span>
                <span className="flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 shadow-sm">
                  <PencilLine className="h-3.5 w-3.5" />
                  {card.taskCount} даалгавар
                </span>
              </div>

              <p className="mt-4 text-sm text-[#111111]">
                Эхлэх хугацаа-/{card.startTime}/
              </p>
              <p className="mt-3 text-xs text-[#6D6778]">{card.date}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
