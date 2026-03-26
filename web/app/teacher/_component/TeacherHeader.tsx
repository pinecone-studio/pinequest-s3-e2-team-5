"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FileText, Users } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

const navItems = [
  {
    label: "Хяналтын самбар",
    href: "/teacher/dashboard",
    icon: LayoutGrid,
  },
  {
    label: "Шалгалтууд",
    href: "/teacher/exams",
    icon: FileText,
  },
  {
    label: "Сургууль",
    href: "/teacher",
    icon: Users,
  },
];

export function TeacherHeader() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-[#E7E8F0] bg-white">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-6 py-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rotate-45 rounded-[9px] bg-[#8B6FF7]" />
          <div className="leading-tight">
            <p className="text-[14px] font-semibold text-[#111111]">Learning</p>
            <p className="text-[14px] font-semibold text-[#111111]">MS</p>
          </div>
        </div>

        <nav className="flex items-center gap-8 lg:gap-10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2.5 text-[15px] font-medium transition ${
                  isActive
                    ? "text-[#8B6FF7]"
                    : "text-[#5B5563] hover:text-[#8B6FF7]"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 border-l border-[#E7E8F0] pl-5">
          <div className="h-11 w-11 overflow-hidden rounded-full bg-[#F4D9C6]">
            <Image
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80"
              alt="Teacher avatar"
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="leading-tight">
            <p className="text-[13px] font-medium text-[#9A98A3]">
              Өдрийн мэнд
            </p>
            <p className="text-[15px] font-semibold text-[#111111]">C.Анужин</p>
          </div>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "h-11 w-11",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
