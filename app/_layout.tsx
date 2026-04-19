import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

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
          options={{ title: "Logare", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }}
        />
        <Stack.Screen
          name="auth/forgot-password"
          options={{ title: "Resetare parolă", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }}
        />
        <Stack.Screen
          name="auth/register"
          options={{ title: "Creează cont", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }}
        />
        <Stack.Screen
          name="auth/reset-password"
          options={{ title: "Parolă nouă", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }}
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
    </>
  );
}
