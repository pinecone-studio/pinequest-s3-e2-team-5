import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppData } from "@/data/app-data";
import { MathText } from "@/components/MathText";
import { SecurityOverlay } from "@/components/SecurityOverlay";
import { SecureText } from "@/components/SecureText";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { StatusCard } from "@/components/StatusCard";
import { clearExamDraft, getExamDraft, saveExamDraft } from "@/lib/exam-draft";
import { colors, fonts, shadows } from "@/lib/theme";
import type { StudentAnswerDraft } from "@/lib/student-types";
import {
  buildStudentExamSubjectOrder,
  formatCountdown,
  getStudentExamPresentation,
} from "@/lib/student-exam";
import { shuffleQuestionsForUser } from "@/security/question-order";
import { useExamIntegrity } from "@/security/useExamIntegrity";

function getRemainingSeconds(durationMinutes: number, startedAt: number) {
  const expiresAt = startedAt + durationMinutes * 60 * 1000;
  return Math.max(Math.floor((expiresAt - Date.now()) / 1000), 0);
}

export default function TakeExamScreen() {
  const params = useLocalSearchParams<{ examId: string }>();
  const examId = typeof params.examId === "string" ? params.examId : "";
  const { availableExams, ensureExamLoaded, getExamById, submitExam, student } = useAppData();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswerDraft>>({});
  const [submitError, setSubmitError] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isExamLoading, setIsExamLoading] = useState(false);
  const [examLoadError, setExamLoadError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const autoSubmittedRef = useRef(false);
  const answersRef = useRef<Record<string, StudentAnswerDraft>>({});
  const startedAtRef = useRef<number | null>(null);
  const submitExamRef = useRef<
    (source: "manual" | "auto" | "background" | "session_replaced") => Promise<void>
  >(async () => {});
  const exam = getExamById(examId);
  const subjectOrder = useMemo(
    () => buildStudentExamSubjectOrder(exam ? [...availableExams, exam] : availableExams),
    [availableExams, exam],
  );
  const presentation = useMemo(
    () => (exam ? getStudentExamPresentation(exam.subject, subjectOrder) : null),
    [exam, subjectOrder],
  );

  const shuffledQuestions = useMemo(
    () => (exam ? shuffleQuestionsForUser(exam.questions, student.email, exam.id) : []),
    [exam, student.email],
  );

  const answeredCount = useMemo(
    () => shuffledQuestions.filter((question) => Boolean(answers[question.id]?.selectedChoiceId)).length,
    [answers, shuffledQuestions],
  );

  const handleAutoSubmit = useCallback(
    async (reason: "timer" | "background" | "session_replaced") => {
      await submitExamRef.current(
        reason === "timer" ? "auto" : reason === "session_replaced" ? "session_replaced" : "background",
      );
    },
    [],
  );

  useKeepAwake();

  const {
    leaveCount,
    warningMessage,
    recordingBlurActive,
    faceStatus,
    nativeMonitoringAvailable,
  } = useExamIntegrity({
    userId: student.id,
    examId,
    onAutoSubmit: handleAutoSubmit,
  });

  const faceMonitor = useMemo(() => {
    if (!nativeMonitoringAvailable) {
      return {
        icon: "camera-off-outline" as const,
        label: "Камерын хяналт байхгүй",
        helper: "Энэ функц зөвхөн iOS development build дээр бүрэн ажиллана.",
        backgroundColor: "#FFF7E7",
        borderColor: "#F3D7A3",
        textColor: "#8A5A00",
      };
    }

    if (faceStatus === "single_face") {
      return {
        icon: "account-check-outline" as const,
        label: "1 хүн илэрсэн",
        helper: "Камерын хяналт хэвийн ажиллаж байна.",
        backgroundColor: "#F0FAF4",
        borderColor: "#C7E9D6",
        textColor: "#2D7D46",
      };
    }

    if (faceStatus === "no_face") {
      return {
        icon: "account-alert-outline" as const,
        label: "Хүн алга",
        helper: "Камерт зөвхөн 1 хүн тод харагдаж байх ёстой.",
        backgroundColor: "#FFF7E7",
        borderColor: "#F3D7A3",
        textColor: "#8A5A00",
      };
    }

    if (faceStatus === "multiple_faces") {
      return {
        icon: "account-multiple-outline" as const,
        label: "2+ хүн илэрсэн",
        helper: "Олон хүн илэрвэл зөрчилд бүртгэгдэнэ.",
        backgroundColor: "#FFF7F7",
        borderColor: colors.dangerBorder,
        textColor: colors.dangerText,
      };
    }

    if (faceStatus === "unsupported") {
      return {
        icon: "camera-off-outline" as const,
        label: "Камерын хяналт идэвхжсэнгүй",
        helper: "Camera permission болон iOS development build-ээ шалгана уу.",
        backgroundColor: "#FFF7F7",
        borderColor: colors.dangerBorder,
        textColor: colors.dangerText,
      };
    }

    return {
      icon: "camera-outline" as const,
      label: "Камер шалгаж байна",
      helper: "Царай илрүүлэлт идэвхжиж байна.",
      backgroundColor: "#F6F1FF",
      borderColor: "#DCD5FA",
      textColor: colors.primaryDark,
    };
  }, [faceStatus, nativeMonitoringAvailable]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    startedAtRef.current = startedAt;
  }, [startedAt]);

  useEffect(() => {
    if (!exam || exam.questions.length > 0 || exam.questionCount === 0) {
      return;
    }

    let cancelled = false;
    setIsExamLoading(true);
    setExamLoadError("");

    void ensureExamLoaded(exam.id)
      .catch((caughtError) => {
        if (!cancelled) {
          setExamLoadError(
            caughtError instanceof Error ? caughtError.message : "Шалгалтын асуултыг ачаалж чадсангүй.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsExamLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ensureExamLoaded, exam]);

  useEffect(() => {
    if (!exam || exam.questions.length === 0 && exam.questionCount > 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsRestoring(true);
      autoSubmittedRef.current = false;

      const draft = await getExamDraft(exam.id);
      const restoredStartedAt = draft?.startedAt && draft.startedAt > 0 ? draft.startedAt : Date.now();

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
  }, [exam, shuffledQuestions.length]);

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

  submitExamRef.current = async (
    source: "manual" | "auto" | "background" | "session_replaced",
  ) => {
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
      router.replace("/(student)/exam/submitted");
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error
          ? caughtError.message
          : source === "session_replaced"
            ? "Өөр төхөөрөмжөөс шалгалтын төлөв солигдсон тул автоматаар илгээхэд алдаа гарлаа."
          : source === "background"
            ? "Та аппаас удаан гарсан тул автоматаар илгээхэд алдаа гарлаа."
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

  const handleSubmitPress = () => {
    const unansweredCount = shuffledQuestions.length - answeredCount;

    if (unansweredCount > 0) {
      Alert.alert(
        "Шалгалт илгээх үү?",
        `${unansweredCount} асуулт хариулаагүй байна. Одоо илгээх бол хоосон үлдсэн асуултууд буруу гэж тооцогдоно.`,
        [
          {
            text: "Болих",
            style: "cancel",
          },
          {
            text: "Илгээх",
            style: "destructive",
            onPress: () => {
              void submitExamRef.current("manual");
            },
          },
        ],
      );
      return;
    }

    void submitExamRef.current("manual");
  };

  if (isExamLoading || isRestoring) {
    return <FullScreenLoader label="Шалгалтын явцыг бэлдэж байна..." />;
  }

  if (examLoadError) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.content}>
          <StatusCard tone="error" message={examLoadError} />
        </View>
      </SafeAreaView>
    );
  }

  if (!exam || shuffledQuestions.length === 0) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.content}>
          <StatusCard tone="error" message="Шалгалтын мэдээлэл олдсонгүй." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <Stack.Screen
        options={{
          gestureEnabled: false,
        }}
      />

      {recordingBlurActive || warningMessage ? (
        <SecurityOverlay
          blockInteraction={recordingBlurActive}
          blurred={recordingBlurActive}
          message={
            recordingBlurActive
              ? "Дэлгэц бичлэг эсвэл дэлгэц толиндуулалт илэрсэн тул нууц агуулгыг халхаллаа."
              : warningMessage
          }
        />
      ) : null}

      <View style={styles.header}>
        <SecureText style={styles.headerTitle}>
          {presentation?.subjectLabel ?? exam.subject}
        </SecureText>
        <View
          style={[
            styles.timerChip,
            {
              backgroundColor: presentation?.noticeBackground ?? "#F3F0FF",
              borderColor: presentation?.noticeBorder ?? "#D8D1FA",
            },
            secondsLeft < 300 ? styles.timerChipDanger : null,
          ]}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={secondsLeft < 300 ? colors.dangerText : colors.textSecondary}
          />
          <SecureText style={[styles.timerText, secondsLeft < 300 ? styles.timerTextDanger : null]}>
            {formatCountdown(secondsLeft)}
          </SecureText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View
          style={[
            styles.faceMonitorCard,
            {
              backgroundColor: faceMonitor.backgroundColor,
              borderColor: faceMonitor.borderColor,
            },
          ]}
        >
          <View style={styles.faceMonitorRow}>
            <MaterialCommunityIcons
              name={faceMonitor.icon}
              size={18}
              color={faceMonitor.textColor}
            />
            <SecureText
              style={[
                styles.faceMonitorLabel,
                { color: faceMonitor.textColor },
              ]}
            >
              {faceMonitor.label}
            </SecureText>
          </View>
          <SecureText style={styles.faceMonitorHelper}>
            {faceMonitor.helper}
          </SecureText>
        </View>

        {leaveCount > 0 ? (
          <StatusCard
            tone="warning"
            message={`Аппаас ${leaveCount} удаа гарсан нь бүртгэгдсэн. 5 секундээс илүү гарвал автоматаар илгээнэ.`}
          />
        ) : null}
        {submitError ? <StatusCard tone="error" message={submitError} /> : null}

        <View style={styles.questionStack}>
          {shuffledQuestions.map((question, index) => (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <SecureText style={styles.questionCounter}>Асуулт {index + 1}</SecureText>
                <SecureText style={styles.questionPoints}>1 оноо</SecureText>
              </View>

              <MathText value={question.question} style={styles.questionTitle} />

              <View style={styles.choiceList}>
                {question.choices.map((choice) => {
                  const selected = answers[question.id]?.selectedChoiceId === choice.id;

                  return (
                    <Pressable
                      key={choice.id}
                      style={[styles.choiceButton, selected ? styles.choiceButtonSelected : null]}
                      onPress={() => handleSelectChoice(question.id, choice.id)}
                    >
                      <MathText value={`${choice.label}. ${choice.text}`} style={styles.choiceText} />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.progressChip}>
            <SecureText style={styles.progressChipText}>
              {answeredCount}/{shuffledQuestions.length} бөглөсөн
            </SecureText>
          </View>

          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: presentation?.actionButtonBackground ?? colors.primary,
              },
              submitLoading ? styles.submitButtonDisabled : null,
            ]}
            onPress={handleSubmitPress}
            disabled={submitLoading}
          >
            <View
              pointerEvents="none"
              style={[
                styles.submitButtonInset,
                {
                  backgroundColor:
                    presentation?.actionButtonInset ?? "rgba(103, 79, 184, 0.38)",
                },
              ]}
            />
            {submitLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <SecureText style={styles.submitButtonText}>Илгээх</SecureText>
            )}
          </Pressable>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  timerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
  },
  timerChipDanger: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBackground,
  },
  timerText: {
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  timerTextDanger: {
    color: colors.dangerText,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 110,
  },
  faceMonitorCard: {
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  faceMonitorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  faceMonitorLabel: {
    fontFamily: fonts.sans.semibold,
    fontSize: 14,
  },
  faceMonitorHelper: {
    marginTop: 6,
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  questionStack: {
    gap: 22,
  },
  questionCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#E9E3F8",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingVertical: 22,
    ...shadows.card,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  questionCounter: {
    fontFamily: fonts.sans.medium,
    fontSize: 16,
    color: colors.textMuted,
  },
  questionPoints: {
    fontFamily: fonts.sans.medium,
    fontSize: 16,
    color: colors.textMuted,
  },
  questionTitle: {
    marginTop: 16,
    fontFamily: fonts.sans.semibold,
    fontSize: 18,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  choiceList: {
    marginTop: 18,
    gap: 14,
  },
  choiceButton: {
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7E1F6",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  choiceButtonSelected: {
    borderColor: "#DCD4FA",
    backgroundColor: "#ECEAFF",
  },
  choiceText: {
    fontFamily: fonts.sans.medium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  footer: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  progressChip: {
    borderRadius: 999,
    backgroundColor: "#F3F0FF",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  progressChipText: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  submitButton: {
    width: 132,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    overflow: "hidden",
  },
  submitButtonInset: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 5,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  submitButtonText: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});
