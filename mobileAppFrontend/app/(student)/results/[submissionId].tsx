import { useQuery } from "@apollo/client/react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { StatusCard } from "@/components/StatusCard";
import {
  GET_STUDENT_EXAM_SUBMISSION_DETAIL,
  type StudentExamSubmissionDetailData,
  type SubmissionAnswerReview,
} from "@/graphql/student";
import { colors, fonts, shadows } from "@/lib/theme";
import { formatScheduledDate, formatScheduledTime, formatStudentExamTimestamp } from "@/lib/student-exam";

function getPaletteTone(answer: SubmissionAnswerReview) {
  if (answer.type === "mcq") {
    return answer.isCorrect ? "correct" : "wrong";
  }

  return "pending";
}

function getChoiceTone(answer: SubmissionAnswerReview, optionId: string) {
  if (answer.correctChoiceId === optionId) {
    return "correct";
  }

  if (answer.selectedChoiceId === optionId) {
    return "wrong";
  }

  return "neutral";
}

export default function ResultDetailScreen() {
  const params = useLocalSearchParams<{ submissionId: string }>();
  const submissionId = typeof params.submissionId === "string" ? params.submissionId : "";
  const { data, loading, error } = useQuery<StudentExamSubmissionDetailData>(
    GET_STUDENT_EXAM_SUBMISSION_DETAIL,
    {
      variables: { submissionId },
      skip: !submissionId,
    },
  );

  const detail = data?.studentExamSubmissionDetail;

  if (loading) {
    return <FullScreenLoader label="Үр дүнгийн дэлгэрэнгүйг ачаалж байна..." />;
  }

  if (error || !detail) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.content}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
            <Text style={styles.backText}>Буцах</Text>
          </Pressable>
          <StatusCard
            tone="error"
            message={error?.message || "Үр дүнгийн дэлгэрэнгүй олдсонгүй."}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
          <Text style={styles.backText}>Буцах</Text>
        </Pressable>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{detail.title}</Text>
          <Text style={styles.heroSubtitle}>
            {detail.correctAnswers}/{detail.questionCount} зөв · {detail.scorePercent}%
          </Text>

          <View style={styles.heroMetaGrid}>
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaLabel}>Илгээсэн</Text>
              <Text style={styles.heroMetaValue}>
                {formatStudentExamTimestamp(detail.submittedAt)}
              </Text>
            </View>
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaLabel}>Өдөр</Text>
              <Text style={styles.heroMetaValue}>
                {formatScheduledDate(detail.scheduledDate)}
              </Text>
            </View>
            <View style={styles.heroMetaItem}>
              <Text style={styles.heroMetaLabel}>Эхлэх</Text>
              <Text style={styles.heroMetaValue}>
                {formatScheduledTime(detail.startTime)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.paletteCard}>
          <Text style={styles.paletteTitle}>Review палитр</Text>
          <View style={styles.paletteGrid}>
            {detail.answers.map((answer) => {
              const tone = getPaletteTone(answer);
              return (
                <View
                  key={answer.questionId}
                  style={[
                    styles.paletteItem,
                    tone === "correct"
                      ? styles.paletteCorrect
                      : tone === "wrong"
                        ? styles.paletteWrong
                        : styles.palettePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.paletteText,
                      tone === "pending" ? styles.paletteTextPending : styles.paletteTextStrong,
                    ]}
                  >
                    {answer.order}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.answers}>
          {detail.answers.map((answer) => (
            <View key={answer.questionId} style={styles.answerCard}>
              <Text style={styles.questionTitle}>
                {answer.order}. {answer.question}
              </Text>

              {answer.type === "mcq" ? (
                <View style={styles.choiceList}>
                  {answer.choices.map((choice) => {
                    const tone = getChoiceTone(answer, choice.id);
                    return (
                      <View
                        key={choice.id}
                        style={[
                          styles.choiceRow,
                          tone === "correct"
                            ? styles.choiceCorrect
                            : tone === "wrong"
                              ? styles.choiceWrong
                              : null,
                        ]}
                      >
                        <View
                          style={[
                            styles.choiceBadge,
                            tone === "correct"
                              ? styles.choiceBadgeCorrect
                              : tone === "wrong"
                                ? styles.choiceBadgeWrong
                                : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.choiceBadgeText,
                              tone === "neutral" ? null : styles.choiceBadgeTextStrong,
                            ]}
                          >
                            {choice.label}
                          </Text>
                        </View>
                        <Text style={styles.choiceText}>{choice.text}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.openAnswerCard}>
                  <Text style={styles.openAnswerLabel}>Таны хариулт</Text>
                  <Text style={styles.openAnswerText}>
                    {answer.answerText?.trim() || "Хариулт оруулаагүй байна."}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
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
    paddingTop: 12,
    paddingBottom: 44,
  },
  backButton: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  backText: {
    fontFamily: fonts.sans.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  heroCard: {
    borderRadius: 30,
    backgroundColor: colors.surface,
    padding: 22,
    ...shadows.card,
  },
  heroTitle: {
    fontFamily: fonts.display.semibold,
    fontSize: 26,
    color: colors.textPrimary,
  },
  heroSubtitle: {
    marginTop: 8,
    fontFamily: fonts.sans.medium,
    fontSize: 15,
    color: colors.primary,
  },
  heroMetaGrid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  heroMetaItem: {
    minWidth: "30%",
    borderRadius: 18,
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  heroMetaLabel: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textSoft,
  },
  heroMetaValue: {
    marginTop: 5,
    fontFamily: fonts.sans.semibold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  paletteCard: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: 18,
    ...shadows.card,
  },
  paletteTitle: {
    fontFamily: fonts.sans.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  paletteGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  paletteItem: {
    height: 38,
    width: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
  },
  paletteCorrect: {
    borderColor: "#CDEBCE",
    backgroundColor: "#E8F7E9",
  },
  paletteWrong: {
    borderColor: "#F0C2BD",
    backgroundColor: "#FBEAEA",
  },
  palettePending: {
    borderColor: "#F3D7A3",
    backgroundColor: "#FFF7E7",
  },
  paletteText: {
    fontFamily: fonts.sans.semibold,
    fontSize: 13,
  },
  paletteTextStrong: {
    color: colors.textPrimary,
  },
  paletteTextPending: {
    color: "#B8860B",
  },
  answers: {
    marginTop: 16,
    gap: 16,
  },
  answerCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 18,
    ...shadows.card,
  },
  questionTitle: {
    fontFamily: fonts.sans.semibold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  choiceList: {
    marginTop: 16,
    gap: 10,
  },
  choiceRow: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  choiceCorrect: {
    borderColor: "#CDEBCE",
    backgroundColor: "#E8F7E9",
  },
  choiceWrong: {
    borderColor: "#F0C2BD",
    backgroundColor: "#FBEAEA",
  },
  choiceBadge: {
    height: 26,
    width: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.surfaceTint,
  },
  choiceBadgeCorrect: {
    backgroundColor: "#76B779",
  },
  choiceBadgeWrong: {
    backgroundColor: "#D66F68",
  },
  choiceBadgeText: {
    fontFamily: fonts.sans.semibold,
    fontSize: 12,
    color: colors.textPrimary,
  },
  choiceBadgeTextStrong: {
    color: "#FFFFFF",
  },
  choiceText: {
    flex: 1,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  openAnswerCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  openAnswerLabel: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textSoft,
  },
  openAnswerText: {
    marginTop: 8,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
  },
});
