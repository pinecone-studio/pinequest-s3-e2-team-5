"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  FileText,
  LayoutGrid,
  LogOut,
  Settings2,
  Users,
} from "lucide-react";

const navItems = [
  {
    label: "Хяналтын самбар",
    href: "/teacher/dashboard",
    icon: LayoutGrid,
  },
  {
    label: "Аналитик",
    href: "/teacher/analytics",
    icon: BarChart3,
  },
  {
    label: "Шалгалтууд",
    href: "/teacher/exams",
    icon: FileText,
  },
  {
    label: "Анги",
    href: "/teacher",
    icon: Users,
  },
] as const;

function isNavItemActive(
  pathname: string,
  href: (typeof navItems)[number]["href"],
) {
  if (href === "/teacher") {
    return pathname === href;
  }

  if (href === "/teacher/analytics") {
    return (
      pathname === href ||
      /^\/teacher\/dashboard\/[^/]+\/analytics$/.test(pathname)
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TeacherHeader() {
  const pathname = usePathname();
  const { openUserProfile, signOut } = useClerk();
  const { user } = useUser();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const rawFullName = user?.unsafeMetadata?.fullName;
  const rawFirstName = user?.unsafeMetadata?.firstName;
  const rawLastName = user?.unsafeMetadata?.lastName;
  const metadataName = [
    typeof rawLastName === "string" ? rawLastName.trim() : "",
    typeof rawFirstName === "string" ? rawFirstName.trim() : "",
  ]
    .filter(Boolean)
    .join(" ");
  const displayName =
    typeof rawFullName === "string" && rawFullName.trim()
      ? rawFullName
      : metadataName ||
        [user?.lastName, user?.firstName].filter(Boolean).join(" ") ||
        user?.fullName ||
        user?.firstName ||
        user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
        user?.username ||
        "Багш";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (
        profileMenuRef.current &&
        target instanceof Node &&
        !profileMenuRef.current.contains(target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E7E8F0] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/teacher/dashboard" className="flex items-center gap-2.5">
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

        <div className="flex items-center gap-4 lg:gap-6">
          <nav className="flex items-center gap-8 lg:gap-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(pathname, item.href);

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
        </div>

        <div
          ref={profileMenuRef}
          className="relative border-l border-[#E7E8F0] pl-5"
        >
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((open) => !open)}
            aria-label="Open profile menu"
            aria-expanded={isProfileMenuOpen}
            className="flex items-center gap-3 text-left transition hover:opacity-90"
          >
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#E7E8F0] bg-[#F6F2FF] text-[14px] font-bold text-white shadow-[0_4px_10px_rgba(53,31,107,0.08)]">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={displayName}
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F4A261] to-[#E76F51]">
                  {displayName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part.charAt(0).toUpperCase())
                    .join("") || "Б"}
                </span>
              )}
            </div>

            <div className="leading-tight">
              <p className="text-[12px] font-medium text-[#A2A0AB]">
                Өдрийн мэнд
              </p>
              <p className="mt-1 text-[15px] font-semibold text-[#111111]">
                {displayName}
              </p>
            </div>

            <ChevronDown
              className={`h-4 w-4 text-[#8F8B99] transition-transform ${
                isProfileMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isProfileMenuOpen ? (
            <div className="absolute right-0 top-[calc(100%+14px)] z-50 min-w-[190px] overflow-hidden rounded-[18px] border border-[#E8E2F1] bg-white p-2 shadow-[0_18px_40px_rgba(35,23,73,0.12)]">
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  openUserProfile();
                }}
                className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-[14px] font-medium text-[#24212C] transition hover:bg-[#F8F6FF] hover:text-[#7E66DC]"
              >
                <Settings2 className="h-4 w-4" />
                Профайл
              </button>
              <button
                type="button"
                onClick={() => void signOut({ redirectUrl: "/sign-in" })}
                className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-[14px] font-medium text-[#24212C] transition hover:bg-[#FFF5F5] hover:text-[#D25B56]"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
