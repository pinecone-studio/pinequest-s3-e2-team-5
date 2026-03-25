"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type SchoolOnboardingTestPanelProps = {
  email: string;
  schoolName: string;
  managerName: string;
  address: string;
  aimag: string;
};

const STORAGE_KEY = "pinequest_school_test_profile_v1";

export function SchoolOnboardingTestPanel({
  email,
  schoolName,
  managerName,
  address,
  aimag,
}: SchoolOnboardingTestPanelProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [status, setStatus] = useState("");

  const profile = useMemo(
    () => ({
      email: email.trim(),
      schoolName: schoolName.trim(),
      managerName: managerName.trim(),
      address: address.trim(),
      aimag: aimag.trim(),
    }),
    [address, aimag, email, managerName, schoolName],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { savedAt?: string };
      setIsSaved(true);
      setSavedAt(parsed.savedAt ?? "");
    } catch {
      setIsSaved(false);
      setSavedAt("");
    }
  }, []);

  const handleSaveTestProfile = () => {
    if (typeof window === "undefined") {
      return;
    }

    if (!profile.schoolName || !profile.managerName || !profile.address || !profile.aimag) {
      setStatus("Сургуулийн мэдээллээ бүрэн бөглөнө үү.");
      return;
    }

    const now = new Date().toISOString();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...profile,
        savedAt: now,
      }),
    );
    setIsSaved(true);
    setSavedAt(now);
    setStatus("Test mode: School profile frontend дээр хадгалагдлаа.");
  };

  const handleReset = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    setIsSaved(false);
    setSavedAt("");
    setStatus("Test data цэвэрлэгдлээ.");
  };

  return (
    <section className="rounded-3xl border border-[#E7E8F0] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#111111]">
            School Onboarding (Test)
          </h2>
          <p className="mt-1 text-sm text-[#6D6A76]">
            Backend ажиллахгүй үед frontend тестээр сургуулийн бүртгэлийг шалгах самбар.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isSaved
              ? "bg-[#E8FFF2] text-[#1E7A44]"
              : "bg-[#FFF7E8] text-[#8B6A1E]"
          }`}
        >
          {isSaved ? "Saved (Test)" : "Not saved"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <p className="text-sm text-[#4D4A57]">
          <span className="font-semibold text-[#111111]">School:</span>{" "}
          {profile.schoolName || "-"}
        </p>
        <p className="text-sm text-[#4D4A57]">
          <span className="font-semibold text-[#111111]">Manager:</span>{" "}
          {profile.managerName || "-"}
        </p>
        <p className="text-sm text-[#4D4A57]">
          <span className="font-semibold text-[#111111]">Email:</span> {profile.email || "-"}
        </p>
        <p className="text-sm text-[#4D4A57]">
          <span className="font-semibold text-[#111111]">Aimag:</span> {profile.aimag || "-"}
        </p>
        <p className="text-sm text-[#4D4A57] sm:col-span-2">
          <span className="font-semibold text-[#111111]">Address:</span>{" "}
          {profile.address || "-"}
        </p>
      </div>

      {savedAt ? (
        <p className="mt-3 text-xs text-[#6D6A76]">Saved at: {savedAt}</p>
      ) : null}

      {status ? (
        <p className="mt-4 rounded-xl border border-[#E8E2FF] bg-[#F7F4FF] px-4 py-3 text-sm text-[#4C3C8A]">
          {status}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          className="h-10 rounded-xl bg-[#8B6FF7] px-5 text-white hover:bg-[#7A61DC]"
          onClick={handleSaveTestProfile}
        >
          Save Test Profile
        </Button>
        <Button
          variant="secondary"
          className="h-10 rounded-xl"
          onClick={handleReset}
        >
          Reset Test
        </Button>
      </div>
    </section>
  );
}
