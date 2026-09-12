import { router, Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { recentBiases } from "@/data/recent-biases";
import { formatDate } from "@/lib/format";
import { colors, radii, spacing, typography } from "@/theme";

export default function BiasDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const bias = recentBiases.find((item) => item.id === id);

  if (!bias) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Bias", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }} />
        <Text style={styles.title}>Bias indisponibil</Text>
        <Text style={styles.body}>Acest review nu a fost găsit.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: "Daily Bias", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }} />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>BIAS ISTORIC</Text>
        <Text style={styles.title}>{bias.market}</Text>
        <Text style={styles.date}>{formatDate(bias.publishedAt)}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>Bias: {bias.forecastedBias}</Text>
          <Text style={styles.meta}>Încredere: {bias.confidence}</Text>
        </View>
        <View style={styles.outcome}>
          <Text style={styles.outcomeText}>Rezultat: {bias.outcome}</Text>
        </View>
        <Text style={styles.sectionTitle}>Contextul notat</Text>
        <Text style={styles.body}>{bias.notes}</Text>
        <Text style={styles.disclaimer}>Arhivă educațională bazată pe review-ul zilnic, nu o recomandare de tranzacționare.</Text>
        <PrimaryButton label="Înapoi acasă" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgGlass,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  eyebrow: { color: colors.gold, fontSize: typography.small, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: colors.textStrong, fontSize: 30, fontWeight: "800" },
  date: { color: colors.textMuted, fontSize: typography.body },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  meta: { color: colors.textSoft, fontSize: typography.small },
  outcome: { alignSelf: "flex-start", backgroundColor: colors.bgMuted, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 7 },
  outcomeText: { color: colors.goldBright, fontSize: typography.small, fontWeight: "800" },
  sectionTitle: { color: colors.textStrong, fontSize: typography.section, fontWeight: "800", marginTop: spacing.sm },
  body: { color: colors.textSoft, fontSize: typography.body, lineHeight: 24 },
  disclaimer: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
});
