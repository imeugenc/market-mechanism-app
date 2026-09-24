import { useEffect, useState } from "react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Image, Linking, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { ContentStatePanel } from "@/components/ContentStatePanel";
import { Screen } from "@/components/Screen";
import { fetchDailyBiasById } from "@/features/content/biases";
import { isPublishedToday } from "@/lib/contentAvailability";
import { useClientReady } from "@/hooks/useResponsiveWeb";
import { formatDate } from "@/lib/format";
import { sanitizeRemoteImageUrl } from "@/lib/media";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";
import type { DailyBias } from "@/types/domain";

type BiasLoad = { id: string; status: "loading" | "ready" | "error"; bias: DailyBias | null };

const directionColors = {
  Bullish: colors.success,
  Bearish: colors.danger,
  Neutral: colors.textStrong,
  Range: colors.goldBright,
};

const confidenceLabels = { Low: "Încredere scăzută", Medium: "Încredere medie", High: "Încredere ridicată" };

export default function BiasDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { reviews } = useAppState();
  const clientReady = useClientReady();
  const [detail, setDetail] = useState<BiasLoad>({ id: "", status: "loading", bias: null });
  useEffect(() => {
    if (!id) return;
    let active = true;
    setDetail({ id, status: "loading", bias: null });
    void fetchDailyBiasById(id).then(({ data, error }) => {
      if (active) setDetail({ id, status: error ? "error" : "ready", bias: data });
    }).catch(() => {
      if (active) setDetail({ id, status: "error", bias: null });
    });
    return () => { active = false; };
  }, [id]);

  const bias = detail.id === id ? detail.bias : null;
  const chartImage = sanitizeRemoteImageUrl(bias?.thumbnailUrl || bias?.chartImage);
  const relatedReview = reviews.find((item) => item.id === bias?.relatedReviewId);

  if (!clientReady || !id || detail.id !== id || detail.status === "loading") {
    return <Screen><Stack.Screen options={{ title: "Daily Bias" }} /><ContentStatePanel kind="loading" title="Se încarcă Daily Bias…" /></Screen>;
  }

  if (detail.status === "error") {
    return <Screen><Stack.Screen options={{ title: "Daily Bias" }} /><ContentStatePanel kind="error" title="Daily Bias nu s-a încărcat" message="Încearcă din nou peste câteva momente." /></Screen>;
  }

  if (!bias) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Bias", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }} />
        <ContentStatePanel kind="removed" title="Acest Daily Bias nu mai este disponibil" />
        <PrimaryButton label="Înapoi la piețe" onPress={() => router.replace("/(tabs)/markets")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: "Daily Bias", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }} />
      <View style={styles.card}>
        {chartImage ? <Image source={{ uri: chartImage }} style={styles.image} /> : null}
        <Text style={styles.eyebrow}>{isPublishedToday(bias.publishedAt) && bias.outcome === "Pending" ? "BIAS CURENT" : bias.outcome === "Pending" ? "BIAS RECENT" : "BIAS ISTORIC"}</Text>
        <Text style={styles.title}>{bias.market}</Text>
        <Text style={styles.date}>{formatDate(bias.tradingDate || bias.publishedAt)}</Text>
        <View style={styles.signalRow}>
          <View style={styles.biasSignal}>
            <Text style={styles.signalLabel}>BIAS</Text>
            <Text style={[styles.direction, { color: directionColors[bias.forecastedBias] }]}>{bias.forecastedBias.toUpperCase()}</Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.signalLabel}>ÎNCREDERE</Text>
            <Text style={styles.confidenceValue}>{confidenceLabels[bias.confidence]}</Text>
          </View>
        </View>
        {bias.outcome !== "Pending" ? <View style={styles.outcome}><Text style={styles.outcomeText}>Rezultat: {bias.outcome}</Text></View> : <Text style={styles.pending}>Rezultatul va fi adăugat după încheierea sesiunii.</Text>}
        <Text style={styles.sectionTitle}>Contextul notat</Text>
        <Text style={styles.body}>{bias.notes}</Text>
        {bias.liquidityTarget ? <Text style={styles.body}>Țintă de lichiditate: {bias.liquidityTarget}</Text> : null}
        {bias.tradingviewUrl ? <PrimaryButton label="Vezi graficul pe TradingView" variant="ghost" onPress={() => void Linking.openURL(bias.tradingviewUrl!)} /> : null}
        {bias.videoUrl ? <PrimaryButton label="Deschide video" onPress={() => void Linking.openURL(bias.videoUrl!)} /> : null}
        {relatedReview ? (
          <View style={styles.relatedCard}>
            <Text style={styles.relatedEyebrow}>AFTER ACTION REVIEW ASOCIAT</Text>
            <Text style={styles.relatedTitle}>{relatedReview.title}</Text>
            <PrimaryButton label="Vezi After Action Review" variant="ghost" onPress={() => router.push(`/review/${relatedReview.id}`)} />
          </View>
        ) : null}
        <Text style={styles.disclaimer}>Arhivă educațională bazată pe review-ul zilnic, nu o recomandare de tranzacționare.</Text>
        <PrimaryButton label={`Înapoi la ${bias.market}`} variant="ghost" onPress={() => router.replace(`/(tabs)/markets/${bias.market}`)} />
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
  image: {
    width: "100%",
    height: 230,
    borderRadius: radii.md,
  },
  eyebrow: { color: colors.gold, fontSize: typography.small, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: colors.textStrong, fontSize: 30, fontWeight: "800" },
  date: { color: colors.textMuted, fontSize: typography.body },
  signalRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end", gap: spacing.lg, marginVertical: spacing.xs },
  biasSignal: { gap: spacing.xs },
  signalLabel: { color: colors.textMuted, fontSize: typography.caption, fontWeight: "800" },
  direction: { fontSize: 28, fontWeight: "900" },
  confidenceBadge: { backgroundColor: colors.bgMuted, borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  confidenceValue: { color: colors.textStrong, fontSize: typography.body, fontWeight: "800" },
  outcome: { alignSelf: "flex-start", backgroundColor: colors.bgMuted, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 7 },
  outcomeText: { color: colors.goldBright, fontSize: typography.small, fontWeight: "800" },
  pending: { color: colors.textMuted, fontSize: typography.small, fontWeight: "700" },
  sectionTitle: { color: colors.textStrong, fontSize: typography.section, fontWeight: "800", marginTop: spacing.sm },
  body: { color: colors.text, fontSize: typography.body, lineHeight: 24 },
  disclaimer: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
  relatedCard: {
    backgroundColor: colors.bgMuted,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  relatedEyebrow: { color: colors.gold, fontSize: typography.small, fontWeight: "800", letterSpacing: 1 },
  relatedTitle: { color: colors.textStrong, fontSize: typography.body, fontWeight: "800" },
});
