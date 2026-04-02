import {
  BookA,
  Clock,
  FlaskConical,
  Lock,
  NotebookText,
  PenLine,
  Radical,
} from "lucide-react";
import type { ReactNode } from "react";
import type { StudentExamIconKey } from "../_data/completed-exams";

interface ExamCardProps {
  icon?: ReactNode;
  iconKey?: StudentExamIconKey;
  subject: string;
  topic: string;
  grade: string;
  minutes: number;
  exercises: number;
  date: string;
  bg: string;
  iconBg: string;
  scheduledDate?: string;
  startTime?: string;
  locked?: boolean;
  minutesUntilStart?: number;
  secondsUntilStart?: number;
  onClick?: () => void;
}

function ExamCardIcon({
  icon,
  iconKey,
  muted = false,
}: {
  icon?: ReactNode;
  iconKey?: StudentExamIconKey;
  muted?: boolean;
}) {
  if (icon) {
    return icon;
  }

  const className = muted ? "h-5 w-5 text-[#9DA5B4]" : "h-6 w-6 text-[#1B1825]";
  const props = { strokeWidth: 2.2, className };

  if (iconKey === "radical") {
    return <Radical {...props} />;
  }

  if (iconKey === "flaskConical") {
    return <FlaskConical {...props} />;
  }

  if (iconKey === "bookA") {
    return <BookA {...props} />;
  }

  return <NotebookText {...props} />;
}

export default function ExamCard({
  icon,
  iconKey,
  subject,
  topic,
  grade,
  minutes,
  exercises,
  startTime,
  scheduledDate,
  locked = false,
  minutesUntilStart = 0,
  secondsUntilStart = 0,
  bg,
  iconBg,
  onClick,
}: ExamCardProps) {
  const formatCountdown = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, totalSeconds);
    const mm = Math.floor(safeSeconds / 60);
    const ss = safeSeconds % 60;

    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  const displayStartTime = startTime ? startTime.slice(0, 5) : "--:--";
  const displayScheduledDate = scheduledDate || "----/--/--";
  const isClickable = Boolean(onClick) && !locked;
  const effectiveSecondsUntilStart =
    secondsUntilStart > 0
      ? secondsUntilStart
      : Math.max(1, minutesUntilStart * 60);

  const cardContent = (
    <div
      className={[
        "relative flex h-[263px] w-[264px] flex-col overflow-hidden rounded-[20px] border p-4 text-left transition-all duration-300",
        bg,
        locked ? "border-[#DFE6C8]" : "border-transparent",
        isClickable
          ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg"
          : "cursor-default",
      ].join(" ")}
    >
      {locked ? (
        <div className="absolute top-3 right-3 rounded-full border border-[#CDD2C1] bg-white/90 px-2.5 py-[1px] text-[10px] font-medium w-[62px] h-[28px] leading-none text-[#2F3440]">
          <p className="flex justify-center items-center p-0.5 text-sm">
            {" "}
            {formatCountdown(effectiveSecondsUntilStart)}
          </p>
        </div>
      ) : null}

      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          locked ? `${iconBg} border border-[#C9CFB7]` : iconBg
        }`}
      >
        <ExamCardIcon icon={icon} iconKey={iconKey} muted={locked} />
      </div>
      <div className="mt-2">
        <p className="text-[20px] leading-snug">
          <span
            className={
              locked ? "font-bold text-[#6B7280]" : "font-bold text-gray-800"
            }
          >
            {subject}
          </span>{" "}
          <span
            className={
              locked
                ? "font-normal text-[#9CA3AF]"
                : "font-normal text-gray-500"
            }
          >
            /{topic}/
          </span>
        </p>
        <p
          className={`mt-1 text-[16px] font-medium ${locked ? "text-[#7A7F8A]" : "text-gray-700"}`}
        >
          {grade}
        </p>
      </div>
      {locked ? (
        <div className="pointer-events-none absolute inset-x-0 top-[122px] flex justify-center">
          <Lock size={22} className="text-[#20222A]" strokeWidth={2.2} />
        </div>
      ) : null}
      <div className="mt-auto">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] ${
              locked
                ? "border border-white/80 bg-white/70 text-[#8B93A2]"
                : "border border-gray-200 bg-white text-[#000000]"
            }`}
          >
            <Clock
              size={11}
              className={locked ? "text-[#A1A8B6]" : "text-gray-400"}
            />
            {minutes} мин
          </span>
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] ${
              locked
                ? "border border-white/80 bg-white/70 text-[#8B93A2]"
                : "border border-gray-200 bg-white text-[#000000]"
            }`}
          >
            <PenLine
              size={11}
              className={locked ? "text-[#A1A8B6]" : "text-gray-400"}
            />
            {exercises} дасгал
          </span>
        </div>
        <p
          className={`text-[12px] font-bold ${locked ? "text-[#7A808E]" : "text-black"}`}
        >
          Эхлэх цаг - /{displayStartTime}/
        </p>
        <p
          className={`text-[12px] ${locked ? "text-[#9CA3AF]" : "text-[#8B8B8B]"}`}
        >
          {displayScheduledDate}
        </p>
      </div>
    </div>
  );

  if (!isClickable) {
    return cardContent;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="appearance-none border-0 bg-transparent p-0 text-left"
    >
      {cardContent}
    </button>
  );
}
