import { router } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { StatusCard } from "@/components/StatusCard";
import { StudentExamCard } from "@/components/StudentExamCard";
import { useAppData } from "@/data/app-data";
import { colors, fonts, shadows } from "@/lib/theme";

export default function StudentHomeScreen() {
  const { availableExams, submissions } = useAppData();

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{availableExams.length}</Text>
            <Text style={styles.statLabel}>Нээлттэй шалгалт</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{submissions.length}</Text>
            <Text style={styles.statLabel}>Өгсөн шалгалт</Text>
          </View>
        </View>

        <StatusCard
          tone="info"
          message="Шалгалтын үеэр reminder, screenshot alert, app switch warning, keep-awake хамгаалалт ажиллана."
        />

        {availableExams.length === 0 ? (
          <EmptyState
            title="Нээлттэй шалгалт алга"
            description="Шинэ шалгалт нэмэх бол `src/data/student-data.ts` дотор өгөгдлөө оруулна уу."
          />
        ) : (
          <View style={styles.cards}>
            {availableExams.map((exam) => (
              <StudentExamCard
                key={exam.id}
                subject={exam.subject}
                title={exam.title}
                grade={exam.grade}
                duration={exam.duration}
                questionCount={exam.questions.length}
                scheduledDate={exam.scheduledDate}
                startTime={exam.startTime}
                onPress={() => router.push(`/(student)/exam/${exam.id}`)}
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
  statsRow: {
    marginTop: 0,
    marginBottom: 18,
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...shadows.card,
  },
  statValue: {
    fontFamily: fonts.display.semibold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  statLabel: {
    marginTop: 6,
    fontFamily: fonts.sans.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  cards: {
    gap: 16,
  },
});
