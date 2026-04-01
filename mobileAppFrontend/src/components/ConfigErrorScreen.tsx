import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, shadows } from "@/lib/theme";

export function ConfigErrorScreen({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {action ? <View style={styles.action}>{action}</View> : null}
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
  action: {
    marginTop: 18,
  },
});
