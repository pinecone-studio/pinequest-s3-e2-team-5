import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";

export function FullScreenLoader({ label }: { label: string }) {
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    gap: 14,
  },
  label: {
    fontFamily: fonts.sans.medium,
    fontSize: 15,
    color: colors.textMuted,
  },
});
