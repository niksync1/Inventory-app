import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/AuthService";
import QueryProvider from "../providers/QueryProvider";
import AuthProvider from "../providers/AuthProvider";

export default function RootLayout() {
  const { session, loading, setSession, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Process a password-recovery deep link (inventory-app://reset-password#access_token=...&refresh_token=...)
  // detectSessionInUrl is false, so Supabase won't pick up the tokens automatically —
  // we must parse the URL and create the session ourselves.
  useEffect(() => {
    let mounted = true;

    async function processResetLink(url: string) {
      if (!url || !url.includes("reset-password")) {
        return;
      }

      try {
        const { queryParams } = Linking.parse(url);
        const accessToken = (queryParams?.access_token ??
          queryParams?.accessToken) as string | undefined;
        const refreshToken = (queryParams?.refresh_token ??
          queryParams?.refreshToken) as string | undefined;

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.warn(error.message);
            return;
          }

          if (mounted) {
            setSession(data.session);
            router.replace("/(auth)/reset-password");
          }
        }
      } catch (err) {
        // Prevent unhandled promise rejection
        console.warn("Failed to process reset link:", err);
      }
    }

    // Handle the URL that launched the app (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        processResetLink(url);
      }
    });

    // Handle links received while the app is already running
    const sub = Linking.addEventListener("url", ({ url }) => {
      processResetLink(url);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [setSession, router]);

  // Bootstrap: check for existing session on app launch
  useEffect(() => {
    async function bootstrap() {
      try {
        const { session: existingSession, error } = await authService.getSession();

        if (error) {
          console.warn(error.message);
          setLoading(false);
          return;
        }

        // If the reset-link handler already created a session, don't clobber it.
        if (existingSession) {
          setSession(existingSession);
        } else {
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

  // Auth guard: redirect based on session state.
  // Note: expo-router strips route groups, so the auth screens appear as
  // 'forgot-password' and 'reset-password' segments (login is the index).
  useEffect(() => {
    if (loading) {
      return;
    }

    const current = segments[0];
    const inAuthGroup =
      current === undefined ||
      current === "" ||
      current === "forgot-password" ||
      current === "reset-password";
    const isResetScreen = current === "reset-password";
    const isAuthenticated = !!session?.user;

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in and not on an auth screen → redirect to login
      router.replace("/");
    }

    if (isAuthenticated && inAuthGroup && !isResetScreen) {
      // Logged in and on a login/auth screen → redirect to dashboard.
      // Skip this for the reset screen so a recovery session can finish
      // entering a new password.
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