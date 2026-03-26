import { notFound } from "next/navigation";
import { StudentReviewDetail } from "../../../../_component/StudentReviewDetail";
import { examCards, studentResultsByExam } from "../../../../_data/dashboard";

type TeacherStudentReviewPageProps = {
  params: Promise<{
    examId: string;
    studentId: string;
  }>;
};

export default async function TeacherStudentReviewPage({
  params,
}: TeacherStudentReviewPageProps) {
  const { examId, studentId } = await params;
  const exam = examCards.find((item) => item.id === examId);
  const student = (studentResultsByExam[examId] ?? []).find(
    (item) => String(item.id) === studentId,
  );

  if (!exam || !student) {
    notFound();
  }

  return <StudentReviewDetail exam={exam} student={student} />;
}
