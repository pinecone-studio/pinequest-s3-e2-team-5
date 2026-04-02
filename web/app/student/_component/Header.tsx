"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart2,
  ChevronDown,
  FileText,
  LogOut,
  Settings2,
} from "lucide-react";

const navItems = [
  {
    href: "/student/account",
    label: "Миний Шалгалтууд",
    icon: FileText,
    key: "account",
  },
  {
    href: "/student/account/myResult",
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
      pathname === "/student/account/myResult" ||
      pathname.startsWith("/student/account/myResult/")
    );
  }

  return (
    pathname === "/student/account" ||
    (pathname.startsWith("/student/account/") &&
      !pathname.startsWith("/student/account/myResult"))
  );
}

export default function Header() {
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
        "Сурагч";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

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
    <header className="sticky top-0 z-50 w-full border-b border-[#ECE8F6] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[72px] max-w-[1128px] items-center justify-between">
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

        <nav className="flex items-center gap-7">
          {navItems.map(({ href, label, icon: Icon, key }) => {
            const active = isNavItemActive(pathname, key);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-1 py-2 text-[14px] font-medium transition ${
                  active
                    ? "text-[#8E75E3]"
                    : "text-[#33313A] hover:text-[#8E75E3]"
                }`}
              >
                <Icon
                  size={16}
                  className={active ? "text-[#8E75E3]" : "text-[#51475A]"}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div
          ref={profileMenuRef}
          className="relative ml-4 border-l border-[#ECE8F6] pl-6"
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
                  {initials || "СУ"}
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
