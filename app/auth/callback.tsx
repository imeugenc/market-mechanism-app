import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";

import { isOwnerEmail } from "@/constants/access";
import { Screen } from "@/components/Screen";
import { establishRecoverySession, parseAuthTokensFromUrl } from "@/features/auth/auth";
import { useAppState } from "@/providers/AppProvider";
import { colors, typography } from "@/theme";

export default function AuthCallbackScreen() {
  const { authReady, session, user } = useAppState();
  const isAdmin = user?.isAdmin || isOwnerEmail(session?.user?.email);
  const incomingUrl = Linking.useURL();
  const { access_token, refresh_token, code, token_hash, type } = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    code?: string;
    token_hash?: string;
    type?: string;
  }>();
  const parsedTokens = parseAuthTokensFromUrl(incomingUrl);
  const accessToken = access_token ?? parsedTokens.accessToken;
  const refreshToken = refresh_token ?? parsedTokens.refreshToken;
  const authCode = code ?? parsedTokens.code;
  const tokenHash = token_hash ?? parsedTokens.tokenHash;
  const linkType = type ?? parsedTokens.type;

  useEffect(() => {
    if (!accessToken && !refreshToken && !authCode && !tokenHash) {
      return;
    }

    void establishRecoverySession({
      accessToken,
      refreshToken,
      code: authCode,
      tokenHash,
      type: linkType,
    });
  }, [accessToken, authCode, linkType, refreshToken, tokenHash]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (!session?.user) {
      router.replace("/auth/login");
      return;
    }

    if (isAdmin) {
      router.replace("/admin");
      return;
    }

    router.replace("/(tabs)");
  }, [authReady, isAdmin, session?.user]);

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
