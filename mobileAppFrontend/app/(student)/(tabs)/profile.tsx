import { router } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StatusCard } from "@/components/StatusCard";
import { useAppData } from "@/data/app-data";
import { useLocalAuth } from "@/lib/local-auth";
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

export default function ProfileScreen() {
  const { student, submissions, availableExams, isRemoteData, resetData } = useAppData();
  const { signOut } = useLocalAuth();

  const handleReset = () => {
    Alert.alert(
      isRemoteData ? "Өгөгдөл шинэчлэх" : "Өгөгдөл цэвэрлэх",
      isRemoteData
        ? "Backend-ээс хамгийн сүүлийн өгөгдлийг дахин ачаалах уу?"
        : "Өгсөн шалгалтын төхөөрөмж дээр хадгалсан үр дүнг цэвэрлэх үү?",
      [
      {
        text: "Болих",
        style: "cancel",
      },
      {
        text: "Цэвэрлэх",
        style: "destructive",
        onPress: () => {
          resetData();
        },
      },
      ],
    );
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(student.fullName)}</Text>
          </View>
          <Text style={styles.name}>{student.fullName}</Text>
          <Text style={styles.email}>{student.email}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{availableExams.length}</Text>
            <Text style={styles.statLabel}>Нээлттэй</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{submissions.length}</Text>
            <Text style={styles.statLabel}>Өгсөн</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="Төрөл" value="Сурагч" />
          <InfoRow label="Утас" value={student.phone} />
          <InfoRow label="Анги" value={student.className} />
          <InfoRow label="Ангийн код" value={student.inviteCode} />
        </View>

        <StatusCard
          tone="info"
          message={
            isRemoteData
              ? "Энэ app одоогоор .env дээр тохируулсан нэг сурагчийн account-аар backend-ээс өгөгдлөө авч байна."
              : "Энэ хэсэг одоогоор төхөөрөмж дээрх туршилтын өгөгдлөөр ажиллаж байна."
          }
        />

        <PrimaryButton
          label="Анги солих"
          onPress={() => {
            router.push("/(student)/profile/classroom");
          }}
          variant="secondary"
        />
        <PrimaryButton
          label={isRemoteData ? "Өгөгдөл шинэчлэх" : "Үр дүн цэвэрлэх"}
          onPress={handleReset}
          variant="secondary"
        />
        <PrimaryButton
          label="Гарах"
          onPress={() => {
            void signOut();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  profileCard: {
    alignItems: "center",
    borderRadius: 28,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 24,
    ...shadows.card,
  },
  avatar: {
    height: 78,
    width: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  avatarText: {
    fontFamily: fonts.display.semibold,
    fontSize: 26,
    color: colors.primaryDark,
  },
  name: {
    marginTop: 14,
    fontFamily: fonts.display.semibold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  email: {
    marginTop: 6,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  statsRow: {
    marginTop: 16,
    marginBottom: 16,
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...shadows.card,
  },
  statValue: {
    fontFamily: fonts.display.semibold,
    fontSize: 24,
    color: colors.textPrimary,
  },
  statLabel: {
    marginTop: 6,
    fontFamily: fonts.sans.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  infoCard: {
    marginBottom: 14,
    borderRadius: 24,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 8,
    ...shadows.card,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  infoValue: {
    fontFamily: fonts.sans.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
