import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StatusCard } from "@/components/StatusCard";
import { useAppData } from "@/data/app-data";
import {
  cancelExamReminder,
  formatReminderDate,
  getExamReminder,
  getExamReminderDate,
  scheduleExamReminder,
} from "@/lib/notifications";
import { colors, fonts, shadows } from "@/lib/theme";
import {
  formatScheduledDate,
  formatScheduledTime,
  getExamEndTime,
  getStudentExamHeader,
} from "@/lib/student-exam";

export default function ExamDetailScreen() {
  const params = useLocalSearchParams<{ examId: string }>();
  const examId = typeof params.examId === "string" ? params.examId : "";
  const { getExamById } = useAppData();
  const [reminderMessage, setReminderMessage] = useState("");
  const [hasReminder, setHasReminder] = useState(false);
  const [isReminderLoading, setIsReminderLoading] = useState(false);
  const exam = getExamById(examId);
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

  if (!exam) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.content}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
            <Text style={styles.backText}>Буцах</Text>
          </Pressable>
          <StatusCard tone="error" message="Шалгалтын мэдээлэл олдсонгүй." />
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

        {reminderMessage ? (
          <StatusCard
            tone={hasReminder ? "success" : reminderDate ? "info" : "warning"}
            message={reminderMessage}
          />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.subjectLabel}>{getStudentExamHeader(exam.subject, exam.title)}</Text>
          <Text style={styles.description}>{exam.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaChipText}>{exam.duration} мин</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaChipText}>{exam.questions.length} даалгавар</Text>
            </View>
          </View>

          <View style={styles.scheduleBox}>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>Өдөр</Text>
              <Text style={styles.scheduleValue}>{formatScheduledDate(exam.scheduledDate)}</Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>Эхлэх</Text>
              <Text style={styles.scheduleValue}>{formatScheduledTime(exam.startTime)}</Text>
            </View>
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleLabel}>Дуусах</Text>
              <Text style={styles.scheduleValue}>
                {getExamEndTime(exam.startTime, exam.duration)}
              </Text>
            </View>
          </View>

          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              Шалгалтын үеэр дэлгэц бичлэгийн хамгаалалт, дэлгэцийн зураг авах сэрэмжлүүлэг,
              аппаас гарах анхааруулга зэрэг хамгаалалт ажиллана.
            </Text>
          </View>

          <PrimaryButton
            label={
              isReminderLoading
                ? "Тохируулж байна..."
                : hasReminder
                  ? "Сануулга цуцлах"
                  : "15 минутын өмнө сануулах"
            }
            onPress={() => void handleReminderPress()}
            disabled={isReminderLoading || !reminderDate || reminderDate.getTime() <= Date.now()}
            loading={isReminderLoading}
            variant="secondary"
          />
          <PrimaryButton
            label="Эхлэх"
            onPress={() => router.push(`/(student)/exam/${exam.id}/take`)}
            disabled={exam.questions.length === 0}
          />
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
    paddingBottom: 40,
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
  card: {
    borderRadius: 30,
    backgroundColor: colors.surface,
    padding: 22,
    ...shadows.card,
  },
  subjectLabel: {
    fontFamily: fonts.display.semibold,
    fontSize: 25,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  description: {
    marginTop: 12,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 24,
    color: colors.textMuted,
  },
  metaRow: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  metaChipText: {
    fontFamily: fonts.sans.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  scheduleBox: {
    marginTop: 20,
    gap: 12,
  },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scheduleLabel: {
    fontFamily: fonts.sans.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  scheduleValue: {
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    color: colors.textSecondary,
  },
  noticeBox: {
    marginTop: 22,
    borderRadius: 18,
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  noticeText: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 21,
    color: colors.textSecondary,
  },
});
