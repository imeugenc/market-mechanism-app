import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { type Href, router, Stack, useLocalSearchParams } from "expo-router";

import { DailyVideoCard } from "@/components/DailyVideoCard";
import { MetricPill } from "@/components/MetricPill";
import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ReviewCard } from "@/components/ReviewCard";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { displayPlan } from "@/lib/display";
import { canAccessPremiumContent, groupAnalysesByDate, groupReviewsByDate } from "@/features/content/access";
import { formatDailyLabel } from "@/lib/format";
import { sanitizeRemoteImageUrl } from "@/lib/media";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";
import { CORE_MARKETS } from "@/constants/markets";
import { Market } from "@/types/domain";

export function MarketDetailScreen() {
  const { market } = useLocalSearchParams<{ market?: string }>();
  const { analyses, dailyBiases, favorites, membership, reviews, toggleFavorite, trackView } = useAppState();
  const normalizedMarket = (market ?? "").trim().toUpperCase() as Market;
  const isValidMarket = CORE_MARKETS.includes(normalizedMarket);

  if (!isValidMarket) {
    return (
      <Screen>
        <Stack.Screen
          options={{
            title: "Piață",
            headerBackTitle: "",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <SectionHeader title="Piața nu a fost găsită" caption="Verifică simbolul pieței și încearcă din nou." />
      </Screen>
    );
  }

  const marketAnalyses = analyses
    .filter((item) => item.market === normalizedMarket)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const marketReviews = reviews.filter((item) => item.market === normalizedMarket);
  const marketBiases = dailyBiases
    .filter((item) => item.market === normalizedMarket)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const reviewGroups = groupReviewsByDate(marketReviews);
  const grouped = groupAnalysesByDate(marketAnalyses);
  const latest = marketAnalyses[0];

  if (!latest && !marketReviews.length && !marketBiases.length) {
    return (
      <Screen>
        <Stack.Screen
          options={{
            title: normalizedMarket,
            headerBackTitle: "",
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <SectionHeader title="Piață indisponibilă" caption="Nu există încă briefinguri pentru această piață." />
      </Screen>
    );
  }

  const locked = latest ? !canAccessPremiumContent(membership.currentPlan, latest) : membership.currentPlan === "FREE";

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: normalizedMarket,
          headerBackTitle: "",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <PremiumCard>
        <PrimaryButton label="Înapoi la piețe" variant="ghost" onPress={() => router.push("/(tabs)/markets")} />
        <Text style={styles.market}>{normalizedMarket}</Text>
        <Text style={styles.title}>Sistem de briefing zilnic</Text>
        <Text style={styles.summary}>
          Briefingurile sunt grupate pe zile și ordonate cu cele mai noi primele. Fiecare zi conține video-ul principal publicat pentru piața selectată.
        </Text>
        <View style={styles.heroBand}>
          <Text style={styles.heroBandText}>{locked ? "Acces Premium necesar" : "Briefing activ"}</Text>
          <Text style={styles.heroBandText}>{latest ? formatDailyLabel(latest.publishedAt) : "Fără video astăzi"}</Text>
        </View>
        <View style={styles.metrics}>
          <MetricPill label="Plan" value={displayPlan(membership.currentPlan)} />
          <MetricPill label="Piață" value={normalizedMarket} />
          <MetricPill label="Ultimul update" value={latest ? formatDailyLabel(latest.publishedAt) : "Indisponibil"} />
        </View>
        <View style={styles.actions}>
          <PrimaryButton
            label={locked ? "Deblochează Premium" : "Marchează vizualizare"}
            onPress={() => {
              if (locked) {
                router.push("/(tabs)/membership");
                return;
              }
              trackView(true);
            }}
          />
          <PrimaryButton label="Solicită analiză" variant="ghost" onPress={() => router.push("/(tabs)/requests")} />
        </View>
      </PremiumCard>

      <SectionHeader
        eyebrow="Daily Bias"
        title={`Contextul zilei • ${normalizedMarket}`}
        caption="Istoricul este separat pe piață. Deschide fiecare intrare pentru contextul complet și rezultatul review-ului."
      />
      {marketBiases.length ? (
        <View style={styles.biasList}>
          {marketBiases.slice(0, 8).map((bias) => (
            <Pressable key={bias.id} style={styles.biasCard} onPress={() => router.push(`/bias/${bias.id}` as Href)}>
              {sanitizeRemoteImageUrl(bias.chartImage) ? <Image source={{ uri: sanitizeRemoteImageUrl(bias.chartImage) }} style={styles.biasImage} /> : null}
              <View style={styles.biasTopRow}>
                <Text style={styles.biasDate}>{formatDailyLabel(bias.publishedAt)}</Text>
                <Text style={styles.biasOutcome}>{bias.outcome}</Text>
              </View>
              <Text style={styles.biasTitle}>{bias.forecastedBias} · {bias.confidence} confidence</Text>
              <Text style={styles.biasNotes} numberOfLines={2}>{bias.notes}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Nu există încă Daily Bias pentru {normalizedMarket}</Text>
          <Text style={styles.infoBody}>Când publici un bias pentru această piață din Consola Creator, acesta apare aici automat.</Text>
        </View>
      )}

      <SectionHeader
        eyebrow="GRATUIT"
        title={`After Action Review • ${normalizedMarket}`}
        caption="Primele elemente din pagină sunt review-urile publice după mișcare, disponibile pentru toți utilizatorii."
      />
      {reviewGroups.length ? (
        reviewGroups.map((group) => (
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
                  }).then((result) => {
                    Alert.alert(result.success ? "Favorite actualizate" : "Actualizare eșuată", result.message);
                  })
                }
              />
            ))}
          </View>
        ))
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Nu există încă review-uri pentru această piață</Text>
          <Text style={styles.infoBody}>
            După publicarea unui nou After Action Review, acesta va apărea aici primul, înaintea briefingului Premium.
          </Text>
        </View>
      )}

      <SectionHeader
        eyebrow="Premium"
        title={`Analiza de azi • ${normalizedMarket}`}
        caption="Aici apare briefingul video zilnic pentru piața selectată. Utilizatorii Free îl văd blocat, membrii Premium îl deschid complet."
      />
      {grouped.length ? (
        grouped.map((group) => (
          <View key={group.dateKey} style={styles.dayBlock}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayEyebrow}>Zi de analiză</Text>
              <Text style={styles.dayTitle}>{formatDailyLabel(group.analyses[0].publishedAt)}</Text>
            </View>

            {group.analyses.map((item) => {
              const itemLocked = !canAccessPremiumContent(membership.currentPlan, item);

              return (
                <View key={item.id} style={styles.videoCard}>
                  <DailyVideoCard
                    item={item}
                    locked={itemLocked}
                    favorited={favorites.some((favorite) => favorite.contentType === "analysis" && favorite.contentId === item.id)}
                    onToggleFavorite={() =>
                      void toggleFavorite({
                        contentType: "analysis",
                        contentId: item.id,
                        title: item.title,
                        subtitle: "Analiza de azi",
                        marketLabel: item.market,
                      }).then((result) => {
                        Alert.alert(result.success ? "Favorite actualizate" : "Actualizare eșuată", result.message);
                      })
                    }
                  />
                  <View style={styles.videoActions}>
                    <PrimaryButton
                      label={itemLocked ? "Deblochează analiza zilnică" : "Marchează vizualizare"}
                      onPress={() => {
                        if (itemLocked) {
                          router.push("/(tabs)/membership");
                          return;
                        }
                        trackView(true);
                      }}
                      variant={itemLocked ? "gold" : "ghost"}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ))
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Nu există încă analiză video pentru azi</Text>
          <Text style={styles.infoBody}>După publicarea unui briefing nou, acesta va apărea aici automat, grupat pe data curentă.</Text>
        </View>
      )}

      <SectionHeader
        eyebrow="Custom"
        title="Solicită analiză personalizată"
        caption="Dacă vrei o analiză separată pentru un alt activ, poți deschide direct fluxul de cerere personalizată."
      />
      <View style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>Ai nevoie de context suplimentar?</Text>
        <Text style={styles.ctaBody}>
          Trimite o cerere pentru altcoin sau pentru un setup specific. Plata se confirmă manual, iar livrarea începe după confirmare.
        </Text>
        <PrimaryButton label="Deschide Analize personale" onPress={() => router.push("/(tabs)/requests")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  market: {
    color: colors.gold,
    fontSize: typography.small,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  title: {
    color: colors.textStrong,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
  },
  summary: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  heroBand: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroBandText: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
  biasList: {
    gap: spacing.sm,
  },
  biasCard: {
    backgroundColor: colors.bgGlass,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 7,
    padding: 16,
  },
  biasImage: {
    width: "100%",
    height: 170,
    borderRadius: radii.md,
  },
  biasTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  biasDate: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "800",
  },
  biasOutcome: {
    color: colors.success,
    fontSize: typography.small,
    fontWeight: "800",
  },
  biasTitle: {
    color: colors.textStrong,
    fontSize: typography.body,
    fontWeight: "800",
  },
  biasNotes: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 19,
  },
  dayBlock: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: spacing.md,
  },
  dayHeader: {
    gap: 4,
  },
  dayEyebrow: {
    color: colors.gold,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  dayTitle: {
    color: colors.textStrong,
    fontSize: typography.title,
    fontWeight: "800",
  },
  videoCard: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
  },
  videoActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: spacing.sm,
  },
  infoTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  infoBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  ctaCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgGlass,
    padding: 18,
    gap: spacing.sm,
  },
  ctaTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  ctaBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  reviewGroup: {
    gap: spacing.sm,
  },
  reviewGroupTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
});
