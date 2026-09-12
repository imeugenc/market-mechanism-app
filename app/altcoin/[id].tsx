import { Image, Linking, StyleSheet, Text, View } from "react-native";
import { type Href, router, Stack, useLocalSearchParams } from "expo-router";

import { ContentStatePanel } from "@/components/ContentStatePanel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { formatDailyLabel } from "@/lib/format";
import { useClientReady } from "@/hooks/useResponsiveWeb";
import { sanitizeRemoteImageUrl } from "@/lib/media";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

export default function AltcoinDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { altcoinPosts, favorites, membership, publicContentState, toggleFavorite } = useAppState();
  const clientReady = useClientReady();
  const item = altcoinPosts.find((post) => post.id === id);

  if (!clientReady || publicContentState === "loading") return <Screen><ContentStatePanel kind="loading" /></Screen>;
  if (publicContentState === "error") return <Screen><ContentStatePanel kind="error" /></Screen>;
  if (!item) return <Screen><ContentStatePanel kind="removed" /><PrimaryButton label="Înapoi la Favorite" onPress={() => router.replace("/favorites" as Href)} /></Screen>;

  const locked = item.isPremium && membership.currentPlan === "FREE";
  const image = sanitizeRemoteImageUrl(item.chartImage);
  return (
    <Screen webMaxWidth={860}>
      <Stack.Screen options={{ title: item.coinSymbol }} />
      <View style={styles.card}>
        {image ? <Image source={{ uri: image }} style={styles.image} /> : null}
        <Text style={styles.eyebrow}>{item.coinSymbol} · {item.isPremium ? "PREMIUM" : "ACCES GRATUIT"}</Text>
        <Text style={styles.title}>{item.title}</Text><Text style={styles.date}>{formatDailyLabel(item.publishedAt)}</Text>
        <Text style={styles.summary}>{item.summary}</Text>
        {locked ? <ContentStatePanel kind="locked" message="Poți vedea rezumatul; analiza completă este disponibilă cu Premium." /> : <Text style={styles.body}>{item.bodyText}</Text>}
        {!locked && item.videoUrl ? <PrimaryButton label="Deschide video" onPress={() => void Linking.openURL(item.videoUrl!)} /> : null}
        <PrimaryButton label={favorites.some((favorite) => favorite.contentType === "altcoin" && favorite.contentId === item.id) ? "Scoate din Favorite" : "Adaugă la Favorite"} variant="ghost" onPress={() => void toggleFavorite({ contentType: "altcoin", contentId: item.id, title: item.title, subtitle: item.summary, marketLabel: item.coinSymbol })} />
      </View>
      {locked ? <PrimaryButton label="Vezi opțiunile Premium" onPress={() => router.push("/(tabs)/membership")} /> : null}
      <PrimaryButton label="Înapoi la Altcoins" variant="ghost" onPress={() => router.replace("/(tabs)/markets/altcoins")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.bgGlass, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, overflow: "hidden", padding: spacing.lg },
  image: { borderRadius: radii.md, height: 260, width: "100%" },
  eyebrow: { color: colors.gold, fontSize: typography.small, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: colors.textStrong, fontSize: 30, fontWeight: "800" },
  date: { color: colors.textMuted, fontSize: typography.small },
  summary: { color: colors.text, fontSize: typography.section, lineHeight: 26 },
  body: { color: colors.textSoft, fontSize: typography.body, lineHeight: 24 },
});
