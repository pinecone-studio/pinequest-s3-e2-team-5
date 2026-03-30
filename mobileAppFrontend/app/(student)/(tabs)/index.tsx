import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "@apollo/client/react";
import { router } from "expo-router";
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { StatusCard } from "@/components/StatusCard";
import { StudentExamCard } from "@/components/StudentExamCard";
import { StudentTopBar } from "@/components/StudentTopBar";
import { useStudentProfileSync } from "@/hooks/useStudentProfileSync";
import { GET_AVAILABLE_EXAMS, type AvailableExamsData } from "@/graphql/student";
import { colors, fonts, shadows } from "@/lib/theme";

export default function StudentHomeScreen() {
  const { user } = useUser();
  const displayName =
    (typeof user?.unsafeMetadata?.fullName === "string"
      ? user.unsafeMetadata.fullName
      : "") ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Сурагч";
  const { statusMessage, isSyncing, canSync } = useStudentProfileSync();
  const { data, loading, error, refetch } = useQuery<AvailableExamsData>(GET_AVAILABLE_EXAMS, {
    fetchPolicy: "cache-and-network",
  });

  const exams = data?.availableExamsForStudent ?? [];

  if (loading && !data) {
    return <FullScreenLoader label="Шалгалтуудыг ачаалж байна..." />;
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
          eyebrow="Student Dashboard"
          title={displayName}
          subtitle="Нээлттэй шалгалтуудаа утаснаасаа шууд өгч, явцаа native хамгаалалттайгаар үргэлжлүүлнэ."
        />

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{exams.length}</Text>
            <Text style={styles.statLabel}>Нээлттэй шалгалт</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{isSyncing ? "..." : canSync ? "OK" : "!"}</Text>
            <Text style={styles.statLabel}>Profile sync</Text>
          </View>
        </View>

        {statusMessage ? (
          <StatusCard
            tone={canSync ? (isSyncing ? "info" : "success") : "warning"}
            message={statusMessage}
          />
        ) : null}

        {error ? (
          <StatusCard tone="error" message={error.message} />
        ) : exams.length === 0 ? (
          <EmptyState
            title="Нээлттэй шалгалт алга"
            description="Шинэ шалгалт товлогдсон үед энд автоматаар харагдана."
          />
        ) : (
          <View style={styles.cards}>
            {exams.map((exam) => (
              <StudentExamCard
                key={exam.id}
                subject={exam.subject}
                title={exam.title}
                grade={exam.grade}
                duration={exam.duration}
                questionCount={exam.questionCount}
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
    paddingTop: 16,
    paddingBottom: 120,
  },
  statsRow: {
    marginTop: 16,
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
