import { Redirect } from "expo-router";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { useLocalAuth } from "@/lib/local-auth";

export default function IndexPage() {
  const { isHydrating, isSignedIn } = useLocalAuth();

  if (isHydrating) {
    return <FullScreenLoader label="Нэвтрэх төлөвийг шалгаж байна..." />;
  }

  return <Redirect href={isSignedIn ? "/(student)/(tabs)" : "/sign-in"} />;
}
