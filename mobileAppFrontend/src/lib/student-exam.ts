import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export function getStudentExamPresentation(subject: string): {
  subjectLabel: string;
  iconName: IconName;
  background: string;
  iconBackground: string;
} {
  const normalized = subject.trim().toLowerCase();

  if (normalized === "math") {
    return {
      subjectLabel: "Математик",
      iconName: "calculator-variant-outline",
      background: "#DFF0F8",
      iconBackground: "#C8E4F4",
    };
  }

  if (normalized === "chemistry") {
    return {
      subjectLabel: "Хими",
      iconName: "flask-outline",
      background: "#F0E4F8",
      iconBackground: "#E0CEFE",
    };
  }

  if (normalized === "english") {
    return {
      subjectLabel: "Англи",
      iconName: "book-education-outline",
      background: "#E3F5E8",
      iconBackground: "#C9EBD3",
    };
  }

  if (normalized === "physics") {
    return {
      subjectLabel: "Физик",
      iconName: "atom-variant",
      background: "#E8F1FF",
      iconBackground: "#D5E5FF",
    };
  }

  if (normalized === "civics") {
    return {
      subjectLabel: "Иргэний боловсрол",
      iconName: "account-school-outline",
      background: "#F8E2EF",
      iconBackground: "#F1CBE2",
    };
  }

  return {
    subjectLabel: "Нийгэм",
    iconName: "notebook-outline",
    background: "#E8E4F8",
    iconBackground: "#D4CEFE",
  };
}

export function getStudentExamHeader(subject: string, title: string) {
  return `${getStudentExamPresentation(subject).subjectLabel} - ${title}`;
}

export function formatScheduledDate(date?: string | null) {
  if (!date) {
    return "Товлоогүй";
  }

  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    return date;
  }

  return `${year}/${month}/${day}`;
}

export function formatScheduledTime(time?: string | null) {
  if (!time) {
    return "--:--";
  }

  return time.slice(0, 5);
}

export function getExamEndTime(startTime: string | null | undefined, durationMinutes: number) {
  if (!startTime) {
    return "--:--";
  }

  const [hours, minutes] = startTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return startTime;
  }

  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const endHours = Math.floor(normalizedMinutes / 60);
  const endMinutes = normalizedMinutes % 60;

  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

export function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatStudentExamTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}, ${year}`;
}
