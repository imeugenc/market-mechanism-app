import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, TextInput } from "react-native";

import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { sendPasswordResetEmail } from "@/features/auth/auth";
import { getSupabaseConfigError } from "@/lib/supabase";
import { colors, radii, typography } from "@/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    const trimmedEmail = email.trim();
    const configurationError = getSupabaseConfigError();

    if (!trimmedEmail) {
      setError("Introdu emailul folosit pentru cont.");
      return;
    }

    if (configurationError) {
      setError(configurationError);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { error: resetError } = await sendPasswordResetEmail(trimmedEmail);
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("Emailul de resetare a fost trimis. Deschide linkul pe acest device pentru a seta parola nouă.");
  };

  return (
    <Screen>
      <PremiumCard>
        <Text style={styles.eyebrow}>Recuperare cont</Text>
        <Text style={styles.title}>Resetează parola</Text>
        <Text style={styles.body}>Primești pe email un link securizat care deschide direct fluxul nativ de setare a parolei noi.</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6F6A5C"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <PrimaryButton label={loading ? "Se trimite..." : "Trimite emailul de resetare"} onPress={() => void handleReset()} />
        <PrimaryButton label="Înapoi la logare" variant="ghost" onPress={() => router.back()} />

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
