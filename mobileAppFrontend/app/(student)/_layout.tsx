import { Redirect, Stack } from "expo-router";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { AppDataProvider } from "@/data/app-data";
import { useLocalAuth } from "@/lib/local-auth";

export default function StudentLayout() {
  const { isHydrating, isSignedIn } = useLocalAuth();

  if (isHydrating) {
    return <FullScreenLoader label="Нэвтрэх төлөвийг шалгаж байна..." />;
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <AppDataProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile/classroom" />
        <Stack.Screen name="exam/[examId]" />
        <Stack.Screen name="exam/submitted" />
        <Stack.Screen name="exam/[examId]/take" />
        <Stack.Screen name="results/[submissionId]" />
      </Stack>
    </AppDataProvider>
  );
}
