import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { usePreventScreenCapture, useScreenshotListener } from "expo-screen-capture";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAppData } from "@/data/app-data";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StatusCard } from "@/components/StatusCard";
import { clearExamDraft, getExamDraft, saveExamDraft } from "@/lib/exam-draft";
import { colors, fonts, shadows } from "@/lib/theme";
import type { StudentAnswerDraft } from "@/lib/student-types";
import { formatCountdown } from "@/lib/student-exam";

function getRemainingSeconds(durationMinutes: number, startedAt: number) {
  const expiresAt = startedAt + durationMinutes * 60 * 1000;
  return Math.max(Math.floor((expiresAt - Date.now()) / 1000), 0);
}

export default function TakeExamScreen() {
  const params = useLocalSearchParams<{ examId: string }>();
  const examId = typeof params.examId === "string" ? params.examId : "";
  const { getExamById, submitExam } = useAppData();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswerDraft>>({});
  const [submitError, setSubmitError] = useState("");
  const [leaveCount, setLeaveCount] = useState(0);
  const [captureCount, setCaptureCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const warnedOnLeaveRef = useRef(false);
  const warnedOnCaptureRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const answersRef = useRef<Record<string, StudentAnswerDraft>>({});
  const startedAtRef = useRef<number | null>(null);
  const submitExamRef = useRef<(source: "manual" | "auto") => Promise<void>>(async () => {});
  const exam = getExamById(examId);
  const answeredCount = useMemo(
    () =>
      exam?.questions.filter((question) => Boolean(answers[question.id]?.selectedChoiceId)).length ??
      0,
    [answers, exam?.questions],
  );
  const palette = useMemo(() => exam?.questions.map((question) => question.order) ?? [], [exam]);

  useKeepAwake();
  usePreventScreenCapture();
  useScreenshotListener(() => {
    setCaptureCount((current) => current + 1);

    if (!warnedOnCaptureRef.current) {
      warnedOnCaptureRef.current = true;
      Alert.alert(
        "Screenshot илэрлээ",
        "Шалгалтын үеэр screenshot тохиолдлыг бүртгэж байна. Screen recording protection идэвхтэй хэвээр.",
      );
    }
  });

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    startedAtRef.current = startedAt;
  }, [startedAt]);

  useEffect(() => {
    if (!exam) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsRestoring(true);
      autoSubmittedRef.current = false;

      const draft = await getExamDraft(exam.id);
      const restoredStartedAt =
        draft?.startedAt && draft.startedAt > 0 ? draft.startedAt : Date.now();

      if (!cancelled) {
        setAnswers(draft?.answers ?? {});
        setStartedAt(restoredStartedAt);
        setSecondsLeft(getRemainingSeconds(exam.duration, restoredStartedAt));
        setIsRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exam]);

  useEffect(() => {
    if (!exam || !startedAt || isRestoring) {
      return;
    }

    const syncTimer = () => {
      setSecondsLeft(getRemainingSeconds(exam.duration, startedAt));
    };

    syncTimer();
    const timer = setInterval(syncTimer, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [exam, isRestoring, startedAt]);

  useEffect(() => {
    if (!exam || !startedAt || isRestoring) {
      return;
    }

    const timeout = setTimeout(() => {
      void saveExamDraft(exam.id, {
        startedAt,
        answers,
      });
    }, 250);

    return () => {
      clearTimeout(timeout);
    };
  }, [answers, exam, isRestoring, startedAt]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        setLeaveCount((current) => current + 1);

        if (!warnedOnLeaveRef.current) {
          warnedOnLeaveRef.current = true;
          Alert.alert(
            "Шалгалтын хамгаалалт",
            "Та app-оос гарсан ч хугацаа үргэлжилнэ. Буцаж орвол draft автоматаар сэргээнэ.",
          );
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  submitExamRef.current = async (source: "manual" | "auto") => {
    if (!exam || !startedAtRef.current) {
      return;
    }

    setSubmitError("");
    setSubmitLoading(true);

    try {
      await submitExam({
        examId: exam.id,
        startedAt: startedAtRef.current,
        answers: exam.questions.map((question) => ({
          questionId: question.id,
          selectedChoiceId: answersRef.current[question.id]?.selectedChoiceId ?? null,
          answerText: null,
        })),
      });

      await clearExamDraft(exam.id);
      router.replace("/(student)/(tabs)/results");
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error
          ? caughtError.message
          : source === "auto"
            ? "Хугацаа дууссан ч шалгалтыг автоматаар илгээж чадсангүй."
            : "Шалгалт илгээхэд алдаа гарлаа.",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    if (!exam || !startedAt || isRestoring || secondsLeft > 0 || autoSubmittedRef.current) {
      return;
    }

    autoSubmittedRef.current = true;
    void submitExamRef.current("auto");
  }, [exam, isRestoring, secondsLeft, startedAt]);

  const handleSelectChoice = (questionId: string, optionId: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: {
        ...previous[questionId],
        selectedChoiceId: optionId,
      },
    }));
  };

  if (isRestoring) {
    return <FullScreenLoader label="Шалгалтын session-ийг бэлдэж байна..." />;
  }

  if (!exam) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.content}>
          <StatusCard tone="error" message="Шалгалтын мэдээлэл олдсонгүй." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <Stack.Screen
        options={{
          gestureEnabled: false,
        }}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Secure Exam Mode</Text>
          <Text style={styles.headerTitle}>Шалгалт явагдаж байна</Text>
        </View>
        <View style={[styles.timerChip, secondsLeft < 300 ? styles.timerChipDanger : null]}>
          <Ionicons
            name="time-outline"
            size={16}
            color={secondsLeft < 300 ? colors.dangerText : colors.textSecondary}
          />
          <Text style={[styles.timerText, secondsLeft < 300 ? styles.timerTextDanger : null]}>
            {formatCountdown(secondsLeft)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{exam.title}</Text>
        <Text style={styles.subtitle}>
          {answeredCount}/{exam.questions.length} асуулт бөглөгдсөн
        </Text>

        <StatusCard
          tone="info"
          message="Screen recording protection, screenshot alert, keep-awake, app switch warning идэвхтэй."
        />
        {leaveCount > 0 ? (
          <StatusCard
            tone="warning"
            message={`Та шалгалтын үеэр app-оос ${leaveCount} удаа гарсан байна. Хугацаа үргэлжилж байгаа.`}
          />
        ) : null}
        {captureCount > 0 ? (
          <StatusCard tone="warning" message={`Шалгалтын үеэр ${captureCount} screenshot илэрлээ.`} />
        ) : null}
        {submitError ? <StatusCard tone="error" message={submitError} /> : null}

        <View style={styles.progressCard}>
          <View>
            <Text style={styles.progressValue}>{answeredCount}</Text>
            <Text style={styles.progressLabel}>Бөглөсөн</Text>
          </View>
          <View>
            <Text style={styles.progressValue}>{exam.questions.length - answeredCount}</Text>
            <Text style={styles.progressLabel}>Үлдсэн</Text>
          </View>
          <View>
            <Text style={styles.progressValue}>{captureCount}</Text>
            <Text style={styles.progressLabel}>Screenshot</Text>
          </View>
        </View>

        <View style={styles.paletteCard}>
          <Text style={styles.paletteTitle}>Асуултын палитр</Text>
          <View style={styles.paletteGrid}>
            {palette.map((order) => {
              const question = exam.questions.find((item) => item.order === order);
              const isAnswered = question ? Boolean(answers[question.id]?.selectedChoiceId) : false;

              return (
                <View
                  key={order}
                  style={[styles.paletteItem, isAnswered ? styles.paletteItemDone : null]}
                >
                  <Text
                    style={[
                      styles.paletteItemText,
                      isAnswered ? styles.paletteItemTextDone : null,
                    ]}
                  >
                    {order}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.questions}>
          {exam.questions.map((question) => (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionTitle}>
                  {question.order}. {question.question}
                </Text>
                <Text style={styles.questionPoints}>1 оноо</Text>
              </View>

              <View style={styles.choiceList}>
                {question.choices.map((choice) => {
                  const selected = answers[question.id]?.selectedChoiceId === choice.id;

                  return (
                    <Pressable
                      key={choice.id}
                      style={[styles.choiceButton, selected ? styles.choiceButtonSelected : null]}
                      onPress={() => handleSelectChoice(question.id, choice.id)}
                    >
                      <View style={[styles.radio, selected ? styles.radioSelected : null]}>
                        {selected ? <View style={styles.radioInner} /> : null}
                      </View>
                      <Text style={styles.choiceText}>
                        {choice.label}. {choice.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        <PrimaryButton
          label={submitLoading ? "Илгээж байна..." : "Шалгалт илгээх"}
          onPress={() => void submitExamRef.current("manual")}
          disabled={submitLoading}
          loading={submitLoading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerEyebrow: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.primary,
  },
  headerTitle: {
    marginTop: 6,
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  timerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerChipDanger: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBackground,
  },
  timerText: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  timerTextDanger: {
    color: colors.dangerText,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
  },
  title: {
    fontFamily: fonts.display.semibold,
    fontSize: 27,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  progressCard: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 16,
    ...shadows.card,
  },
  progressValue: {
    textAlign: "center",
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  progressLabel: {
    marginTop: 6,
    textAlign: "center",
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  paletteCard: {
    marginBottom: 16,
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
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceTint,
  },
  paletteItemDone: {
    borderColor: colors.primarySoft,
    backgroundColor: colors.primary,
  },
  paletteItemText: {
    fontFamily: fonts.sans.semibold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  paletteItemTextDone: {
    color: "#FFFFFF",
  },
  questions: {
    gap: 16,
  },
  questionCard: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 18,
    ...shadows.card,
  },
  questionHeader: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  questionTitle: {
    flex: 1,
    fontFamily: fonts.sans.semibold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  questionPoints: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textSoft,
  },
  choiceList: {
    marginTop: 16,
    gap: 10,
  },
  choiceButton: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  choiceButtonSelected: {
    borderColor: colors.primarySoft,
    backgroundColor: "#F6F2FF",
  },
  radio: {
    marginTop: 2,
    height: 20,
    width: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  choiceText: {
    flex: 1,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
});
