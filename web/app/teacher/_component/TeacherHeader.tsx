"use client";

import Link from "next/link";
import { LayoutGrid, FileText, Users } from "lucide-react";

const navItems = [
  {
    label: "Хяналтын самбар",
    href: "/teacher/dashboard",
    icon: LayoutGrid,
    active: false,
  },
  {
    label: "Шалгалтууд",
    href: "/teacher/exams",
    icon: FileText,
    active: true,
  },
  {
    label: "Сурагчид",
    href: "/teacher/students",
    icon: Users,
    active: false,
  },
];

export function TeacherHeader() {
  return (
    <header className="w-full border-b border-[#D9D9E4] bg-white">
      <div className="mx-auto flex h-[88px] w-full max-w-[1512px] items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11 rotate-45 rounded-[10px] bg-[#8B6FF7]" />
          <div className="leading-tight">
            <p className="text-[14px] font-semibold text-[#111111]">Learning</p>
            <p className="text-[14px] font-semibold text-[#111111]">MS</p>
          </div>
        </div>

        <nav className="flex items-center gap-10">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 text-[16px] font-medium transition ${
                  item.active
                    ? "text-[#8B6FF7]"
                    : "text-[#5B5563] hover:text-[#8B6FF7]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 border-l border-[#E4E4EC] pl-6">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-[#F4D9C6]">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80"
              alt="Teacher avatar"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="leading-tight">
            <p className="text-[14px] font-medium text-[#9A98A3]">
              Өдрийн мэнд
            </p>
            <p className="text-[16px] font-semibold text-[#111111]">C.Анужин</p>
          </div>
        </div>
      </div>
    </header>
  );
}
