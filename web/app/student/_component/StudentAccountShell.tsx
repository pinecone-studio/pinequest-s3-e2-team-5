"use client";

import { useEffect, useState, type ReactNode } from "react";
import Header from "./Header";

export const studentExamLayoutModeEvent = "pinequest-student-exam-layout-mode";

type StudentAccountShellProps = {
  children: ReactNode;
};

export function StudentAccountShell({
  children,
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
