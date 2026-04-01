import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { useAppData } from "@/data/app-data";
import { formatScheduledDate, formatScheduledTime, getStudentExamPresentation } from "@/lib/student-exam";
import { colors, fonts, shadows } from "@/lib/theme";

const learningMsLogo = require("../../../assets/learning-ms-logo.png");

export default function StudentHomeScreen() {
  const { availableExams, refreshData } = useAppData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"active" | "scheduled">("active");

  const scheduledExams = useMemo(() => [] as typeof availableExams, []);
  const visibleExams = selectedTab === "active" ? availableExams : scheduledExams;

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
      <View style={styles.header}>
        <View style={styles.brandMarkWrap}>
          <Image source={learningMsLogo} style={styles.brandImage} resizeMode="contain" />
        </View>
        <View>
          <Text style={styles.brandTop}>Learning</Text>
          <Text style={styles.brandBottom}>MS</Text>
        </View>
      </View>

      <View style={styles.segmentWrap}>
        <Pressable style={styles.segmentButton} onPress={() => setSelectedTab("active")}>
          <Text style={[styles.segmentLabel, selectedTab === "active" ? styles.segmentLabelActive : null]}>
            Идэвхтэй
          </Text>
          <View style={[styles.segmentLine, selectedTab === "active" ? styles.segmentLineActive : null]} />
        </Pressable>

        <Pressable style={styles.segmentButton} onPress={() => setSelectedTab("scheduled")}>
          <Text style={[styles.segmentLabel, selectedTab === "scheduled" ? styles.segmentLabelActive : null]}>
            Товлогдсон
          </Text>
          <View style={[styles.segmentLine, selectedTab === "scheduled" ? styles.segmentLineActive : null]} />
        </Pressable>
      </View>

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
            title={selectedTab === "active" ? "Идэвхтэй шалгалт алга" : "Товлосон шалгалт алга"}
            description={
              selectedTab === "active"
                ? "Доош татаж шинэчлээд үзээрэй. Шалгалт эхлэх цагтаа хүрмэгц энд орж ирнэ."
                : "Товлосон шалгалтын жагсаалтыг дараагийн алхмаар backend-ээс тусад нь холбоно."
            }
          />
        ) : (
          <View style={styles.cards}>
            {visibleExams.map((exam) => (
              <HomeExamCard
                key={exam.id}
                exam={exam}
                onPress={() => {
                  if (selectedTab === "active") {
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 24,
    paddingBottom: 18,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
  },
  brandMarkWrap: {
    height: 32,
    width: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  brandImage: {
    width: 43,
    height: 32,
  },
  brandTop: {
    fontFamily: fonts.display.medium,
    fontSize: 19,
    color: colors.textPrimary,
  },
  brandBottom: {
    marginTop: -2,
    fontFamily: fonts.display.medium,
    fontSize: 19,
    color: colors.textPrimary,
  },
  segmentWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "#FFFFFF",
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
  },
  segmentLabel: {
    paddingVertical: 14,
    fontFamily: fonts.display.medium,
    fontSize: 18,
    color: colors.textPrimary,
  },
  segmentLabelActive: {
    color: colors.primary,
  },
  segmentLine: {
    height: 2,
    width: "100%",
    backgroundColor: "transparent",
  },
  segmentLineActive: {
    backgroundColor: colors.primary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 136,
  },
  cards: {
    gap: 18,
  },
  card: {
    alignSelf: "center",
    width: 350,
    height: 263,
    justifyContent: "space-between",
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#CEC8FF",
    paddingHorizontal: 22,
    paddingVertical: 20,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.95,
  },
  cardIcon: {
    height: 43,
    width: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  cardTop: {
    alignItems: "flex-start",
  },
  cardBottom: {
    alignItems: "flex-start",
  },
  cardTitleRow: {
    marginTop: 18,
    width: "100%",
  },
  cardTitleText: {
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  cardSubject: {
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  cardTopic: {
    fontFamily: fonts.sans.regular,
    fontSize: 20,
    color: colors.textMuted,
  },
  cardGrade: {
    marginTop: 14,
    fontFamily: fonts.sans.medium,
    fontSize: 14,
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
    justifyContent: "center",
  },
  cardChipDuration: {
    width: 85,
    height: 28,
  },
  cardChipQuestions: {
    width: 101,
    height: 28,
  },
  cardChipText: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  cardTime: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  cardTimeAccent: {
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
  },
  cardDate: {
    marginTop: 6,
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyDescriptionTight: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
  },
});

function HomeExamCard({
  exam,
  onPress,
}: {
  exam: {
    id: string;
    title: string;
    subject: string;
    grade: string;
    duration: number;
    questionCount: number;
    scheduledDate: string;
    startTime: string;
  };
  onPress: () => void;
}) {
  const presentation = getStudentExamPresentation(exam.subject);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: presentation.background }, pressed ? styles.cardPressed : null]}
      onPress={onPress}
    >
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
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardTime}>
          Эхэлсэн цаг - <Text style={styles.cardTimeAccent}>/{formatScheduledTime(exam.startTime)}/</Text>
        </Text>
        <Text style={styles.cardDate}>{formatScheduledDate(exam.scheduledDate)}</Text>
      </View>
    </Pressable>
  );
}
