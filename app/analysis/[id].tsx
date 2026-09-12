import { type Href, router, Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ContentStatePanel } from "@/components/ContentStatePanel";
import { DailyVideoCard } from "@/components/DailyVideoCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { canAccessPremiumContent } from "@/features/content/access";
import { formatDailyLabel } from "@/lib/format";
import { useClientReady } from "@/hooks/useResponsiveWeb";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

export default function AnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { analyses, favorites, membership, publicContentState, toggleFavorite, trackView } = useAppState();
  const clientReady = useClientReady();
  const item = analyses.find((analysis) => analysis.id === id);

  if (!clientReady || publicContentState === "loading") return <Screen><ContentStatePanel kind="loading" /></Screen>;
  if (publicContentState === "error") return <Screen><ContentStatePanel kind="error" /></Screen>;
  if (!item) return <Screen><ContentStatePanel kind="removed" /><PrimaryButton label="Înapoi la Favorite" onPress={() => router.replace("/favorites" as Href)} /></Screen>;

  const locked = !canAccessPremiumContent(membership.currentPlan, item);
  return (
    <Screen webMaxWidth={860}>
      <Stack.Screen options={{ title: `${item.market} · Briefing` }} />
      <View style={styles.header}><Text style={styles.eyebrow}>{item.market} · BRIEFING</Text><Text style={styles.title}>{item.title}</Text><Text style={styles.date}>{formatDailyLabel(item.publishedAt)}</Text>{item.summary ? <Text style={styles.body}>{item.summary}</Text> : null}</View>
      <DailyVideoCard item={item} locked={locked} favorited={favorites.some((favorite) => favorite.contentType === "analysis" && favorite.contentId === item.id)} onToggleFavorite={() => void toggleFavorite({ contentType: "analysis", contentId: item.id, title: item.title, subtitle: item.summary, marketLabel: item.market })} />
      {locked ? <PrimaryButton label="Vezi opțiunile Premium" onPress={() => router.push("/(tabs)/membership")} /> : <PrimaryButton label="Marchează ca vizualizat" variant="ghost" onPress={() => trackView(true)} />}
      <PrimaryButton label={`Înapoi la ${item.market}`} variant="ghost" onPress={() => router.replace(`/(tabs)/markets/${item.market}`)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.bgGlass, borderColor: colors.borderSubtle, borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: 18 },
  eyebrow: { color: colors.gold, fontSize: typography.small, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: colors.textStrong, fontSize: 28, fontWeight: "800" },
  date: { color: colors.textMuted, fontSize: typography.small },
  body: { color: colors.textSoft, fontSize: typography.body, lineHeight: 23 },
});
