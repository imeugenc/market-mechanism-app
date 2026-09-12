import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { type Href, router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { ContentStatePanel } from "@/components/ContentStatePanel";
import { DailyVideoCard } from "@/components/DailyVideoCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ReviewCard } from "@/components/ReviewCard";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { CORE_MARKETS } from "@/constants/markets";
import { canAccessPremiumContent } from "@/features/content/access";
import { isPublishedToday, sortNewest } from "@/lib/contentAvailability";
import { displayPlan } from "@/lib/display";
import { formatDailyLabel } from "@/lib/format";
import { useClientReady } from "@/hooks/useResponsiveWeb";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";
import { Market } from "@/types/domain";

type MarketView = "current" | "history";

export function MarketDetailScreen() {
  const { market } = useLocalSearchParams<{ market?: string }>();
  const { analyses, dailyBiases, favorites, membership, publicContentState, reviews, toggleFavorite, trackView } = useAppState();
  const [view, setView] = useState<MarketView>("current");
  const clientReady = useClientReady();
  const normalizedMarket = (market ?? "").trim().toUpperCase() as Market;
  const isValidMarket = CORE_MARKETS.includes(normalizedMarket);

  if (!clientReady) {
    return <Screen><ContentStatePanel kind="loading" title="Se încarcă piața…" /></Screen>;
  }

  if (!isValidMarket) {
    return <Screen><Stack.Screen options={{ title: "Piață", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }} /><ContentStatePanel kind="empty" title="Piața nu a fost găsită" message="Verifică simbolul și revino la lista piețelor." /><PrimaryButton label="Înapoi la piețe" onPress={() => router.replace("/(tabs)/markets")} /></Screen>;
  }

  const marketAnalyses = sortNewest(analyses.filter((item) => item.market === normalizedMarket));
  const marketReviews = sortNewest(reviews.filter((item) => item.market === normalizedMarket));
  const marketBiases = sortNewest(dailyBiases.filter((item) => item.market === normalizedMarket));
  const todayAnalysis = marketAnalyses.find((item) => isPublishedToday(item.publishedAt));
  const todayBias = marketBiases.find((item) => isPublishedToday(item.publishedAt));
  const latestAnalysis = marketAnalyses[0];
  const latestBias = marketBiases[0];
  const latestReview = marketReviews[0];
  const hasAnyContent = Boolean(latestAnalysis || latestBias || latestReview);
  const contentReady = publicContentState === "ready" || publicContentState === "partial";

  const toggleItemFavorite = (input: { contentType: "analysis" | "review"; contentId: string; title: string; subtitle?: string }) => {
    void toggleFavorite({ ...input, marketLabel: normalizedMarket }).then((result) => {
      Alert.alert(result.success ? "Favorite actualizate" : "Actualizare eșuată", result.message);
    });
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: normalizedMarket, headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/(tabs)/markets")}><Text style={styles.back}>‹ Piețe</Text></Pressable>
        <View style={styles.headerMain}><Text style={styles.market}>{normalizedMarket}</Text><Text style={styles.title}>Context de piață</Text></View>
        <View style={styles.plan}><Text style={styles.planText}>{displayPlan(membership.currentPlan)}</Text></View>
      </View>

      <SegmentedControl value={view} options={[{ value: "current", label: "Curent" }, { value: "history", label: "Istoric" }]} onChange={setView} />

      {publicContentState === "loading" ? <ContentStatePanel kind="loading" title={`Se încarcă ${normalizedMarket}…`} /> : null}
      {publicContentState === "error" ? <ContentStatePanel kind="error" /> : null}
      {publicContentState === "partial" ? <ContentStatePanel kind="error" title="O parte din conținut nu s-a încărcat" message="Datele disponibile pentru această piață sunt afișate mai jos." compact /> : null}
      {contentReady && !hasAnyContent ? <ContentStatePanel kind="empty" title={`Nu există încă conținut publicat pentru ${normalizedMarket}`} message="Piața rămâne disponibilă. Conținutul va apărea după prima publicare." /> : null}

      {contentReady && hasAnyContent && view === "current" ? (
        <>
          {!todayAnalysis && !todayBias ? <ContentStatePanel kind="empty" title="Niciun briefing sau Bias publicat astăzi" message={latestAnalysis || latestBias ? `Cel mai recent conținut rămâne disponibil în Istoric.` : "Revino după următoarea publicare."} compact /> : null}

          <SectionHeader eyebrow="Daily Bias" title={todayBias ? "Bias-ul curent" : "Cel mai recent Bias"} />
          {(todayBias ?? latestBias) ? (
            <Pressable style={styles.biasCard} onPress={() => router.push(`/bias/${(todayBias ?? latestBias)!.id}` as Href)}>
              <View style={styles.row}><Text style={styles.biasDirection}>{(todayBias ?? latestBias)!.forecastedBias}</Text><Text style={styles.date}>{formatDailyLabel((todayBias ?? latestBias)!.publishedAt)}</Text></View>
              <Text style={styles.biasConfidence}>{(todayBias ?? latestBias)!.confidence} confidence</Text>
              <Text style={styles.body} numberOfLines={3}>{(todayBias ?? latestBias)!.notes}</Text>
              <Text style={styles.outcome}>{(todayBias ?? latestBias)!.outcome === "Pending" ? "Rezultat în așteptare" : `Rezultat: ${(todayBias ?? latestBias)!.outcome}`}</Text>
            </Pressable>
          ) : <ContentStatePanel kind="empty" title={`Nu există încă Daily Bias pentru ${normalizedMarket}`} compact />}

          <SectionHeader eyebrow="Briefing" title={todayAnalysis ? "Briefing publicat astăzi" : "Ultimul briefing disponibil"} />
          {(todayAnalysis ?? latestAnalysis) ? (
            <View style={styles.videoWrap}>
              <DailyVideoCard item={(todayAnalysis ?? latestAnalysis)!} locked={!canAccessPremiumContent(membership.currentPlan, (todayAnalysis ?? latestAnalysis)!)} favorited={favorites.some((item) => item.contentType === "analysis" && item.contentId === (todayAnalysis ?? latestAnalysis)!.id)} onToggleFavorite={() => toggleItemFavorite({ contentType: "analysis", contentId: (todayAnalysis ?? latestAnalysis)!.id, title: (todayAnalysis ?? latestAnalysis)!.title, subtitle: "Briefing video" })} />
              {!canAccessPremiumContent(membership.currentPlan, (todayAnalysis ?? latestAnalysis)!) ? <PrimaryButton label="Vezi opțiunile Premium" onPress={() => router.push("/(tabs)/membership")} /> : <PrimaryButton label="Marchează ca vizualizat" variant="ghost" onPress={() => trackView(true)} />}
            </View>
          ) : <ContentStatePanel kind="empty" title="Niciun briefing publicat încă" compact />}

          <SectionHeader eyebrow="Educație gratuită" title="Ultimul After Action Review" />
          {latestReview ? <ReviewCard item={latestReview} favorited={favorites.some((item) => item.contentType === "review" && item.contentId === latestReview.id)} onToggleFavorite={() => toggleItemFavorite({ contentType: "review", contentId: latestReview.id, title: latestReview.title, subtitle: latestReview.shortText })} /> : <ContentStatePanel kind="empty" title={`Nu există încă un AAR pentru ${normalizedMarket}`} compact />}
        </>
      ) : null}

      {contentReady && hasAnyContent && view === "history" ? (
        <>
          <SectionHeader eyebrow="Istoric" title="Daily Bias" />
          {marketBiases.length ? <View style={styles.list}>{marketBiases.map((bias) => <Pressable key={bias.id} style={styles.historyRow} onPress={() => router.push(`/bias/${bias.id}` as Href)}><View style={styles.row}><Text style={styles.historyTitle}>{bias.forecastedBias} · {bias.confidence}</Text><Text style={styles.date}>{formatDailyLabel(bias.publishedAt)}</Text></View><Text style={styles.body} numberOfLines={2}>{bias.notes}</Text><Text style={styles.outcome}>{bias.outcome === "Pending" ? "Rezultat în așteptare" : bias.outcome}</Text></Pressable>)}</View> : <ContentStatePanel kind="empty" title="Nu există Bias-uri istorice" compact />}
          <SectionHeader eyebrow="Istoric" title="After Action Review" />
          {marketReviews.length ? <View style={styles.list}>{marketReviews.map((review) => <ReviewCard key={review.id} item={review} favorited={favorites.some((item) => item.contentType === "review" && item.contentId === review.id)} onToggleFavorite={() => toggleItemFavorite({ contentType: "review", contentId: review.id, title: review.title, subtitle: review.shortText })} />)}</View> : <ContentStatePanel kind="empty" title="Nu există AAR-uri istorice" compact />}
          <SectionHeader eyebrow="Istoric Premium" title="Briefinguri video" />
          {marketAnalyses.length ? <View style={styles.list}>{marketAnalyses.map((item) => <DailyVideoCard key={item.id} item={item} locked={!canAccessPremiumContent(membership.currentPlan, item)} favorited={favorites.some((favorite) => favorite.contentType === "analysis" && favorite.contentId === item.id)} onToggleFavorite={() => toggleItemFavorite({ contentType: "analysis", contentId: item.id, title: item.title, subtitle: "Briefing video" })} />)}</View> : <ContentStatePanel kind="empty" title="Nu există briefinguri istorice" compact />}
        </>
      ) : null}

      <View style={styles.privateCard}>
        <View style={styles.privateCopy}><Text style={styles.privateTitle}>Ai nevoie de o analiză personală?</Text><Text style={styles.body}>Trimite o cerere separată pentru un activ sau setup specific.</Text></View>
        <PrimaryButton label="Solicită analiză" onPress={() => router.push("/(tabs)/requests")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  back: { color: colors.textMuted, fontSize: typography.body, fontWeight: "700" },
  headerMain: { flex: 1, minWidth: 150 },
  market: { color: colors.gold, fontSize: typography.small, fontWeight: "800", letterSpacing: 1.5 },
  title: { color: colors.textStrong, fontSize: 30, fontWeight: "800" },
  plan: { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  planText: { color: colors.textMuted, fontSize: typography.small, fontWeight: "800" },
  biasCard: { backgroundColor: "rgba(212,175,55,0.045)", borderColor: colors.borderStrong, borderRadius: radii.lg, borderWidth: 1, gap: 8, padding: 18 },
  biasDirection: { color: colors.textStrong, fontSize: typography.title, fontWeight: "800" },
  biasConfidence: { color: colors.gold, fontSize: typography.small, fontWeight: "800" },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  date: { color: colors.textSoft, fontSize: typography.small },
  body: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22 },
  outcome: { color: colors.textSoft, fontSize: typography.small, fontWeight: "700" },
  videoWrap: { gap: spacing.sm },
  list: { gap: spacing.sm },
  historyRow: { backgroundColor: colors.bgGlass, borderColor: colors.borderSubtle, borderRadius: radii.md, borderWidth: 1, gap: 7, padding: 15 },
  historyTitle: { color: colors.textStrong, fontSize: typography.body, fontWeight: "800" },
  privateCard: { alignItems: "center", backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle, borderRadius: radii.lg, borderWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "space-between", padding: 18 },
  privateCopy: { flex: 1, gap: 5, minWidth: 220 },
  privateTitle: { color: colors.textStrong, fontSize: typography.section, fontWeight: "800" },
});
