import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";

export function StatusCard({
  message,
  tone,
}: {
  message: string;
  tone: "info" | "success" | "warning" | "error";
}) {
  const palette =
    tone === "success"
      ? styles.success
      : tone === "warning"
        ? styles.warning
        : tone === "error"
          ? styles.error
          : styles.info;

  return (
    <View style={[styles.card, palette]}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  message: {
    fontFamily: fonts.sans.medium,
    fontSize: 13,
    lineHeight: 20,
  },
  info: {
    borderColor: "#DCD5FA",
    backgroundColor: "#F6F1FF",
  },
  success: {
    borderColor: "#C7E9D6",
    backgroundColor: "#F0FAF4",
  },
  warning: {
    borderColor: "#F3D7A3",
    backgroundColor: "#FFF7E7",
  },
  error: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBackground,
  },
});
