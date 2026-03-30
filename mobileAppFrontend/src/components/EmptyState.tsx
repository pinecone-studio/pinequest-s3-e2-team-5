import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, shadows } from "@/lib/theme";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 24,
    ...shadows.card,
  },
  title: {
    fontFamily: fonts.display.semibold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  description: {
    marginTop: 8,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
});
