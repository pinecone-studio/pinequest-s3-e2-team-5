import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";
import { colors, fonts } from "@/lib/theme";

export function TextField({
  label,
  ...props
}: TextInputProps & {
  label: string;
}) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.textSoft}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    fontFamily: fonts.sans.semibold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  input: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
