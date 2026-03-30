import { useQuery } from "@apollo/client/react";
import { router } from "expo-router";
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { StatusCard } from "@/components/StatusCard";
import { StudentExamCard } from "@/components/StudentExamCard";
import { StudentTopBar } from "@/components/StudentTopBar";
import { GET_MY_EXAM_SUBMISSIONS, type MyExamSubmissionsData } from "@/graphql/student";
import { colors, fonts, shadows } from "@/lib/theme";
import { formatStudentExamTimestamp } from "@/lib/student-exam";

export default function ResultsScreen() {
  const { data, loading, error, refetch } = useQuery<MyExamSubmissionsData>(GET_MY_EXAM_SUBMISSIONS, {
    fetchPolicy: "cache-and-network",
  });

  const submissions = data?.myExamSubmissions ?? [];

  if (loading && !data) {
    return <FullScreenLoader label="Үр дүнг ачаалж байна..." />;
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading && Boolean(data)}
            onRefresh={() => {
              void refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <StudentTopBar
          eyebrow="Exam Results"
          title="Миний үр дүн"
          subtitle="Илгээсэн шалгалтуудын оноо, зөв хариулт, review дэлгэрэнгүйг эндээс харна."
        />

        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>{submissions.length}</Text>
          <Text style={styles.statsLabel}>Нийт илгээсэн шалгалт</Text>
        </View>

        {error ? (
          <StatusCard tone="error" message={error.message} />
        ) : submissions.length === 0 ? (
          <EmptyState
            title="Илгээсэн шалгалт алга"
            description="Шалгалт өгсний дараа үр дүнгүүд энэ хэсэгт хадгалагдана."
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
    paddingTop: 16,
    paddingBottom: 120,
  },
  statsCard: {
    marginTop: 16,
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
