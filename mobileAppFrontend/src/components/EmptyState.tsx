import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";

export function EmptyState({
  title,
  description,
  illustration,
}: {
  title: string;
  description?: string;
  illustration?: ReactNode;
}) {
  return (
    <View style={styles.card}>
      {illustration ? <View style={styles.illustration}>{illustration}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    borderRadius: 28,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
  },
  illustration: {
    marginBottom: 18,
  },
  title: {
    fontFamily: fonts.display.semibold,
    fontSize: 20,
    color: "#BAB8D4",
    textAlign: "center",
  },
  description: {
    marginTop: 8,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 22,
    color: "#BAB8D4",
    textAlign: "center",
  },
});
