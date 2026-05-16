import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

import { WebInstallPrompt } from "@/components/WebInstallPrompt";
import { AppProvider } from "@/providers/AppProvider";
import { colors } from "@/theme";

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}

function RootNavigator() {
  const isWeb = Platform.OS === "web";

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
        <Stack.Screen
          name="auth/login"
          options={{ title: "Logare", headerShown: !isWeb, headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }}
        />
        <Stack.Screen
          name="auth/forgot-password"
          options={{ title: "Resetare parolă", headerShown: !isWeb, headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }}
        />
        <Stack.Screen
          name="auth/register"
          options={{ title: "Creează cont", headerShown: !isWeb, headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }}
        />
        <Stack.Screen
          name="auth/reset-password"
          options={{ title: "Parolă nouă", headerShown: !isWeb, headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }}
        />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="market/[market]"
          options={{
            title: "Briefing piață",
            headerBackTitle: "",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <Stack.Screen
          name="admin"
          options={{ title: "Consolă creator", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }}
        />
        <Stack.Screen
          name="contact"
          options={{ title: "Contact", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }}
        />
        <Stack.Screen
          name="review/[id]"
          options={{ title: "After Action Review", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }}
        />
      </Stack>
      <WebInstallPrompt />
    </>
  );
}
