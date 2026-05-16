import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Platform, StyleSheet, Text, TextInput } from "react-native";
import * as Linking from "expo-linking";

import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { BrandLockup } from "@/components/BrandLockup";
import { Screen } from "@/components/Screen";
import { establishRecoverySession, parseAuthTokensFromUrl, updatePassword } from "@/features/auth/auth";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, typography } from "@/theme";

export default function ResetPasswordScreen() {
  const { session } = useAppState();
  const incomingUrl = Linking.useURL();
  const currentUrl =
    Platform.OS === "web" && typeof window !== "undefined" ? window.location.href : incomingUrl;
  const { access_token, refresh_token, code, token_hash, type } = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    code?: string;
    token_hash?: string;
    type?: string;
  }>();
  const parsedTokens = parseAuthTokensFromUrl(currentUrl);
  const accessToken = access_token ?? parsedTokens.accessToken;
  const refreshToken = refresh_token ?? parsedTokens.refreshToken;
  const authCode = code ?? parsedTokens.code;
  const tokenHash = token_hash ?? parsedTokens.tokenHash;
  const recoveryType = type ?? parsedTokens.type;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setReady(true);
      return;
    }

    if (!accessToken && !refreshToken && !authCode && !tokenHash) {
      return;
    }

    void (async () => {
      const { error: sessionError } = await establishRecoverySession({
        accessToken,
        refreshToken,
        code: authCode,
        tokenHash,
        type: recoveryType,
      });

      if (sessionError) {
        setError("Linkul de resetare nu mai este valid. Cere un email nou de resetare.");
        return;
      }

      setReady(true);
    })();
  }, [accessToken, refreshToken, authCode, tokenHash, recoveryType, session?.user]);

  const handleSave = async () => {
    if (!ready) {
      setError("Sesiunea de resetare nu este încă pregătită. Reîncearcă după ce linkul este validat complet.");
      return;
    }

    if (password.length < 8) {
      setError("Parola nouă trebuie să aibă cel puțin 8 caractere.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Parolele nu coincid.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const { error: updateError } = await updatePassword(password);
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Parola a fost actualizată. Te poți întoarce în aplicație și continua normal.");
  };

  return (
    <Screen>
      <PremiumCard>
        <BrandLockup />
        <Text style={styles.eyebrow}>Resetare parolă</Text>
        <Text style={styles.title}>Alege parola nouă</Text>
        <Text style={styles.body}>Fluxul rulează nativ în aplicație. După salvare, sesiunea curentă rămâne activă.</Text>

        {!ready ? <Text style={styles.body}>Se validează linkul de resetare…</Text> : null}

        <TextInput
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholder="Parolă nouă"
          placeholderTextColor="#6F6A5C"
          secureTextEntry
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          placeholder="Confirmă parola nouă"
          placeholderTextColor="#6F6A5C"
          secureTextEntry
        />

        <PrimaryButton
          label={saving ? "Se salvează..." : "Salvează parola nouă"}
          onPress={() => void handleSave()}
        />
        <PrimaryButton label="Înapoi la logare" variant="ghost" onPress={() => router.replace("/auth/login")} />

        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </PremiumCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  title: {
    color: colors.textStrong,
    fontSize: 30,
    fontWeight: "800",
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  input: {
    minHeight: 54,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSoft,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: typography.body,
  },
  success: {
    color: colors.success,
    fontSize: typography.small,
    lineHeight: 18,
  },
  error: {
    color: colors.danger,
    fontSize: typography.small,
    lineHeight: 18,
  },
});
