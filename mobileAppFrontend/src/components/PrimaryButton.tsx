import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts, shadows } from "@/lib/theme";

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" ? styles.secondaryButton : null,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? colors.primary : "#FFFFFF"} />
      ) : (
        <Text style={[styles.label, variant === "secondary" ? styles.secondaryLabel : null]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 20,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primary,
    ...shadows.button,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowOpacity: 0.05,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  secondaryLabel: {
    color: colors.primary,
  },
});
