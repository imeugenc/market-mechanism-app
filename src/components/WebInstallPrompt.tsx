import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { colors, radii, spacing, typography } from "@/theme";

const STORAGE_KEY = "market-mechanism:web-install-prompt-dismissed";

function isStandaloneWebApp() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }

  const navigatorStandalone =
    typeof navigator !== "undefined" && "standalone" in navigator
      ? Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
      : false;

  return navigatorStandalone || window.matchMedia?.("(display-mode: standalone)")?.matches === true;
}

export function WebInstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || isStandaloneWebApp()) {
      return;
    }

    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (dismissed === "true") {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const dismiss = (persist = true) => {
    if (Platform.OS === "web" && typeof window !== "undefined" && persist) {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }

    setVisible(false);
  };

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={() => dismiss()}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Instalare rapidă</Text>
          <Text style={styles.title}>Instalează Market Mechanism</Text>
          <Text style={styles.subtitle}>Acces rapid direct de pe telefon, exact ca o aplicație.</Text>

          <View style={styles.instructions}>
            <View style={styles.instructionBlock}>
              <Text style={styles.instructionTitle}>🍎 iPhone (Safari)</Text>
              <Text style={styles.step}>1. Apasă Share</Text>
              <Text style={styles.step}>2. Alege Add to Home Screen</Text>
              <Text style={styles.step}>3. Confirmă</Text>
            </View>

            <View style={styles.instructionBlock}>
              <Text style={styles.instructionTitle}>🤖 Android (Chrome)</Text>
              <Text style={styles.step}>1. Apasă meniul browserului</Text>
              <Text style={styles.step}>2. Alege Install App / Add to Home Screen</Text>
              <Text style={styles.step}>3. Confirmă</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Am înțeles" onPress={() => dismiss(true)} />
            <Pressable onPress={() => dismiss(true)} style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>Nu mai afișa</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    backgroundColor: "#0A0907",
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#D4AF37",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  eyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    color: colors.textStrong,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  instructions: {
    gap: spacing.md,
  },
  instructionBlock: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
    padding: spacing.md,
    gap: 6,
  },
  instructionTitle: {
    color: colors.textStrong,
    fontSize: typography.body,
    fontWeight: "800",
  },
  step: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 21,
  },
  actions: {
    gap: spacing.sm,
  },
  secondaryAction: {
    alignItems: "center",
    paddingVertical: 6,
  },
  secondaryActionText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "700",
  },
});
