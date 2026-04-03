import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader } from "@/components/BrandHeader";
import { EmptyState } from "@/components/EmptyState";
import { StudentExamCard } from "@/components/StudentExamCard";
import { useAppData } from "@/data/app-data";
import {
  buildStudentExamSubjectOrder,
  formatScheduledDate,
  formatScheduledTime,
} from "@/lib/student-exam";
import { colors } from "@/lib/theme";

export default function ResultsScreen() {
  const { submissions } = useAppData();
  const subjectOrder = buildStudentExamSubjectOrder(submissions);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <BrandHeader />

      <ScrollView contentContainerStyle={styles.content}>
        {submissions.length === 0 ? (
          <EmptyState
            title="Үр дүн алга"
            description="Шалгалт өгсний дараа үр дүн болон асуултын задлан харах хэсэг энд гарна."
          />
        ) : (
          <View style={styles.cards}>
            {submissions.map((submission) => (
              <StudentExamCard
                key={submission.id}
                subject={submission.subject}
                title={submission.title}
                grade={submission.grade}
                duration={submission.duration}
                questionCount={submission.questionCount}
                scheduledDate={formatScheduledDate(submission.scheduledDate)}
                startTime={formatScheduledTime(submission.startTime)}
                footerLabel="Эхэлсэн цаг"
                subjectOrder={subjectOrder}
                onPress={() => {
                  router.push(`/(student)/results/${submission.id}`);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 136,
  },
  cards: {
    gap: 16,
  },
});
