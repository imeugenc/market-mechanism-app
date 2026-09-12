import { router, Stack, useLocalSearchParams } from "expo-router";
import { Image, Linking, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { ContentStatePanel } from "@/components/ContentStatePanel";
import { Screen } from "@/components/Screen";
import { isPublishedToday } from "@/lib/contentAvailability";
import { useClientReady } from "@/hooks/useResponsiveWeb";
import { formatDate } from "@/lib/format";
import { sanitizeRemoteImageUrl } from "@/lib/media";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

export default function BiasDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { dailyBiases, publicContentState, reviews } = useAppState();
  const clientReady = useClientReady();
  const bias = dailyBiases.find((item) => item.id === id);
  const chartImage = sanitizeRemoteImageUrl(bias?.chartImage);
  const relatedReview = reviews.find((item) => item.id === bias?.relatedReviewId);

  if (!clientReady || publicContentState === "loading") {
    return <Screen><ContentStatePanel kind="loading" title="Se încarcă Daily Bias…" /></Screen>;
  }

  if (publicContentState === "error") {
    return <Screen><ContentStatePanel kind="error" /></Screen>;
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
        <Text style={styles.date}>{formatDate(bias.publishedAt)}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>Bias: {bias.forecastedBias}</Text>
          <Text style={styles.meta}>Încredere: {bias.confidence}</Text>
        </View>
        {bias.outcome !== "Pending" ? <View style={styles.outcome}><Text style={styles.outcomeText}>Rezultat: {bias.outcome}</Text></View> : <Text style={styles.pending}>Rezultatul va fi adăugat după încheierea sesiunii.</Text>}
        <Text style={styles.sectionTitle}>Contextul notat</Text>
        <Text style={styles.body}>{bias.notes}</Text>
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
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  meta: { color: colors.textSoft, fontSize: typography.small },
  outcome: { alignSelf: "flex-start", backgroundColor: colors.bgMuted, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 7 },
  outcomeText: { color: colors.goldBright, fontSize: typography.small, fontWeight: "800" },
  pending: { color: colors.textMuted, fontSize: typography.small, fontWeight: "700" },
  sectionTitle: { color: colors.textStrong, fontSize: typography.section, fontWeight: "800", marginTop: spacing.sm },
  body: { color: colors.textSoft, fontSize: typography.body, lineHeight: 24 },
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
