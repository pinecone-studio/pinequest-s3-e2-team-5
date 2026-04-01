import { Redirect } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TextField } from "@/components/TextField";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { useLocalAuth } from "@/lib/local-auth";
import { colors, fonts, shadows } from "@/lib/theme";

export default function SignInScreen() {
  const { isHydrating, isSignedIn, signIn, expectedEmail } = useLocalAuth();
  const [email, setEmail] = useState(expectedEmail);
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isHydrating) {
    return <FullScreenLoader label="Нэвтрэх төлөвийг шалгаж байна..." />;
  }

  if (isSignedIn) {
    return <Redirect href="/(student)/(tabs)" />;
  }

  const handleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await signIn({ email, password });
    } catch (caughtError) {
      setErrorMessage(caughtError instanceof Error ? caughtError.message : "Нэвтрэхэд алдаа гарлаа.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.page}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.kicker}>Learning MS</Text>
            <Text style={styles.title}>Нэвтрэх</Text>
            <Text style={styles.subtitle}>
              Энэ app одоогоор нэг сурагчийн account-аар ажиллана.
            </Text>
          </View>

          <View style={styles.card}>
            <TextField
              label="Имэйл"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="student@example.com"
            />

            <TextField
              label="Нууц үг"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Нууц үгээ оруулна уу"
            />

            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

            <PrimaryButton
              label="Нэвтрэх"
              onPress={() => void handleSignIn()}
              loading={isSubmitting}
              disabled={!email.trim() || !password}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 48,
    justifyContent: "center",
  },
  hero: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  kicker: {
    fontFamily: fonts.display.medium,
    fontSize: 14,
    color: colors.primaryDark,
  },
  title: {
    marginTop: 10,
    fontFamily: fonts.display.bold,
    fontSize: 34,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 10,
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
  },
  card: {
    gap: 18,
    borderRadius: 28,
    backgroundColor: colors.surface,
    padding: 20,
    ...shadows.card,
  },
  error: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    color: colors.dangerText,
  },
});
