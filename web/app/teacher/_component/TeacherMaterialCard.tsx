import { CircleQuestionMark, Clock3, ScrollText } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  getExamClassLabel,
  getSubjectCardPalette,
  type ExamCard,
} from "../_data/dashboard";

function getActionButtonStyles(card: ExamCard): CSSProperties {
  const palette = getSubjectCardPalette(card.subject);
  return {
    background: palette.actionButtonBackground,
    boxShadow: `inset 0 -5px 0 ${palette.actionButtonInsetShadow}, 0 8px 16px ${palette.actionButtonDropShadow}`,
  };
}

type TeacherMaterialCardProps = {
  card: ExamCard;
  href: string;
  onActionClick?: (card: ExamCard) => void;
};

export function TeacherMaterialCard({
  card,
  href,
  onActionClick,
}: TeacherMaterialCardProps) {
  const palette = getSubjectCardPalette(card.subject);
  const classLabel = getExamClassLabel(card.classroomName, card.grade);
  const topicLabel = card.topic.trim();

  return (
    <div
      className="group flex h-[252px] w-[264px] flex-none flex-col rounded-[32px] border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(48,34,92,0.08)]"
      style={{
        backgroundColor: palette.cardBackground,
        borderColor: palette.borderColor,
      }}
    >
      <Link href={href} className="block">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[18px]"
              style={{ backgroundColor: palette.iconBackground }}
            >
              <ScrollText
                className="h-6 w-6 text-[#111111]"
                strokeWidth={2.2}
              />
            </div>
            <div>
              <h2 className="text-[20px] font-medium leading-[1.2] text-[#111111]">
                {card.title}
                {topicLabel ? (
                  <span className="font-normal text-[18px] text-[#5F5B69]">
                    {" "}
                    /{topicLabel}/
                  </span>
                ) : null}
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[16px] font-medium text-[#111111]">
              {classLabel}
            </p>
            <div className="flex gap-3 text-[14px] text-[#1B1A1F]">
              <span className="flex h-7 min-w-[101px] items-center justify-center gap-2 rounded-full bg-white px-3 shadow-[0_6px_14px_rgba(126,112,166,0.08)]">
                <Clock3 className="h-4 w-4" />
                {card.duration} мин
              </span>
              <span className="flex h-7 min-w-[101px] items-center justify-center gap-2 rounded-full bg-white px-3 shadow-[0_6px_14px_rgba(126,112,166,0.08)]">
                <CircleQuestionMark className="h-4 w-4" />
                {card.taskCount} дасгал
              </span>
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-center pt-3">
        <button
          type="button"
          onClick={() => onActionClick?.(card)}
          className="flex h-[32px] w-[224px] items-center justify-center rounded-full text-[14px] font-medium text-white"
          style={getActionButtonStyles(card)}
        >
          Шалгалт авах
        </button>
      </div>
    </div>
  );
}
