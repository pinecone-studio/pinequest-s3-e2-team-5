"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, BarChart2, LogOut } from "lucide-react";

const navItems = [
  {
    href: "/student/account",
    label: "Миний Шалгалтууд",
    icon: FileText,
    key: "account",
  },
  {
    href: "/student/account/myResult.tsx",
    label: "Үр дүн",
    icon: BarChart2,
    key: "result",
  },
] as const;

function isNavItemActive(
  pathname: string,
  key: (typeof navItems)[number]["key"],
) {
  if (key === "result") {
    return (
      pathname === "/student/account/myResult.tsx" ||
      pathname.startsWith("/student/account/myResult.tsx/")
    );
  }

  return (
    pathname === "/student/account" ||
    (pathname.startsWith("/student/account/") &&
      !pathname.startsWith("/student/account/myResult.tsx"))
  );
}

export default function Header() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user } = useUser();
  const rawFullName = user?.unsafeMetadata?.fullName;
  const displayName =
    typeof rawFullName === "string" && rawFullName.trim()
      ? rawFullName
      : [user?.lastName, user?.firstName].filter(Boolean).join(" ") ||
        user?.firstName ||
        user?.username ||
        "Сурагч";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#5B8DEF]/30 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-18 max-w-[1245px] items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="PineQuest logo"
            width={44}
            height={34}
            className="h-10 w-11 object-contain"
          />
          <div className="flex flex-col leading-none text-black">
            <span className="text-[16px] font-medium tracking-widest uppercase">
              Learning
            </span>
            <span className="text-[17px] tracking-tight">MS</span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon, key }) => {
            const active = isNavItemActive(pathname, key);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-[14px] font-medium transition-all duration-200 ${
                  active
                    ? "text-[#896FD4]"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <Icon
                  size={15}
                  className={active ? "text-[#896FD4]" : "text-[#51475A]"}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="ml-4 flex items-center gap-3 border-l border-[#D8DAE3] pl-5">
          <button
            type="button"
            onClick={() => void signOut({ redirectUrl: "/student" })}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#D8DAE3] px-4 text-[13px] font-medium text-[#51475A] transition hover:border-[#8B7FE8] hover:bg-[#F7F3FF] hover:text-[#6A54D8]"
          >
            <LogOut size={14} />
            Log out
          </button>
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-[#5B8DEF]/20 bg-gradient-to-br from-[#F4A261] to-[#E76F51]">
            <div className="flex h-full w-full items-center justify-center text-[13px] font-bold text-white">
              {initials || "СУ"}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#51475A]">Өдрийн мэнд</p>
            <p className="text-[14px] font-semibold text-gray-800">
              {displayName}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#8B7FE8] via-[#5B8DEF] to-[#8B7FE8] opacity-60" />
    </header>
  );
}
