import { StyleSheet, Text, TextInput, View } from "react-native";

import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";
import { PrimaryButton } from "./PrimaryButton";

export function AuthCard() {
  const {
    authEmail,
    authPassword,
    authMessage,
    requestMagicLink,
    setAuthEmail,
    setAuthPassword,
    signInAsDemo,
    signInWithPassword,
    signOut,
    signUpWithPassword,
    user,
  } =
    useAppState();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Autentificare</Text>
      <Text style={styles.body}>
        Implicit, aplicația folosește cont demo pentru testare rapidă. În producție, fluxul recomandat este autentificarea prin email și parolă sau prin link de acces.
      </Text>
      <TextInput
        value={authEmail}
        onChangeText={setAuthEmail}
        style={styles.input}
        placeholder="tu@exemplu.com"
        placeholderTextColor="#6F6A5C"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        value={authPassword}
        onChangeText={setAuthPassword}
        style={styles.input}
        placeholder="Parolă"
        placeholderTextColor="#6F6A5C"
        secureTextEntry
      />
      <View style={styles.actions}>
        <PrimaryButton label="Intră cu email" onPress={() => void signInWithPassword()} />
        <PrimaryButton label="Creează cont" variant="ghost" onPress={() => void signUpWithPassword()} />
        <PrimaryButton label="Trimite link de acces" variant="ghost" onPress={() => void requestMagicLink()} />
        <PrimaryButton
          label={user ? "Deconectare" : "Folosește acces demo"}
          variant="ghost"
          onPress={() => void (user ? signOut() : signInAsDemo())}
        />
      </View>
      <Text style={styles.message}>{authMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPanel,
    padding: 16,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.section,
    fontWeight: "800",
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSoft,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: typography.body,
  },
  actions: {
    gap: spacing.sm,
  },
  message: {
    color: colors.gold,
    fontSize: typography.small,
    lineHeight: 18,
  },
});
