import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, TextInput } from "react-native";

import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { getSupabaseConfigError } from "@/lib/supabase";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, typography } from "@/theme";

export default function RegisterScreen() {
  const { signUpWithPassword } = useAppState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const configurationError = getSupabaseConfigError();

    if (!trimmedEmail || !password) {
      setMessage("Introdu emailul și parola pentru a crea contul.");
      return;
    }

    if (configurationError) {
      setMessage(configurationError);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await signUpWithPassword(trimmedEmail, password);
      if (!result.success) {
        setMessage(result.message ?? "Crearea contului a eșuat.");
        setLoading(false);
        return;
      }

      setLoading(false);

      if (result.requiresEmailConfirmation) {
        setMessage(result.message ?? "Cont creat. Verifică emailul pentru confirmare, apoi autentifică-te.");
        return;
      }

      if (result.isAdmin) {
        router.replace("/admin");
        return;
      }

      router.replace("/");
    } catch (error) {
      setLoading(false);
      setMessage(error instanceof Error ? error.message : "Crearea contului a eșuat.");
    }
  };

  return (
    <Screen>
      <PremiumCard>
        <Text style={styles.eyebrow}>Acces nou</Text>
        <Text style={styles.title}>Creează cont</Text>
        <Text style={styles.body}>Conturile noi pornesc cu rol `user` și plan `free`.</Text>

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

        <PrimaryButton label={loading ? "Se creează..." : "Creează cont"} onPress={() => void handleRegister()} />
        <PrimaryButton label="Ai deja cont? Loghează-te" variant="ghost" onPress={() => router.push("/auth/login")} />

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
