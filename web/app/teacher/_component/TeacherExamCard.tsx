import {
  Atom,
  Clock3,
  FlaskConical,
  Globe,
  Languages,
  PencilLine,
  Radical,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  getExamClassLabel,
  getSubjectDisplayLabel,
  getSubjectCardPalette,
  type ExamCard,
} from "../_data/dashboard";

const subjectIconMap: Record<ExamCard["subject"], LucideIcon> = {
  social: Globe,
  civics: ScrollText,
  math: Radical,
  english: Languages,
  chemistry: FlaskConical,
  physics: Atom,
};

type TeacherExamCardProps = {
  card: ExamCard;
  href: string;
};

export function TeacherExamCard({ card, href }: TeacherExamCardProps) {
  const palette = getSubjectCardPalette(card.subject);
  const SubjectIcon = subjectIconMap[card.subject];
  const classLabel = getExamClassLabel(card.classroomName, card.grade);
  const topicLabel = card.topic.trim();

  return (
    <Link
      href={href}
      className="group flex h-[252px] w-[264px] flex-none flex-col rounded-[24px] border px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-md"
      style={{
        backgroundColor: palette.cardBackground,
        borderColor: palette.borderColor,
      }}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: palette.iconBackground }}
      >
        <SubjectIcon className="h-5 w-5 text-[#111111]" strokeWidth={2} />
      </div>

      <div className="mt-2">
        <h2 className="text-[18px] font-semibold text-[#111111]">
          {card.title}
          {topicLabel ? (
            <span className="font-normal text-[#5F5B69]"> /{topicLabel}/</span>
          ) : null}
        </h2>
        <p className="mt-1 text-sm text-[#6B6B6B]">{classLabel}</p>
      </div>

      <div className="mt-3 flex gap-2 text-xs">
        <span className="flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 shadow-sm">
          <Clock3 className="h-3.5 w-3.5" />
          {card.duration} мин
        </span>
        <span className="flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 shadow-sm">
          <PencilLine className="h-3.5 w-3.5" />
          {card.taskCount} даалгавар
        </span>
      </div>

      <div className="mt-auto">
        <p className="text-sm text-[#111111]">
          {getSubjectDisplayLabel(card.subject)} / {card.startTime || "--:--"}
        </p>
        <p className="mt-2 text-xs text-[#6D6778]">{card.date || "-"}</p>
      </div>
    </Link>
  );
}
