import { BlurView } from "expo-blur";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";

export function SecurityOverlay({
  message,
  blurred,
  blockInteraction,
}: {
  message: string;
  blurred?: boolean;
  blockInteraction?: boolean;
}) {
  return (
    <View pointerEvents={blockInteraction ? "auto" : "none"} style={styles.container}>
      {blurred ? <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} /> : null}
      <View style={styles.card}>
        <Text style={styles.label}>Хамгаалалттай шалгалт</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 20,
  },
  card: {
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  label: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    color: colors.primary,
  },
  message: {
    marginTop: 8,
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
  },
});
