"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CloudflareStudentSync } from "@/components/auth/cloudflare-student-sync";
import type { UserRole } from "@/lib/auth-role";
import Header from "./Header";

export const studentExamLayoutModeEvent = "pinequest-student-exam-layout-mode";

type StudentAccountShellProps = {
  children: ReactNode;
  hasStudentSyncMetadata: boolean;
  syncProps: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    grade: string;
    className: string;
    inviteCode: string;
    role: UserRole;
  };
};

export function StudentAccountShell({
  children,
  hasStudentSyncMetadata,
  syncProps,
}: StudentAccountShellProps) {
  const [hideLayoutChrome, setHideLayoutChrome] = useState(false);

  useEffect(() => {
    const handleLayoutModeChange = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      setHideLayoutChrome(Boolean(event.detail?.hidden));
    };

    window.addEventListener(
      studentExamLayoutModeEvent,
      handleLayoutModeChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        studentExamLayoutModeEvent,
        handleLayoutModeChange as EventListener,
      );
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      {!hideLayoutChrome ? <Header /> : null}

      {hasStudentSyncMetadata ? (
        <div className="hidden">
          <CloudflareStudentSync {...syncProps} />
        </div>
      ) : null}

      <main
        className={
          hideLayoutChrome ? "contents" : "mx-auto max-w-[1128px] py-10"
        }
      >
        {children}
      </main>
    </div>
  );
}
