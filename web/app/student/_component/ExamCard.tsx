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
}: {
  icon?: ReactNode;
  iconKey?: StudentExamIconKey;
}) {
  if (icon) {
    return icon;
  }

  const className = "h-6 w-6 text-[#1B1825]";
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
        "relative flex h-[269px] w-[264px] flex-col overflow-hidden rounded-[20px] p-5 text-left transition-all duration-300",
        locked ? `${bg} border border-[#D8DEE8]` : bg,
        isClickable
          ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg"
          : "cursor-default",
      ].join(" ")}
    >
      {locked ? (
        <div className="pointer-events-none absolute inset-0 bg-white/55" />
      ) : null}

      {locked ? (
        <div className="absolute top-3 right-3 z-10 rounded-full border border-[#CED4DE] bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#2F333B]">
          {formatCountdown(effectiveSecondsUntilStart)}
        </div>
      ) : null}

      {locked ? (
        <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full  p-2.5">
          <Lock className="h-5 w-5 text-[#2A2F37]" strokeWidth={2.1} />
        </div>
      ) : null}

      <div className="relative z-[1] flex h-full flex-col">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${
            locked ? "bg-white/50" : iconBg
          }`}
        >
          <ExamCardIcon icon={icon} iconKey={iconKey} />
        </div>

        <div className="mt-2">
          <p
            className={`leading-none tracking-tight ${locked ? "text-[#6C7585]" : "text-[#1F2430]"}`}
          >
            <span className="text-[30px] font-bold">{subject}</span>{" "}
            <span className="text-[22px] font-normal">/{topic}/</span>
          </p>
        </div>

        <div className="mt-2 flex items-center">
          <p
            className={`text-[20px] ${locked ? "text-[#6F7888]" : "text-[#2C2F37]"}`}
          >
            {grade}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-[2px] text-[12px] ${
              locked
                ? "border-[#D1D7E1] bg-white/70 text-[#7C8593]"
                : "border-gray-200 bg-white text-[#000000]"
            }`}
          >
            <Clock
              size={11}
              className={locked ? "text-[#A3ABB9]" : "text-gray-400"}
            />
            {minutes} мин
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-[2px] text-[12px] ${
              locked
                ? "border-[#D1D7E1] bg-white/70 text-[#7C8593]"
                : "border-gray-200 bg-white text-[#000000]"
            }`}
          >
            <PenLine
              size={11}
              className={locked ? "text-[#A3ABB9]" : "text-gray-400"}
            />
            {exercises} дасгал
          </span>
        </div>

        <div className="mt-auto">
          <p
            className={`text-[12px] font-semibold ${
              locked ? "text-[#798191]" : "text-black"
            }`}
          >
            Эхлэх цаг - /{displayStartTime}/
          </p>
          <p
            className={`text-[12px] ${locked ? "text-[#8A92A0]" : "text-[#8B8B8B]"}`}
          >
            {displayScheduledDate}
          </p>
        </div>
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
