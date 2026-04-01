import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type LocalAuthContextValue = {
  isHydrating: boolean;
  isSignedIn: boolean;
  expectedEmail: string;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const SESSION_KEY = "pinequest.local-auth.v1";

const LocalAuthContext = createContext<LocalAuthContextValue | null>(null);

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function getExpectedEmail() {
  return readEnv("EXPO_PUBLIC_MOBILE_STUDENT_EMAIL").toLowerCase();
}

function getExpectedPassword() {
  return readEnv("EXPO_PUBLIC_APP_LOGIN_PASSWORD");
}

export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const expectedEmail = getExpectedEmail();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const storedSession = await SecureStore.getItemAsync(SESSION_KEY);

        if (!cancelled) {
          setIsSignedIn(storedSession === "signed-in");
        }
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const expectedPassword = getExpectedPassword();

    if (!expectedEmail || !expectedPassword) {
      throw new Error("Login тохиргоо дутуу байна. .env дээр EXPO_PUBLIC_APP_LOGIN_PASSWORD нэмнэ үү.");
    }

    if (normalizedEmail !== expectedEmail || password !== expectedPassword) {
      throw new Error("Имэйл эсвэл нууц үг буруу байна.");
    }

    await SecureStore.setItemAsync(SESSION_KEY, "signed-in");
    setIsSignedIn(true);
  }, [expectedEmail]);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setIsSignedIn(false);
  }, []);

  const value = useMemo<LocalAuthContextValue>(
    () => ({
      isHydrating,
      isSignedIn,
      expectedEmail,
      signIn,
      signOut,
    }),
    [expectedEmail, isHydrating, isSignedIn, signIn, signOut],
  );

  return <LocalAuthContext.Provider value={value}>{children}</LocalAuthContext.Provider>;
}

export function useLocalAuth() {
  const context = useContext(LocalAuthContext);

  if (!context) {
    throw new Error("useLocalAuth-г LocalAuthProvider-ийн дотор ашиглах ёстой.");
  }

  return context;
}
