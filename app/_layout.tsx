import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

import { AppProvider, useAppState } from "@/providers/AppProvider";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}

function RootNavigator() {
  const segments = useSegments();
  const { authReady, onboardingReady, hasCompletedOnboarding } = useAppState();
  const isStaticWebRender = Platform.OS === "web" && typeof window === "undefined";

  if (!isStaticWebRender && (!onboardingReady || !authReady)) {
    return null;
  }

  if (!isStaticWebRender && !hasCompletedOnboarding && segments[0] !== "onboarding") {
    return <Redirect href="/onboarding" />;
  }

  if (!isStaticWebRender && hasCompletedOnboarding && segments[0] === "onboarding") {
    return <Redirect href="/" />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: "Logare" }} />
        <Stack.Screen name="auth/register" options={{ title: "Creează cont" }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="market/[market]"
          options={{
            title: "Briefing piață",
            headerBackTitle: "",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <Stack.Screen name="admin" options={{ title: "Consolă creator" }} />
      </Stack>
    </>
  );
}
