import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { useAppData } from "@/data/app-data";
import { formatScheduledDate, formatScheduledTime, getStudentExamPresentation } from "@/lib/student-exam";
import { colors, fonts } from "@/lib/theme";

type NotificationItem = {
  id: string;
  dateKey: string;
  dateLabel: string;
  timeLabel: string;
  message: string;
  iconName: "clock-outline" | "check-circle-outline";
};

export default function NotificationsScreen() {
  const { availableExams, scheduledExams, submissions } = useAppData();

  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const todayKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const examNotifications: NotificationItem[] = [...availableExams, ...scheduledExams]
      .filter((exam) => exam.isLocked || (exam.startsAtMs ?? 0) > Date.now())
      .map((exam) => {
        const presentation = getStudentExamPresentation(exam.subject);
        const startsAt = exam.startsAtMs ?? Date.parse(`${exam.scheduledDate}T${exam.startTime || "00:00"}:00`);
        const diffMinutes = Math.max(1, Math.round((startsAt - Date.now()) / 60_000));
        const prefix =
          diffMinutes <= 60
            ? `${diffMinutes} минутын дараа`
            : `${formatScheduledTime(exam.startTime)}-д`;

        return {
          id: `exam-${exam.id}`,
          dateKey: exam.scheduledDate,
          dateLabel: exam.scheduledDate === todayKey ? "Өнөөдөр" : formatScheduledDate(exam.scheduledDate),
          timeLabel: formatScheduledTime(exam.startTime),
          message: `${prefix} ${presentation.subjectLabel.toLowerCase()} /${exam.title}/ шалгалт эхэлнэ.`,
          iconName: "clock-outline",
        };
      });

    const resultNotifications: NotificationItem[] = submissions.map((submission) => {
      const submittedDate = new Date(submission.submittedAt);
      const dateKey = [
        submittedDate.getFullYear(),
        String(submittedDate.getMonth() + 1).padStart(2, "0"),
        String(submittedDate.getDate()).padStart(2, "0"),
      ].join("-");

      return {
        id: `submission-${submission.id}`,
        dateKey,
        dateLabel: dateKey === todayKey ? "Өнөөдөр" : formatScheduledDate(dateKey),
        timeLabel: `${String(submittedDate.getHours()).padStart(2, "0")}:${String(submittedDate.getMinutes()).padStart(2, "0")}`,
        message: `${submission.title} шалгалтын дүн гарлаа.`,
        iconName: "check-circle-outline",
      };
    });

    const sorted = [...examNotifications, ...resultNotifications].sort((left, right) => {
      const leftValue = `${left.dateKey} ${left.timeLabel}`;
      const rightValue = `${right.dateKey} ${right.timeLabel}`;
      return rightValue.localeCompare(leftValue);
    });

    return sorted.reduce<Array<{ title: string; items: NotificationItem[] }>>((groups, item) => {
      const currentGroup = groups.at(-1);

      if (!currentGroup || currentGroup.title !== item.dateLabel) {
        groups.push({
          title: item.dateLabel,
          items: [item],
        });
        return groups;
      }

      currentGroup.items.push(item);
      return groups;
    }, []);
  }, [availableExams, scheduledExams, submissions]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          style={styles.backButton}
          onPress={() => {
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Мэдэгдэл</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {groupedNotifications.length === 0 ? (
          <EmptyState title="Мэдэгдэл алга" description="Шинэ шалгалт эсвэл үр дүн гармагц энд харагдана." />
        ) : (
          groupedNotifications.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.groupItems}>
                {group.items.map((item) => (
                  <View key={item.id} style={styles.notificationRow}>
                    <View style={styles.iconWrap}>
                      <MaterialCommunityIcons
                        name={item.iconName}
                        size={item.iconName === "check-circle-outline" ? 36 : 28}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.notificationTextWrap}>
                      <Text style={styles.notificationMessage}>{item.message}</Text>
                      <Text style={styles.notificationTime}>{item.timeLabel}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
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
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 18,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: fonts.display.semibold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 120,
  },
  group: {
    marginBottom: 26,
  },
  groupTitle: {
    marginBottom: 12,
    fontFamily: fonts.sans.medium,
    fontSize: 16,
    color: colors.textMuted,
  },
  groupItems: {
    gap: 18,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  iconWrap: {
    marginTop: 2,
    height: 58,
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: colors.primarySoft,
  },
  notificationTextWrap: {
    flex: 1,
    paddingTop: 4,
  },
  notificationMessage: {
    fontFamily: fonts.sans.semibold,
    fontSize: 16,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  notificationTime: {
    marginTop: 8,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
});
