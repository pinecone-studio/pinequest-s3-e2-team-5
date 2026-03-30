import { useSignIn } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import { TextField } from "@/components/TextField";
import { getClerkErrorMessage } from "@/lib/clerk-errors";
import { colors, fonts, shadows } from "@/lib/theme";

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const attempt = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (attempt.status === "complete" && attempt.createdSessionId) {
        await setActive?.({
          session: attempt.createdSessionId,
        });
        router.replace("/");
        return;
      }

      setError("Нэмэлт баталгаажуулалт шаардлагатай байна.");
    } catch (caughtError) {
      setError(getClerkErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={["#FFFFFF", "#FDF9FF", "#F5F0FF"]}
      locations={[0, 0.55, 1]}
      style={styles.page}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>PINEQUEST STUDENT</Text>
              <Text style={styles.title}>Сурагчийн апп</Text>
              <Text style={styles.subtitle}>
                Нээлттэй шалгалтуудаа харах, өгөх, үр дүнгээ утаснаасаа шууд шалгах зориулалттай iOS-first app.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>Learning MS</Text>
              </View>

              <Text style={styles.cardTitle}>Нэвтрэх</Text>
              <Text style={styles.cardSubtitle}>
                Одоогоор mobile app дээр зөвхөн student sign-in дэмжинэ.
              </Text>

              <View style={styles.form}>
                <TextField
                  label="Имэйл"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="student@example.com"
                />
                <TextField
                  label="Нууц үг"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Нууц үгээ оруулна уу"
                />
              </View>

              {error ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <PrimaryButton
                label={isSubmitting ? "Нэвтэрч байна..." : "Нэвтрэх"}
                onPress={() => void handleSignIn()}
                disabled={isSubmitting || !email.trim() || !password.trim()}
              />

              <View style={styles.noteCard}>
                <Text style={styles.noteText}>
                  Student бүртгэл шинээр үүсгэх шаардлагатай бол web хувилбараар бүртгүүлээд, mobile app дээр зөвхөн нэвтэрч орно.
                </Text>
              </View>

              <Pressable onPress={() => router.replace("/")}>
                <Text style={styles.secondaryAction}>Сессээ дахин шалгах</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  hero: {
    marginBottom: 24,
  },
  eyebrow: {
    fontFamily: fonts.display.semibold,
    fontSize: 12,
    letterSpacing: 2.8,
    color: colors.textSoft,
  },
  title: {
    marginTop: 10,
    fontFamily: fonts.display.bold,
    fontSize: 34,
    lineHeight: 40,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 12,
    fontFamily: fonts.sans.regular,
    fontSize: 15,
    lineHeight: 25,
    color: colors.textMuted,
  },
  card: {
    borderRadius: 30,
    backgroundColor: colors.surface,
    padding: 22,
    ...shadows.card,
  },
  brandBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  brandBadgeText: {
    fontFamily: fonts.display.medium,
    fontSize: 12,
    color: colors.primary,
  },
  cardTitle: {
    marginTop: 18,
    fontFamily: fonts.display.semibold,
    fontSize: 26,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    marginTop: 8,
    fontFamily: fonts.sans.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
  form: {
    marginTop: 22,
    gap: 16,
  },
  errorCard: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerBackground,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    fontFamily: fonts.sans.medium,
    fontSize: 14,
    color: colors.dangerText,
  },
  noteCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.surfaceTint,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  noteText: {
    fontFamily: fonts.sans.regular,
    fontSize: 13,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  secondaryAction: {
    marginTop: 18,
    textAlign: "center",
    fontFamily: fonts.sans.semibold,
    fontSize: 14,
    color: colors.primary,
  },
});
