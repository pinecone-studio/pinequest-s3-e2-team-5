import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppData } from "@/data/app-data";
import { colors, fonts, shadows } from "@/lib/theme";

function getInitials(fullName: string) {
  return (
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "СУ"
  );
}

const schoolName = "1-р сургууль";

export default function ProfileScreen() {
  const { student } = useAppData();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(student.fullName)}</Text>
          </View>

          <View style={styles.identityBlock}>
            <Text style={styles.name}>{student.fullName}</Text>
            <Text style={styles.email}>{student.email}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Сургууль</Text>
            <Text style={styles.infoValue}>{schoolName}</Text>
          </View>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Анги</Text>
            <Text style={styles.infoValue}>{student.className}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.codeRow}>
            <MaterialCommunityIcons name="qrcode-scan" size={28} color={colors.textSecondary} />
            <Text style={styles.codeValue}>{student.inviteCode}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 54,
    paddingBottom: 120,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 20,
    ...shadows.card,
  },
  avatar: {
    height: 72,
    width: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
  },
  avatarText: {
    fontFamily: fonts.display.medium,
    fontSize: 24,
    color: colors.primary,
  },
  identityBlock: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontFamily: fonts.display.medium,
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
  },
  email: {
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  infoCard: {
    marginTop: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    ...shadows.card,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  infoRowLast: {
    marginBottom: 20,
  },
  infoLabel: {
    fontFamily: fonts.sans.regular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  infoValue: {
    fontFamily: fonts.sans.regular,
    fontSize: 18,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 18,
  },
  codeValue: {
    fontFamily: fonts.sans.medium,
    fontSize: 20,
    color: colors.textPrimary,
  },
});
