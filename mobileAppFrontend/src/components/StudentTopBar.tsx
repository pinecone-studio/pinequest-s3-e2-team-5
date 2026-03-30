import { useClerk, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, shadows } from "@/lib/theme";

function getDisplayName(rawName: string | undefined, email: string | undefined) {
  if (rawName?.trim()) {
    return rawName.trim();
  }

  if (email?.includes("@")) {
    return email.split("@")[0] ?? "Сурагч";
  }

  return "Сурагч";
}

export function StudentTopBar({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const fullName = [user?.lastName, user?.firstName].filter(Boolean).join(" ");
  const displayName = getDisplayName(fullName || user?.fullName || user?.firstName || undefined, user?.primaryEmailAddress?.emailAddress);
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "SU";

  const handleSignOut = () => {
    Alert.alert("Гарах уу?", "Энэ төхөөрөмжөөс student session-ээ хаана.", [
      {
        text: "Болих",
        style: "cancel",
      },
      {
        text: "Гарах",
        style: "destructive",
        onPress: () => {
          void signOut().then(() => {
            router.replace("/(auth)/sign-in");
          });
        },
      },
    ]);
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#FBF8FF", "#F4F7FF"]}
      locations={[0, 0.58, 1]}
      style={styles.card}
    >
      <View style={styles.glowPurple} />
      <View style={styles.glowBlue} />

      <View style={styles.row}>
        <View>
          <Text style={styles.brandEyebrow}>LEARNING</Text>
          <Text style={styles.brandTitle}>MS</Text>
        </View>

        <Pressable style={styles.profileButton} onPress={handleSignOut}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.profileLabel}>Өдрийн мэнд</Text>
            <Text numberOfLines={1} style={styles.profileName}>
              {displayName}
            </Text>
          </View>
          <Ionicons name="log-out-outline" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.accentLine} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E9E4F5",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    ...shadows.card,
  },
  glowPurple: {
    position: "absolute",
    top: -50,
    right: -25,
    height: 140,
    width: 140,
    borderRadius: 999,
    backgroundColor: "#EEE4FF",
  },
  glowBlue: {
    position: "absolute",
    bottom: -36,
    left: -12,
    height: 110,
    width: 110,
    borderRadius: 999,
    backgroundColor: "#DDE9FF",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  brandEyebrow: {
    fontFamily: fonts.display.medium,
    fontSize: 12,
    letterSpacing: 2.4,
    color: colors.textSoft,
  },
  brandTitle: {
    marginTop: 4,
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: "72%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.88)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  avatar: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.accentWarm,
  },
  avatarText: {
    fontFamily: fonts.display.semibold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  profileCopy: {
    flex: 1,
  },
  profileLabel: {
    fontFamily: fonts.sans.medium,
    fontSize: 11,
    color: colors.textSoft,
  },
  profileName: {
    marginTop: 2,
    fontFamily: fonts.sans.semibold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  eyebrow: {
    marginTop: 18,
    fontFamily: fonts.sans.medium,
    fontSize: 12,
    color: colors.primary,
  },
  title: {
    marginTop: 8,
    fontFamily: fonts.display.bold,
    fontSize: 31,
    lineHeight: 38,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 10,
    maxWidth: "92%",
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  accentLine: {
    marginTop: 16,
    height: 3,
    width: "100%",
    borderRadius: 999,
    backgroundColor: colors.accentBlue,
    opacity: 0.45,
  },
});
