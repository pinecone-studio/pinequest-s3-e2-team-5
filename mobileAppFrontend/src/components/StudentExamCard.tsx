import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getStudentExamPresentation } from "@/lib/student-exam";
import { colors, fonts, shadows } from "@/lib/theme";

export function StudentExamCard({
  subject,
  title,
  grade,
  duration,
  questionCount,
  scheduledDate,
  startTime,
  footerLabel = "Эхлэх",
  onPress,
}: {
  subject: string;
  title: string;
  grade: string;
  duration: number;
  questionCount: number;
  scheduledDate?: string | null;
  startTime?: string | null;
  footerLabel?: string;
  onPress: () => void;
}) {
  const presentation = getStudentExamPresentation(subject);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: presentation.background },
        pressed ? styles.pressed : null,
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: presentation.iconBackground }]}>
        <MaterialCommunityIcons
          name={presentation.iconName}
          size={24}
          color={colors.textPrimary}
        />
      </View>

      <Text style={styles.title}>
        <Text style={styles.subject}>{presentation.subjectLabel}</Text>{" "}
        <Text style={styles.topic}>/{title}/</Text>
      </Text>
      <Text style={styles.grade}>{grade}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{duration} мин</Text>
        </View>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{questionCount} даалгавар</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>{footerLabel}</Text>
        <Text style={styles.footerValue}>{startTime || "--:--"}</Text>
      </View>
      <Text style={styles.date}>{scheduledDate || "Товлоогүй"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    ...shadows.card,
  },
  pressed: {
    opacity: 0.95,
  },
  iconWrap: {
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  title: {
    marginTop: 14,
    fontSize: 21,
    lineHeight: 28,
  },
  subject: {
    fontFamily: fonts.display.semibold,
    color: colors.textPrimary,
  },
  topic: {
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
  },
  grade: {
    marginTop: 4,
    fontFamily: fonts.sans.medium,
    fontSize: 15,
    color: colors.textSecondary,
  },
  metaRow: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E7E1F3",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  metaChipText: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  footer: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLabel: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  footerValue: {
    fontFamily: fonts.sans.semibold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  date: {
    marginTop: 6,
    fontFamily: fonts.sans.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
});
