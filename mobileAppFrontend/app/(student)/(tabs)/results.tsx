import { router } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { StudentExamCard } from "@/components/StudentExamCard";
import { useAppData } from "@/data/app-data";
import { colors, fonts, shadows } from "@/lib/theme";
import { formatStudentExamTimestamp } from "@/lib/student-exam";

export default function ResultsScreen() {
  const { submissions } = useAppData();

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>{submissions.length}</Text>
          <Text style={styles.statsLabel}>Илгээсэн шалгалт</Text>
        </View>

        {submissions.length === 0 ? (
          <EmptyState
            title="Үр дүн алга"
            description="Шалгалт өгсний дараа үр дүн болон асуултын review энд харагдана."
          />
        ) : (
          <View style={styles.cards}>
            {submissions.map((submission) => (
              <StudentExamCard
                key={submission.id}
                subject={submission.subject}
                title={submission.title}
                grade={`${submission.grade} · ${submission.scorePercent}%`}
                duration={submission.duration}
                questionCount={submission.questionCount}
                scheduledDate={formatStudentExamTimestamp(submission.submittedAt)}
                startTime={`${submission.correctAnswers} зөв`}
                footerLabel={`${submission.scorePercent}%`}
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
    paddingTop: 8,
    paddingBottom: 136,
  },
  statsCard: {
    marginTop: 0,
    marginBottom: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 16,
    ...shadows.card,
  },
  statsValue: {
    fontFamily: fonts.display.semibold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  statsLabel: {
    marginTop: 6,
    fontFamily: fonts.sans.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  cards: {
    gap: 16,
  },
});
