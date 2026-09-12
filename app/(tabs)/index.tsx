import { type Href, router } from "expo-router";
import { MaterialCommunityIcons } from "@/components/StableIcons";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BrandLockup } from "@/components/BrandLockup";
import { ContentStatePanel } from "@/components/ContentStatePanel";
import { MarketCard } from "@/components/MarketCard";
import { MetricPill } from "@/components/MetricPill";
import { ReviewCard } from "@/components/ReviewCard";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { CORE_MARKETS } from "@/constants/markets";
import { isPremiumLocked, latestAnalysisByMarket } from "@/features/content/access";
import { isPublishedToday, sortNewest } from "@/lib/contentAvailability";
import { displayPlan, displayRank } from "@/lib/display";
import { formatDailyLabel } from "@/lib/format";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

export default function HomeScreen() {
  const {
    analyses, dailyBiases, favorites, hasCompletedOnboarding, membership, onboardingReady,
    publicContentState, reviews, toggleFavorite, user,
  } = useAppState();
  const latestBiases = sortNewest(dailyBiases).slice(0, 4);
  const latestReview = sortNewest(reviews)[0];
  const latestBriefing = latestAnalysisByMarket(analyses)[0];

  useEffect(() => {
    if (onboardingReady && !hasCompletedOnboarding) router.replace("/onboarding");
  }, [hasCompletedOnboarding, onboardingReady]);

  if (!onboardingReady || !hasCompletedOnboarding) {
    return !onboardingReady ? <Screen scroll={false}><ContentStatePanel kind="loading" title="Se pregătește aplicația…" /></Screen> : null;
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <BrandLockup />
        <View style={styles.planBadge}><Text style={styles.planText}>{displayPlan(membership.currentPlan)}</Text></View>
      </View>

      <View style={styles.welcome}>
        <Text style={styles.eyebrow}>PANOU DE SESIUNE</Text>
        <Text style={styles.welcomeTitle}>{user?.name ? `Salut, ${user.name}` : "Claritate înainte de execuție"}</Text>
        <Text style={styles.welcomeBody}>Cele mai recente Bias-uri, review-uri și briefinguri, fără zgomot inutil.</Text>
      </View>

      {publicContentState === "loading" ? <ContentStatePanel kind="loading" /> : null}
      {publicContentState === "error" ? <ContentStatePanel kind="error" /> : null}
      {publicContentState === "partial" ? <ContentStatePanel kind="error" title="O parte din conținut nu s-a încărcat" message="Conținutul disponibil este afișat mai jos." compact /> : null}

      {publicContentState !== "loading" && publicContentState !== "error" ? (
        <>
          <SectionHeader eyebrow="Acum" title="Context recent" />
          <View style={styles.focusGrid}>
            <Pressable style={[styles.focusCard, styles.focusCardPrimary]} onPress={() => latestBiases[0] && router.push(`/bias/${latestBiases[0].id}` as Href)}>
              <View style={styles.focusTop}><MaterialCommunityIcons name="crosshairs-gps" color={colors.gold} size={20} /><Text style={styles.focusMeta}>{latestBiases[0]?.market ?? "DAILY BIAS"}</Text></View>
              <Text style={styles.focusTitle}>{latestBiases[0] ? `${latestBiases[0].forecastedBias} · ${latestBiases[0].confidence}` : "Niciun Daily Bias publicat"}</Text>
              <Text style={styles.focusBody}>{latestBiases[0] ? formatDailyLabel(latestBiases[0].publishedAt) : "Primul Bias publicat va apărea aici."}</Text>
            </Pressable>
            <Pressable style={styles.focusCard} onPress={() => latestReview && router.push(`/review/${latestReview.id}` as Href)}>
              <View style={styles.focusTop}><MaterialCommunityIcons name="school-outline" color={colors.success} size={20} /><Text style={styles.focusMeta}>AAR GRATUIT</Text></View>
              <Text style={styles.focusTitle}>{latestReview?.title ?? "Niciun AAR disponibil încă"}</Text>
              <Text style={styles.focusBody}>{latestReview ? `${latestReview.market} · ${formatDailyLabel(latestReview.publishedAt)}` : "Review-urile publice vor apărea aici."}</Text>
            </Pressable>
            <Pressable style={styles.focusCard} onPress={() => latestBriefing && router.push(isPremiumLocked(membership.currentPlan, latestBriefing) ? "/(tabs)/membership" : `/(tabs)/markets/${latestBriefing.market}`)}>
              <View style={styles.focusTop}><MaterialCommunityIcons name="play-circle-outline" color={colors.goldBright} size={20} /><Text style={styles.focusMeta}>BRIEFING PREMIUM</Text></View>
              <Text style={styles.focusTitle}>{latestBriefing?.title ?? "Niciun briefing publicat"}</Text>
              <Text style={styles.focusBody}>{latestBriefing ? `${latestBriefing.market} · ${isPublishedToday(latestBriefing.publishedAt) ? "Publicat astăzi" : `Ultimul: ${formatDailyLabel(latestBriefing.publishedAt)}`}` : "Nu există încă un briefing disponibil."}</Text>
            </Pressable>
          </View>

          <View style={styles.utilityRow}>
            <Pressable style={styles.utility} onPress={() => router.push("/(tabs)/news")}><MaterialCommunityIcons name="calendar-clock" color={colors.gold} size={20} /><View><Text style={styles.utilityTitle}>Calendare</Text><Text style={styles.utilityText}>Macro și crypto</Text></View></Pressable>
            <Pressable style={styles.utility} onPress={() => router.push("/favorites" as Href)}><MaterialCommunityIcons name="star-outline" color={colors.gold} size={20} /><View><Text style={styles.utilityTitle}>Favorite</Text><Text style={styles.utilityText}>{favorites.length} elemente salvate</Text></View></Pressable>
          </View>

          <SectionHeader eyebrow="Piețe" title="Acces rapid" caption="Un singur punct de intrare pentru contextul curent și istoric." />
          <View style={styles.marketGrid}>
            {CORE_MARKETS.map((market) => {
              const newest = sortNewest([...analyses.filter((item) => item.market === market), ...dailyBiases.filter((item) => item.market === market), ...reviews.filter((item) => item.market === market)])[0];
              return <MarketCard key={market} market={market} latestPublishedAt={newest?.publishedAt} />;
            })}
          </View>

          <SectionHeader eyebrow="Daily Bias" title="Cele mai recente" caption="Direcție, încredere și rezultat păstrate în contextul fiecărei piețe." />
          {latestBiases.length ? <View style={styles.list}>{latestBiases.map((bias) => (
            <Pressable key={bias.id} style={styles.rowCard} onPress={() => router.push(`/bias/${bias.id}` as Href)}>
              <View style={styles.rowTop}><Text style={styles.rowMarket}>{bias.market}</Text><Text style={styles.rowDate}>{formatDailyLabel(bias.publishedAt)}</Text></View>
              <Text style={styles.rowTitle}>{bias.forecastedBias} · {bias.confidence}</Text>
              <Text style={styles.rowBody} numberOfLines={2}>{bias.notes}</Text>
              <Text style={styles.rowOutcome}>{bias.outcome === "Pending" ? "Rezultat în așteptare" : `Rezultat: ${bias.outcome}`}</Text>
            </Pressable>
          ))}</View> : <ContentStatePanel kind="empty" title="Nu există încă Daily Bias publicat" />}

          <SectionHeader eyebrow="Educație gratuită" title="Ultimul After Action Review" />
          {latestReview ? <ReviewCard item={latestReview} favorited={favorites.some((item) => item.contentType === "review" && item.contentId === latestReview.id)} onToggleFavorite={() => void toggleFavorite({ contentType: "review", contentId: latestReview.id, title: latestReview.title, subtitle: latestReview.shortText, marketLabel: latestReview.market })} /> : <ContentStatePanel kind="empty" title="Nu există încă un AAR disponibil" message="Primul review public va apărea aici automat." />}
        </>
      ) : null}

      <View style={styles.progressCard}>
        <View><Text style={styles.progressEyebrow}>PROGRES</Text><Text style={styles.progressTitle}>{displayRank(membership.currentRank)}</Text></View>
        <View style={styles.metrics}><MetricPill label="Streak" value={`${membership.loginStreak} zile`} /><MetricPill label="Scor" value={`${membership.score}`} /></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  planBadge: { backgroundColor: "rgba(212,175,55,0.08)", borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  planText: { color: colors.gold, fontSize: typography.small, fontWeight: "800" },
  welcome: { borderLeftColor: colors.gold, borderLeftWidth: 2, gap: 6, paddingLeft: 16 },
  eyebrow: { color: colors.gold, fontSize: typography.caption, fontWeight: "800", letterSpacing: 1.5 },
  welcomeTitle: { color: colors.textStrong, fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  welcomeBody: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22 },
  focusGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  focusCard: { backgroundColor: colors.bgGlass, borderColor: colors.borderSubtle, borderRadius: radii.lg, borderWidth: 1, flex: 1, gap: 10, minWidth: 240, padding: 18 },
  focusCardPrimary: { borderColor: colors.borderStrong, backgroundColor: "rgba(212,175,55,0.045)" },
  focusTop: { alignItems: "center", flexDirection: "row", gap: 8 },
  focusMeta: { color: colors.textMuted, fontSize: typography.caption, fontWeight: "800", letterSpacing: 1.1 },
  focusTitle: { color: colors.textStrong, fontSize: typography.section, fontWeight: "800" },
  focusBody: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
  utilityRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  utility: { alignItems: "center", backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle, borderRadius: radii.md, borderWidth: 1, flex: 1, flexDirection: "row", gap: 12, minWidth: 210, padding: 14 },
  utilityTitle: { color: colors.textStrong, fontSize: typography.body, fontWeight: "800" },
  utilityText: { color: colors.textMuted, fontSize: typography.small },
  marketGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  list: { gap: spacing.sm },
  rowCard: { backgroundColor: colors.bgGlass, borderColor: colors.borderSubtle, borderRadius: radii.md, borderWidth: 1, gap: 7, padding: 16 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  rowMarket: { color: colors.gold, fontSize: typography.small, fontWeight: "800" },
  rowDate: { color: colors.textSoft, fontSize: typography.small },
  rowTitle: { color: colors.textStrong, fontSize: typography.body, fontWeight: "800" },
  rowBody: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
  rowOutcome: { color: colors.textSoft, fontSize: typography.small, fontWeight: "700" },
  progressCard: { alignItems: "center", backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle, borderRadius: radii.lg, borderWidth: 1, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: spacing.sm, padding: 18 },
  progressEyebrow: { color: colors.textSoft, fontSize: typography.caption, fontWeight: "800", letterSpacing: 1.2 },
  progressTitle: { color: colors.textStrong, fontSize: typography.section, fontWeight: "800" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
