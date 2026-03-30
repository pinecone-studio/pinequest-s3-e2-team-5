import "react-native-get-random-values";

import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConfigErrorScreen } from "@/components/ConfigErrorScreen";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { colors } from "@/lib/theme";
import { env } from "@/lib/env";
import { ApolloAuthedProvider } from "@/providers/ApolloAuthedProvider";

void SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.pageBackground);
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <FullScreenLoader label="Апп ачаалж байна..." />;
  }

  if (!env.clerkPublishableKey || !env.graphqlUrl) {
    return (
      <ConfigErrorScreen
        title="Config шаардлагатай"
        message="`mobileAppFrontend/.env` файл үүсгээд Clerk publishable key болон GraphQL URL-ээ оруулна уу."
      />
    );
  }

  return (
    <ClerkProvider publishableKey={env.clerkPublishableKey} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <ApolloAuthedProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: colors.pageBackground,
              },
            }}
          />
        </ApolloAuthedProvider>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
