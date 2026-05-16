import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { BrandLockup } from "@/components/BrandLockup";
import { ContentPreviewCard } from "@/components/ContentPreviewCard";
import { MarketCard } from "@/components/MarketCard";
import { MetricPill } from "@/components/MetricPill";
import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ReviewCard } from "@/components/ReviewCard";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { CORE_MARKETS } from "@/constants/markets";
import { groupReviewsByDate, isPremiumLocked, latestAnalysisByMarket } from "@/features/content/access";
import { displayPlan, displayRank } from "@/lib/display";
import { formatDailyLabel } from "@/lib/format";
import { useAppState } from "@/providers/AppProvider";
import { colors, spacing, typography } from "@/theme";

const ONBOARDING_STORAGE_KEY = "execution-edge:onboarding-complete";

export default function HomeScreen() {
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const { analyses, favorites, reviews, membership, toggleFavorite, user } = useAppState();
  const latestPerMarket = latestAnalysisByMarket(analyses);
  const todayLabel = latestPerMarket[0] ? formatDailyLabel(latestPerMarket[0].publishedAt) : "";
  const premiumLocked = membership.currentPlan === "FREE";
  const featuredPremium = latestPerMarket[0];
  const compactPremiumItems = latestPerMarket.slice(1);
  const visibleReviews = [...reviews].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  const reviewGroups = groupReviewsByDate(visibleReviews);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);

      if (cancelled) {
        return;
      }

      setHasCompletedOnboarding(stored === "true");
      setOnboardingReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!onboardingReady || hasCompletedOnboarding) {
      return;
    }

    router.replace("/onboarding");
  }, [hasCompletedOnboarding, onboardingReady]);

  if (!onboardingReady) {
    return (
      <Screen scroll={false}>
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.gold} />
          <Text style={styles.loadingText}>Se pregătește ecranul principal…</Text>
        </View>
      </Screen>
    );
  }

  if (!hasCompletedOnboarding) {
    return null;
  }

  return (
    <Screen>
      <PremiumCard>
        <BrandLockup mode="hero" align="center" />
        <Text style={styles.heroTitle}>Sistem zilnic de briefing pentru traderi disciplinați.</Text>
        <Text style={styles.heroBody}>
          Gratuit vezi After Action Review. Premium deblochează briefingul video zilnic.
        </Text>
        <View style={styles.heroStrip}>
          <Text style={styles.heroStripText}>BTC • ETH • NQ • ES</Text>
          <Text style={styles.heroStripText}>Briefing zilnic</Text>
        </View>
        <View style={styles.metricRow}>
          <MetricPill label="Plan" value={displayPlan(membership.currentPlan)} />
          <MetricPill label="Rang" value={displayRank(membership.currentRank)} />
          <MetricPill label="Streak" value={`${membership.loginStreak} zile`} />
        </View>
        <View style={styles.valueGrid}>
          <View style={[styles.valueCard, styles.valueCardPremium]}>
            <Text style={styles.valueEyebrow}>Premium</Text>
            <Text style={styles.valueTitle}>Analiza de azi</Text>
            <Text style={styles.valueBody}>
              Briefingul video zilnic, clar și structurat, pentru piețele principale.
            </Text>
          </View>
          <View style={styles.valueCard}>
            <Text style={[styles.valueEyebrow, styles.valueEyebrowFree]}>Gratuit</Text>
            <Text style={styles.valueTitle}>After Action Review</Text>
            <Text style={styles.valueBody}>
              Review-uri publice după mișcare, cu chart și explicație scurtă.
            </Text>
          </View>
        </View>
        <View style={styles.buttonRow}>
          <PrimaryButton label="Deblochează Premium" onPress={() => router.push("/(tabs)/membership")} />
          {user?.isAdmin ? (
            <PrimaryButton label="Consolă creator" variant="ghost" onPress={() => router.push("/admin")} />
          ) : null}
        </View>
      </PremiumCard>

      <SectionHeader
        eyebrow="ACCES GRATUIT"
        title="After Action Review"
        caption="Aici începe valoarea gratuită: review-uri publice, ușor de scanat, cu chart, piață, dată și ideea principală."
      />
      <View style={styles.freeBanner}>
        <Text style={styles.freeBannerTitle}>Conținut gratuit, clar și util</Text>
        <Text style={styles.freeBannerBody}>
          Aici vezi recapitulările publice după mișcare. Briefingul zilnic rămâne Premium, dar review-urile gratuite sunt mereu la vedere.
        </Text>
      </View>
      {reviewGroups.length ? reviewGroups.map((group) => (
        <View key={group.dateKey} style={styles.reviewGroup}>
          <Text style={styles.reviewGroupTitle}>{formatDailyLabel(group.reviews[0].publishedAt)}</Text>
          {group.reviews.map((review) => (
            <ReviewCard
              key={review.id}
              item={review}
              favorited={favorites.some((item) => item.contentType === "review" && item.contentId === review.id)}
              onToggleFavorite={() =>
                void toggleFavorite({
                  contentType: "review",
                  contentId: review.id,
                  title: review.title,
                  subtitle: review.shortText,
                  marketLabel: review.market,
                })
              }
            />
          ))}
        </View>
      )) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nu există încă review-uri publicate</Text>
          <Text style={styles.emptyBody}>
            După publicarea primului After Action Review, această secțiune va afișa automat chartul, piața și explicația scurtă.
          </Text>
        </View>
      )}

      <SectionHeader
        eyebrow="Analiza de azi"
        title={todayLabel || "Briefingurile curente Premium"}
        caption="Conținutul Premium al zilei este vizibil aici. Utilizatorii Gratuit îl văd blocat, membrii Premium îl deschid complet."
      />
      {premiumLocked ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Conținut Premium blocat</Text>
          <Text style={styles.bannerBody}>
            Utilizatorii GRATUIT văd review-urile după mișcare. Deblochează Premium pentru briefingurile video zilnice.
          </Text>
        </View>
      ) : null}
      {featuredPremium ? (
        <ContentPreviewCard
          key={featuredPremium.id}
          item={featuredPremium}
          locked={isPremiumLocked(membership.currentPlan, featuredPremium)}
          favorited={favorites.some((item) => item.contentType === "analysis" && item.contentId === featuredPremium.id)}
          onToggleFavorite={() =>
            void toggleFavorite({
              contentType: "analysis",
              contentId: featuredPremium.id,
              title: featuredPremium.title,
              subtitle: "Analiza de azi",
              marketLabel: featuredPremium.market,
            })
          }
        />
      ) : null}
      {compactPremiumItems.length ? (
        <View style={styles.compactPremiumGrid}>
          {compactPremiumItems.map((item) => (
            <View key={item.id} style={styles.compactPremiumCard}>
              <View style={styles.compactPremiumTopRow}>
                <Text style={styles.compactPremiumMarket}>{item.market}</Text>
                <Text style={styles.compactPremiumStatus}>
                  {isPremiumLocked(membership.currentPlan, item) ? "Blocat" : "Live"}
                </Text>
              </View>
              <Text style={styles.compactPremiumTitle}>{item.title}</Text>
              <Text style={styles.compactPremiumDate}>{formatDailyLabel(item.publishedAt)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <SectionHeader
        eyebrow="Piețe"
        title="Piețe urmărite"
        caption="Fiecare piață are o pagină dedicată cu briefinguri video grupate pe zile."
      />
      <View style={styles.grid}>
        {CORE_MARKETS.map((market) => (
          <MarketCard key={market} market={market} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroTitle: {
    color: colors.textStrong,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
  },
  heroBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  heroStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroStripText: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  valueGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  valueCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
    padding: 14,
    gap: 4,
  },
  valueCardPremium: {
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  valueEyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  valueEyebrowFree: {
    color: colors.success,
  },
  valueTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  valueBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  loadingCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  compactPremiumGrid: {
    gap: spacing.sm,
  },
  compactPremiumCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgGlass,
    padding: 16,
    gap: 8,
  },
  compactPremiumTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  compactPremiumMarket: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  compactPremiumStatus: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  compactPremiumTitle: {
    color: colors.textStrong,
    fontSize: typography.body,
    fontWeight: "800",
  },
  compactPremiumDate: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  grid: {
    gap: spacing.md,
  },
  reviewGroup: {
    gap: spacing.sm,
  },
  reviewGroupTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  banner: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(212, 175, 55, 0.06)",
    padding: 18,
    gap: 8,
  },
  bannerTitle: {
    color: colors.gold,
    fontSize: typography.caption,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  bannerBody: {
    color: colors.textStrong,
    fontSize: typography.body,
    lineHeight: 22,
  },
  freeBanner: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: 8,
  },
  freeBannerTitle: {
    color: colors.success,
    fontSize: typography.caption,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  freeBannerBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  emptyCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
