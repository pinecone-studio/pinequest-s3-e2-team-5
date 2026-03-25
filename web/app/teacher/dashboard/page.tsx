"use client";

import { CircleHelp, Clock3 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { examCards, subjectTabs, type SubjectKey } from "../_data/dashboard";

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
        {filteredCards.map((card) => (
          <Link
            key={card.id}
            href={`/teacher/dashboard/${card.id}`}
            className="group block min-h-[188px] rounded-[20px] border border-[#EEE8F8] bg-[#FBF7FF] px-6 py-5 shadow-[0_2px_8px_rgba(30,25,60,0.05)] transition hover:-translate-y-0.5 hover:border-[#DFD0FF] hover:shadow-[0_10px_22px_rgba(30,25,60,0.08)]"
          >
            <h2 className="text-[22px] font-semibold text-[#111111]">
              {card.title}
            </h2>
            <p className="mt-2 text-[17px] text-[#232323]">{card.grade}</p>
            <p className="mt-5 text-[15px] font-medium text-[#8C8A94]">
              {card.date}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] font-semibold text-[#111111]">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4.5 w-4.5" />
                <span>{card.duration} мин</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleHelp className="h-4.5 w-4.5" />
                <span>{card.taskCount} даалгавар</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
