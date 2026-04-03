import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";
import { BrandHeader } from "@/components/BrandHeader";
import { EmptyState } from "@/components/EmptyState";
import type { Exam } from "@/data/types";
import { useAppData } from "@/data/app-data";
import {
  buildStudentExamSubjectOrder,
  formatCountdown,
  formatScheduledDate,
  formatScheduledTime,
  getStudentExamPresentation,
} from "@/lib/student-exam";
import { colors, fonts, shadows } from "@/lib/theme";

const simplificationIllustration = Image.resolveAssetSource(require("../../../Simplification.svg"));

type FeedExam = Exam & {
  isScheduledFeed: boolean;
};

export default function StudentHomeScreen() {
  const { availableExams, scheduledExams, refreshData } = useAppData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const visibleExams = useMemo<FeedExam[]>(() => {
    const combined = [
      ...availableExams.map((exam) => ({
        ...exam,
        isScheduledFeed: false,
      })),
      ...scheduledExams.map((exam) => ({
        ...exam,
        isScheduledFeed: true,
      })),
    ];

    return combined.sort((left, right) => {
      const leftLocked = left.isScheduledFeed || left.isLocked;
      const rightLocked = right.isScheduledFeed || right.isLocked;

      if (leftLocked !== rightLocked) {
        return leftLocked ? 1 : -1;
      }

      const leftStartsAt =
        left.startsAtMs ??
        Date.parse(`${left.scheduledDate}T${left.startTime || "00:00"}:00`);
      const rightStartsAt =
        right.startsAtMs ??
        Date.parse(`${right.scheduledDate}T${right.startTime || "00:00"}:00`);

      return leftStartsAt - rightStartsAt;
    });
  }, [availableExams, scheduledExams]);
  const subjectOrder = useMemo(() => buildStudentExamSubjectOrder(visibleExams), [visibleExams]);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <BrandHeader />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.primary}
          />
        }
      >
        {visibleExams.length === 0 ? (
          <EmptyState
            illustration={
              <SvgUri
                uri={simplificationIllustration.uri}
                width={232}
                height={232}
              />
            }
            title="Одоогоор харагдах шалгалт алга."
          />
        ) : (
          <View style={styles.cards}>
            {visibleExams.map((exam) => (
              <HomeExamCard
                key={exam.id}
                exam={exam}
                subjectOrder={subjectOrder}
                nowMs={nowMs}
                onPress={() => {
                  const isLocked = exam.isScheduledFeed || exam.isLocked;

                  if (!isLocked) {
                    router.push(`/(student)/exam/${exam.id}`);
                  }
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
    backgroundColor: "#FFFFFF",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 136,
  },
  cards: {
    gap: 18,
  },
  card: {
    position: "relative",
    width: "100%",
    minHeight: 264,
    justifyContent: "space-between",
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 22,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.95,
  },
  cardLocked: {
    opacity: 0.62,
  },
  cardTimeBadge: {
    position: "absolute",
    top: 20,
    right: 18,
    minWidth: 92,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(18, 18, 18, 0.14)",
    backgroundColor: "#FFFFFF",
  },
  cardTimeBadgeText: {
    fontFamily: fonts.display.medium,
    fontSize: 18,
    color: colors.textPrimary,
  },
  cardIcon: {
    height: 62,
    width: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  cardTop: {
    alignItems: "flex-start",
  },
  cardBottom: {
    alignItems: "flex-start",
  },
  cardTitleRow: {
    marginTop: 18,
    width: "82%",
  },
  cardTitleText: {
    fontFamily: fonts.display.semibold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  cardSubject: {
    fontFamily: fonts.display.semibold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  cardTopic: {
    fontFamily: fonts.sans.regular,
    fontSize: 22,
    color: colors.textMuted,
  },
  cardGrade: {
    marginTop: 14,
    fontFamily: fonts.sans.medium,
    fontSize: 18,
    color: colors.textPrimary,
  },
  cardChipRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  cardChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  cardChipDuration: {
    minWidth: 92,
    height: 30,
  },
  cardChipQuestions: {
    minWidth: 110,
    height: 30,
  },
  cardChipText: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  lockWrap: {
    alignSelf: "center",
    marginTop: 18,
    marginBottom: 8,
    height: 64,
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  cardTime: {
    fontFamily: fonts.sans.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  cardTimeAccent: {
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
  },
  cardDate: {
    marginTop: 6,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
});

function HomeExamCard({
  exam,
  subjectOrder,
  nowMs,
  onPress,
}: {
  exam: FeedExam;
  subjectOrder: string[];
  nowMs: number;
  onPress: () => void;
}) {
  const presentation = getStudentExamPresentation(exam.subject, subjectOrder);
  const isLocked = exam.isScheduledFeed || exam.isLocked;
  const countdownLabel = getStartsInLabel(exam.startsAtMs, nowMs);

  return (
    <Pressable
      disabled={isLocked}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: presentation.background,
          borderColor: presentation.borderColor,
        },
        isLocked ? styles.cardLocked : null,
        pressed ? styles.cardPressed : null,
      ]}
      onPress={onPress}
    >
      {isLocked && countdownLabel ? (
        <View style={styles.cardTimeBadge}>
          <Text style={styles.cardTimeBadgeText}>{countdownLabel}</Text>
        </View>
      ) : null}

      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: presentation.iconBackground }]}>
          <MaterialCommunityIcons name={presentation.iconName} size={22} color={colors.textPrimary} />
        </View>

        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitleText} numberOfLines={1} ellipsizeMode="tail">
            <Text style={styles.cardSubject}>{presentation.subjectLabel}</Text>
            <Text style={styles.cardTopic}> /{exam.title}/</Text>
          </Text>
        </View>

        <Text style={styles.cardGrade}>{exam.grade}</Text>

        <View style={styles.cardChipRow}>
          <View style={[styles.cardChip, styles.cardChipDuration]}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.cardChipText}>{exam.duration} мин</Text>
          </View>

          <View style={[styles.cardChip, styles.cardChipQuestions]}>
            <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.cardChipText}>{exam.questionCount} дасгал</Text>
          </View>
        </View>

        {isLocked ? (
          <View style={styles.lockWrap}>
            <MaterialCommunityIcons name="lock-outline" size={40} color={colors.textPrimary} />
          </View>
        ) : null}
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardTime}>
          {isLocked ? "Эхлэх цаг" : "Эхэлсэн цаг"} -{" "}
          <Text style={styles.cardTimeAccent}>/{formatScheduledTime(exam.startTime)}/</Text>
        </Text>
        <Text style={styles.cardDate}>{formatScheduledDate(exam.scheduledDate)}</Text>
      </View>
    </Pressable>
  );
}

function getStartsInLabel(startsAtMs: number | null | undefined, nowMs: number) {
  if (!startsAtMs || startsAtMs <= nowMs) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.floor((startsAtMs - nowMs) / 1000));

  if (totalSeconds >= 60 * 60) {
    const totalMinutes = Math.ceil(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  return formatCountdown(totalSeconds);
}
