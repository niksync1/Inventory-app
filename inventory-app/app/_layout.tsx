import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/AuthService";
import QueryProvider from "../providers/QueryProvider";
import AuthProvider from "../providers/AuthProvider";

export default function RootLayout() {
  const { session, loading, setSession, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Bootstrap: check for existing session on app launch
  useEffect(() => {
    async function bootstrap() {
      try {
        const { session: existingSession, error } = await authService.getSession();

        if (!error) {
          setSession(existingSession);
        } else {
          console.warn(error.message);
          setLoading(false);
        }
      } catch (err) {
        // Prevent unhandled promise rejection (would show a dismissable red box)
        console.warn("Failed to restore session:", err);
        setLoading(false);
      }
    }

    bootstrap();
  }, [setSession, setLoading]);

  // Auth guard: redirect based on session state
  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === undefined || segments[0] === "";
    const isAuthenticated = !!session?.user;

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in and not on login screen → redirect to login
      router.replace("/");
    }

    if (isAuthenticated && inAuthGroup) {
      // Logged in and on login screen → redirect to dashboard
      router.replace("/(tabs)");
    }
  }, [session, loading, segments, router]);

  return (
    <QueryProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </QueryProvider>
  );
}
