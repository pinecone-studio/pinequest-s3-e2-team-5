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
  subjectOrder,
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
  subjectOrder?: string[];
  onPress: () => void;
}) {
  const presentation = getStudentExamPresentation(subject, subjectOrder);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: presentation.background,
          borderColor: presentation.borderColor,
        },
        pressed ? styles.pressed : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: presentation.iconBackground },
          ]}
        >
          <MaterialCommunityIcons
            name={presentation.iconName}
            size={22}
            color={colors.textPrimary}
          />
        </View>

        <View style={styles.titleBlock}>
          <Text
            style={styles.titleText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            <Text style={styles.subject}>{presentation.subjectLabel}</Text>
            <Text style={styles.topic}> /{title}/</Text>
          </Text>
        </View>

        <Text style={styles.grade}>{grade}</Text>

        <View style={styles.metaRow}>
          <View style={[styles.metaChip, styles.metaChipDuration]}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={colors.textPrimary}
            />
            <Text style={styles.metaChipText}>{duration} мин</Text>
          </View>

          <View style={[styles.metaChip, styles.metaChipQuestions]}>
            <MaterialCommunityIcons
              name="pencil-outline"
              size={16}
              color={colors.textPrimary}
            />
            <Text style={styles.metaChipText}>{questionCount} дасгал</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.footer}>
          {footerLabel} -{" "}
          <Text style={styles.footerAccent}>/{startTime || "--"}/</Text>
        </Text>
        <Text style={styles.date}>{scheduledDate || "Товлоогүй"}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "center",
    width: 350,
    height: 263,
    justifyContent: "space-between",
    borderRadius: 34,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 20,
    ...shadows.card,
  },
  pressed: {
    opacity: 0.95,
  },
  cardTop: {
    alignItems: "flex-start",
  },
  cardBottom: {
    alignItems: "flex-start",
  },
  iconWrap: {
    height: 43,
    width: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  titleBlock: {
    marginTop: 18,
    width: "100%",
  },
  titleText: {
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  subject: {
    fontFamily: fonts.display.semibold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  topic: {
    fontFamily: fonts.sans.regular,
    fontSize: 18,
    color: colors.textMuted,
  },
  grade: {
    marginTop: 14,
    fontFamily: fonts.sans.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  metaRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  metaChipDuration: {
    width: 85,
    height: 28,
  },
  metaChipQuestions: {
    width: 101,
    height: 28,
  },
  metaChipText: {
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  footer: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  footerAccent: {
    fontFamily: fonts.sans.semibold,
    color: colors.textPrimary,
  },
  date: {
    marginTop: 6,
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
});
