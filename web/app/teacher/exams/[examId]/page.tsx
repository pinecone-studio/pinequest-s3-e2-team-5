import { notFound } from "next/navigation";
import { TeacherExamDetail } from "../../_component/TeacherExamDetail";
import { examCards } from "../../_data/dashboard";

type TeacherExamViewPageProps = {
  params: Promise<{
    examId: string;
  }>;
};

export default async function TeacherExamViewPage({
  params,
}: TeacherExamViewPageProps) {
  const { examId } = await params;
  const exam = examCards.find((item) => item.id === examId);

  if (!exam) {
    notFound();
  }

  return <TeacherExamDetail exam={exam} />;
}
