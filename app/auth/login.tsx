import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { getSupabaseConfigError } from "@/lib/supabase";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

export default function LoginScreen() {
  const { signInWithPassword } = useAppState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const configurationError = getSupabaseConfigError();

    if (!trimmedEmail || !password) {
      setMessage("Introdu emailul și parola pentru autentificare.");
      return;
    }

    if (configurationError) {
      setMessage(configurationError);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await signInWithPassword(trimmedEmail, password);
      if (!result.success) {
        setMessage(result.message ?? "Autentificarea a eșuat.");
        setLoading(false);
        return;
      }

      setLoading(false);
      if (result.isAdmin) {
        router.replace("/admin");
        return;
      }

      router.replace("/(tabs)");
    } catch (error) {
      setLoading(false);
      setMessage(error instanceof Error ? error.message : "Autentificarea a eșuat.");
    }
  };

  return (
    <Screen>
      <PremiumCard>
        <Text style={styles.eyebrow}>Acces cont</Text>
        <Text style={styles.title}>Logare</Text>
        <Text style={styles.body}>Intră în contul tău pentru a accesa planul, istoricul și conținutul Premium.</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6F6A5C"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholder="Parolă"
          placeholderTextColor="#6F6A5C"
          secureTextEntry
        />

        <PrimaryButton label={loading ? "Se autentifică..." : "Intră în cont"} onPress={() => void handleLogin()} />
        <PrimaryButton label="Ai uitat parola?" variant="ghost" onPress={() => router.push("/auth/forgot-password")} />
        <PrimaryButton label="Creează cont" variant="ghost" onPress={() => router.push("/auth/register")} />

        {message ? <Text style={styles.message}>{message}</Text> : null}
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
  message: {
    color: colors.gold,
    fontSize: typography.small,
    lineHeight: 18,
  },
});
