import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { Screen } from "@/components/Screen";
import { useAppState } from "@/providers/AppProvider";
import { colors, typography } from "@/theme";

export default function AuthCallbackScreen() {
  const { authReady, session, user } = useAppState();

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!session?.user) {
      router.replace("/auth/login");
      return;
    }

    if (user?.isAdmin) {
      router.replace("/admin");
      return;
    }

    router.replace("/");
  }, [authReady, session?.user, user?.isAdmin]);

  return (
    <Screen>
      <View style={styles.card}>
        <ActivityIndicator color={colors.gold} />
        <Text style={styles.title}>Se confirmă autentificarea</Text>
        <Text style={styles.body}>Te redirecționăm imediat către aplicație.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  title: {
    color: colors.textStrong,
    fontSize: 22,
    fontWeight: "800",
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
});
