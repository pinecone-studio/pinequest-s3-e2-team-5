import { Stack, router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StatusCard } from "@/components/StatusCard";
import { TextField } from "@/components/TextField";
import { useAppData } from "@/data/app-data";
import { colors, fonts, shadows } from "@/lib/theme";

export default function ChangeClassroomScreen() {
  const { student, changeStudentClassroom, isRemoteData } = useAppData();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const normalizedCode = inviteCode.trim().toUpperCase();

    if (!normalizedCode) {
      setError("Ангийн кодоо оруулна уу.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await changeStudentClassroom(normalizedCode);
      router.back();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Анги солиход алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Анги солих</Text>
        <Text style={styles.subtitle}>
          Нэг сурагч нэг л ангид харьяалагдана. Шинэ код оруулбал одоогийн ангийг тань солино.
        </Text>

        <View style={styles.card}>
          <InfoRow label="Одоогийн анги" value={student.className} />
          <InfoRow label="Одоогийн код" value={student.inviteCode} isLast />
        </View>

        {!isRemoteData ? (
          <StatusCard tone="warning" message="Энэ үйлдэл зөвхөн backend-тэй горимд ажиллана." />
        ) : null}
        {error ? <StatusCard tone="error" message={error} /> : null}

        <View style={styles.formCard}>
          <TextField
            label="Шинэ ангийн код"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="Жишээ: FTQ8W7"
          />
        </View>

        <PrimaryButton
          label="Хадгалах"
          onPress={() => {
            void handleSave();
          }}
          loading={loading}
          disabled={!isRemoteData}
        />
        <PrimaryButton
          label="Буцах"
          onPress={() => {
            router.back();
          }}
          variant="secondary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, isLast ? styles.infoRowLast : null]}>
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
    paddingTop: 20,
    paddingBottom: 120,
  },
  title: {
    fontFamily: fonts.display.semibold,
    fontSize: 28,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  card: {
    marginTop: 18,
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
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  infoValue: {
    maxWidth: "58%",
    textAlign: "right",
    fontFamily: fonts.sans.semibold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  formCard: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 18,
    ...shadows.card,
  },
});
