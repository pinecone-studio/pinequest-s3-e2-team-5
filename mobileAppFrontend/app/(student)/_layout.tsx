import { Stack } from "expo-router";

export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="exam/[examId]" />
      <Stack.Screen name="exam/[examId]/take" />
      <Stack.Screen name="results/[submissionId]" />
    </Stack>
  );
}
