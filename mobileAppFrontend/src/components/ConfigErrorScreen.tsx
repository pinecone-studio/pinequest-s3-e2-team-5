import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors, fonts, shadows } from "@/lib/theme";

export function ConfigErrorScreen({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.pageBackground,
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 24,
    ...shadows.card,
  },
  title: {
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  message: {
    marginTop: 10,
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
  },
});
