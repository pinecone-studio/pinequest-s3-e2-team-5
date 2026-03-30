import { useAuth, useUser } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { colors, fonts, shadows } from "@/lib/theme";

export default function IndexPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return <FullScreenLoader label="Сесс шалгаж байна..." />;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (user?.unsafeMetadata?.role !== "student") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Энэ апп нь зөвхөн сурагчдад зориулагдсан</Text>
          <Text style={styles.message}>
            Багш тал одоогоор web хувилбар дээр ажиллана. Student эрхтэй аккаунтаар нэвтэрнэ үү.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <Redirect href="/(student)/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBackground,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 24,
    ...shadows.card,
  },
  title: {
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    color: colors.textPrimary,
  },
  message: {
    marginTop: 10,
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
  },
});
