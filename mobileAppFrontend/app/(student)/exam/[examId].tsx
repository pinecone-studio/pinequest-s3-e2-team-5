import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandHeader } from "@/components/BrandHeader";
import { StatusCard } from "@/components/StatusCard";
import { useAppData } from "@/data/app-data";
import {
  cancelExamReminder,
  formatReminderDate,
  getExamReminder,
  getExamReminderDate,
  scheduleExamReminder,
} from "@/lib/notifications";
import {
  buildStudentExamSubjectOrder,
  formatScheduledTime,
  getExamEndTime,
  getStudentExamPresentation,
} from "@/lib/student-exam";
import { colors, fonts, shadows } from "@/lib/theme";

export default function ExamDetailScreen() {
  const params = useLocalSearchParams<{ examId: string }>();
  const examId = typeof params.examId === "string" ? params.examId : "";
  const { availableExams, ensureExamLoaded, getExamById } = useAppData();
  const [reminderMessage, setReminderMessage] = useState("");
  const [hasReminder, setHasReminder] = useState(false);
  const [isReminderLoading, setIsReminderLoading] = useState(false);
  const [isExamLoading, setIsExamLoading] = useState(false);
  const [examLoadError, setExamLoadError] = useState("");

  const exam = getExamById(examId);
  const subjectOrder = useMemo(
    () => buildStudentExamSubjectOrder(exam ? [...availableExams, exam] : availableExams),
    [availableExams, exam],
  );
  const presentation = useMemo(
    () => (exam ? getStudentExamPresentation(exam.subject, subjectOrder) : null),
    [exam, subjectOrder],
  );
  const reminderDate = useMemo(
    () => getExamReminderDate(exam?.scheduledDate, exam?.startTime),
    [exam?.scheduledDate, exam?.startTime],
  );

  useEffect(() => {
    if (!exam) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const reminder = await getExamReminder(exam.id);

      if (!cancelled) {
        setHasReminder(Boolean(reminder));
        setReminderMessage(
          reminder ? `${formatReminderDate(reminder.reminderDate)}-д сануулга тавигдсан.` : "",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exam]);

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
            caughtError instanceof Error
              ? caughtError.message
              : "Шалгалтын дэлгэрэнгүйг ачаалж чадсангүй.",
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

  const handleReminderPress = async () => {
    if (!exam) {
      return;
    }

    setIsReminderLoading(true);

    try {
      if (hasReminder) {
        await cancelExamReminder(exam.id);
        setHasReminder(false);
        setReminderMessage("Сануулга цуцлагдлаа.");
      } else {
        const scheduled = await scheduleExamReminder({
          examId: exam.id,
          title: exam.title,
          subject: exam.subject,
          scheduledDate: exam.scheduledDate,
          startTime: exam.startTime,
        });

        setHasReminder(true);
        setReminderMessage(`${formatReminderDate(scheduled.reminderDate)}-д сануулга тавигдлаа.`);
      }
    } catch (caughtError) {
      setReminderMessage(
        caughtError instanceof Error ? caughtError.message : "Сануулга тохируулахад алдаа гарлаа.",
      );
    } finally {
      setIsReminderLoading(false);
    }
  };

  const handleStartPress = async () => {
    if (!exam) {
      return;
    }

    if (exam.questionCount > 0 && exam.questions.length === 0) {
      setIsExamLoading(true);
      setExamLoadError("");

      try {
        const loadedExam = await ensureExamLoaded(exam.id);

        if (!loadedExam || loadedExam.questionCount === 0) {
          setExamLoadError("Шалгалтын асуултыг ачаалж чадсангүй.");
          return;
        }
      } catch (caughtError) {
        setExamLoadError(
          caughtError instanceof Error ? caughtError.message : "Шалгалтын асуултыг ачаалж чадсангүй.",
        );
        return;
      } finally {
        setIsExamLoading(false);
      }
    }

    router.push(`/(student)/exam/${exam.id}/take`);
  };

  if (!exam) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
        <View style={styles.content}>
          <StatusCard tone="error" message="Шалгалтын мэдээлэл олдсонгүй." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <BrandHeader />

      <ScrollView contentContainerStyle={styles.content}>
        {reminderMessage ? (
          <StatusCard
            tone={hasReminder ? "success" : reminderDate ? "info" : "warning"}
            message={reminderMessage}
          />
        ) : null}

        {examLoadError ? <StatusCard tone="error" message={examLoadError} /> : null}

        <View
          style={[
            styles.card,
            {
              backgroundColor: presentation?.background ?? "#F4F1FF",
              borderColor: presentation?.borderColor ?? "#CFC6FF",
            },
          ]}
        >
          <Text style={styles.titleText} numberOfLines={1} ellipsizeMode="tail">
            <Text style={styles.subjectText}>{presentation?.subjectLabel}</Text>
            <Text style={styles.topicText}> /{exam.title}/</Text>
          </Text>

          <View style={styles.metaRow}>
            <View style={[styles.metaChip, styles.metaChipDuration]}>
              <Ionicons name="time-outline" size={17} color={colors.textPrimary} />
              <Text style={styles.metaChipText}>{exam.duration} мин</Text>
            </View>

            <View style={[styles.metaChip, styles.metaChipQuestions]}>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={17}
                color={colors.textPrimary}
              />
              <Text style={styles.metaChipText}>{exam.questionCount} дасгал</Text>
            </View>
          </View>

          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <View
                style={[
                  styles.scheduleAccent,
                  { backgroundColor: presentation?.accentColor ?? "#C7BEFF" },
                ]}
              />
              <View>
                <Text style={styles.scheduleLabel}>ЭХЛЭХ ЦАГ</Text>
                <Text style={styles.scheduleValue}>{formatScheduledTime(exam.startTime)}</Text>
              </View>
            </View>

            <View style={styles.scheduleItem}>
              <View
                style={[
                  styles.scheduleAccent,
                  { backgroundColor: presentation?.accentColor ?? "#C7BEFF" },
                ]}
              />
              <View>
                <Text style={styles.scheduleLabel}>ДУУСАХ ЦАГ</Text>
                <Text style={styles.scheduleValue}>
                  {getExamEndTime(exam.startTime, exam.duration)}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.noticeBox,
              {
                backgroundColor: presentation?.noticeBackground ?? "#F3F0FF",
                borderColor: presentation?.noticeBorder ?? "#D8D1FA",
              },
            ]}
          >
            <Ionicons name="information-circle-outline" size={22} color={colors.textPrimary} />
            <Text style={styles.noticeText}>
              Шалгалтын үед хяналт болон хамгаалалтын функцууд идэвхтэй ажиллана.
            </Text>
          </View>

          {reminderDate ? (
            <Pressable
              style={styles.reminderLink}
              onPress={() => void handleReminderPress()}
              disabled={isReminderLoading || reminderDate.getTime() <= Date.now()}
            >
              <Text style={styles.reminderLinkText}>
                {isReminderLoading
                  ? "Тохируулж байна..."
                  : hasReminder
                    ? "Сануулга цуцлах"
                    : "15 минутын өмнө сануулах"}
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable style={styles.backAction} onPress={() => router.back()}>
              <Text style={styles.backActionText}>Буцах</Text>
            </Pressable>

            <View
              style={[
                styles.startActionShell,
                {
                  shadowColor: presentation?.actionButtonBackground ?? "#9E81F0",
                },
                isExamLoading || exam.questionCount === 0 ? styles.startActionDisabled : null,
              ]}
            >
              <Pressable
                style={[
                  styles.startAction,
                  {
                    backgroundColor: presentation?.actionButtonBackground ?? "#9E81F0",
                  },
                ]}
                onPress={() => void handleStartPress()}
                disabled={isExamLoading || exam.questionCount === 0}
              >
                <View
                  pointerEvents="none"
                  style={[
                    styles.startActionInset,
                    {
                      backgroundColor: presentation?.actionButtonInset ?? "rgba(103, 79, 184, 0.38)",
                    },
                  ]}
                />
                {isExamLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.startActionText}>Эхлэх</Text>
                )}
              </Pressable>
            </View>
          </View>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 120,
    paddingBottom: 48,
  },
  card: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 350,
    minHeight: 407,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#CEC8FF",
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    ...shadows.card,
  },
  titleText: {
    fontFamily: fonts.display.semibold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  subjectText: {
    fontFamily: fonts.display.medium,
    fontSize: 20,
    color: colors.textPrimary,
  },
  topicText: {
    fontFamily: fonts.sans.regular,
    fontSize: 18,
    color: colors.textMuted,
  },
  metaRow: {
    marginTop: 24,
    flexDirection: "row",
    gap: 12,
  },
  metaChip: {
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  metaChipDuration: {
    width: 85,
  },
  metaChipQuestions: {
    width: 101,
  },
  metaChipText: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  scheduleRow: {
    marginTop: 34,
    flexDirection: "row",
    gap: 18,
  },
  scheduleItem: {
    flex: 1,
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scheduleAccent: {
    width: 3,
    height: 45,
    borderRadius: 999,
    backgroundColor: "#D4CEFE",
  },
  scheduleLabel: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    color: "#9D9AA7",
  },
  scheduleValue: {
    marginTop: 2,
    fontFamily: fonts.sans.semibold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  noticeBox: {
    marginTop: 26,
    width: "100%",
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D6D1F7",
    backgroundColor: "#F4F1FF",
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.sans.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  reminderLink: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  reminderLinkText: {
    fontFamily: fonts.sans.medium,
    fontSize: 13,
    color: colors.primaryDark,
  },
  actionRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backAction: {
    width: 112,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backActionText: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  startActionShell: {
    width: 142,
    height: 44,
    borderRadius: 18,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },
  startAction: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    overflow: "hidden",
  },
  startActionInset: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 5,
    backgroundColor: "rgba(103, 79, 184, 0.38)",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  startActionDisabled: {
    opacity: 0.6,
  },
  startActionText: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    color: "#FFFFFF",
  },
});
