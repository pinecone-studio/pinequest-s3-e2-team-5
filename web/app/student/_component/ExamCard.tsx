import {
  BookA,
  Clock,
  FlaskConical,
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
  bg,
  iconBg,
  onClick,
}: ExamCardProps) {
  const cardContent = (
    <div
      className={`group flex  max-w-[264px] cursor-pointer flex-col gap-3 rounded-[20px] p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${bg}`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}
      >
        <ExamCardIcon icon={icon} iconKey={iconKey} />
      </div>
      <div className="mt-1">
        <p className="text-[20px] leading-snug text-gray-800">
          <span className="font-bold">{subject}</span>{" "}
          <span className="font-normal text-gray-500">/{topic}/</span>
        </p>
        <p className="mt-1 text-[16px] font-medium text-gray-700">{grade}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[14px] text-[#000000]">
          <Clock size={12} className="text-gray-400" />
          {minutes} мин
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[14px] text-[#000000]">
          <PenLine size={12} className="text-gray-400" />
          {exercises} дасгал
        </span>
      </div>
      <div>
        <p className="text-[12px] text-black font-bold ">
          Эхлэх цаг - /{startTime}/
        </p>
        <p className="text-[12px] text-[#8B8B8B]">{scheduledDate}</p>
      </div>
    </div>
  );

  if (!onClick) {
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
