import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "@/lib/theme";

const learningMsLogo = require("../../assets/learning-ms-logo.png");

export function BrandHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.brandWrap}>
        <View style={styles.brandMarkWrap}>
          <Image source={learningMsLogo} style={styles.brandImage} resizeMode="contain" />
        </View>
        <View>
          <Text style={styles.brandTop}>Learning</Text>
          <Text style={styles.brandBottom}>MS</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        hitSlop={10}
        style={({ pressed }) => [styles.headerAction, pressed ? styles.headerActionPressed : null]}
        onPress={() => {
          router.push("/(student)/notifications");
        }}
      >
        <MaterialCommunityIcons name="bell-outline" size={28} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 24,
    paddingBottom: 18,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  brandMarkWrap: {
    height: 32,
    width: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  brandImage: {
    width: 43,
    height: 32,
  },
  brandTop: {
    fontFamily: fonts.display.medium,
    fontSize: 19,
    color: colors.textPrimary,
  },
  brandBottom: {
    marginTop: -2,
    fontFamily: fonts.display.medium,
    fontSize: 19,
    color: colors.textPrimary,
  },
  headerAction: {
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
  },
  headerActionPressed: {
    opacity: 0.72,
  },
});
