import { useMemo, useState } from "react";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

const STEPS = [
  {
    eyebrow: "Execution Edge",
    title: "Analiză zilnică pentru traderi serioși",
    body: "BTC, ETH, NQ, ES – claritate, execuție, disciplină",
    button: "Începe",
    accent: "Briefing video zilnic",
    icon: "chart-line",
  },
  {
    eyebrow: "Acces",
    title: "Gratuit vs Premium",
    body: "GRATUIT: vezi After Action Review. PREMIUM: primești analiza zilnică video completă.",
    button: "Continuă",
    accent: "Valoare clară din prima zi",
    icon: "shield-crown-outline",
  },
  {
    eyebrow: "Solicitări",
    title: "Poți solicita analiză personalizată",
    body: "Alegi activul și nivelul potrivit. Cererea rămâne simplă, rapidă și ușor de monetizat.",
    button: "Intră în aplicație",
    accent: "$2 • $5 • $10",
    icon: "sword-cross",
  },
] as const;

export default function OnboardingScreen() {
  const { completeOnboarding } = useAppState();
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const progress = useMemo(
    () => STEPS.map((_, index) => ({ id: index, active: index === stepIndex })),
    [stepIndex],
  );

  const handleNext = async () => {
    if (!isLastStep) {
      setStepIndex((prev) => prev + 1);
      return;
    }

    await completeOnboarding();
    router.replace("/");
  };

  return (
    <Screen>
      <View style={styles.shell}>
        <PremiumCard>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name={step.icon} size={26} color={colors.gold} />
          </View>
          <Text style={styles.eyebrow}>{step.eyebrow}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          <View style={styles.accentCard}>
            <Text style={styles.accentLabel}>Punct cheie</Text>
            <Text style={styles.accentValue}>{step.accent}</Text>
          </View>

          {stepIndex === 1 ? (
            <View style={styles.compareBlock}>
              <View style={styles.compareRow}>
                <Text style={styles.comparePlan}>GRATUIT</Text>
                <Text style={styles.compareText}>Vezi After Action Review</Text>
              </View>
              <View style={styles.compareRow}>
                <Text style={[styles.comparePlan, styles.comparePlanPremium]}>PREMIUM</Text>
                <Text style={styles.compareText}>Primești analiza zilnică video completă</Text>
              </View>
            </View>
          ) : null}

          {stepIndex === 2 ? (
            <View style={styles.pricingRow}>
              {["$2", "$5", "$10"].map((value) => (
                <View key={value} style={styles.pricePill}>
                  <Text style={styles.priceText}>{value}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.progressRow}>
            {progress.map((item) => (
              <View key={item.id} style={[styles.progressDot, item.active && styles.progressDotActive]} />
            ))}
          </View>

          <PrimaryButton label={step.button} onPress={() => void handleNext()} />
        </PremiumCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    justifyContent: "center",
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  title: {
    color: colors.textStrong,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 24,
  },
  accentCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
    padding: 16,
    gap: 6,
  },
  accentLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  accentValue: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  compareBlock: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
    overflow: "hidden",
  },
  compareRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    gap: 4,
  },
  comparePlan: {
    color: colors.success,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "800",
  },
  comparePlanPremium: {
    color: colors.gold,
  },
  compareText: {
    color: colors.textStrong,
    fontSize: typography.body,
    lineHeight: 22,
  },
  pricingRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  pricePill: {
    flex: 1,
    minWidth: 80,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgMuted,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  priceText: {
    color: colors.gold,
    fontSize: typography.section,
    fontWeight: "800",
  },
  progressRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingTop: 4,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    width: 26,
    backgroundColor: colors.gold,
  },
});
