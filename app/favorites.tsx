import { MaterialCommunityIcons } from "@/components/StableIcons";
import { type Href, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ContentStatePanel } from "@/components/ContentStatePanel";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

export default function FavoritesScreen() {
  const { analyses, altcoinPosts, dailyBiases, favorites, protectedDataState, publicContentState, reviews, toggleFavorite } = useAppState();
  const loading = protectedDataState === "loading" || publicContentState === "loading";

  const resolveHref = (type: (typeof favorites)[number]["contentType"], id: string): Href | null => {
    if (type === "analysis" && analyses.some((item) => item.id === id)) return `/analysis/${id}` as Href;
    if (type === "review" && reviews.some((item) => item.id === id)) return `/review/${id}` as Href;
    if (type === "altcoin" && altcoinPosts.some((item) => item.id === id)) return `/altcoin/${id}` as Href;
    return null;
  };

  return (
    <Screen webMaxWidth={860}>
      <SectionHeader eyebrow="Biblioteca ta" title="Favorite" caption="Fiecare element salvat deschide conținutul exact, nu doar piața asociată." />
      {loading ? <ContentStatePanel kind="loading" /> : null}
      {!loading && protectedDataState === "error" ? <ContentStatePanel kind="error" /> : null}
      {!loading && (protectedDataState === "partial" || publicContentState === "partial") ? <ContentStatePanel kind="error" title="Unele elemente nu s-au încărcat" message="Favoritele disponibile sunt afișate mai jos." compact /> : null}
      {!loading && protectedDataState !== "error" && !favorites.length ? <ContentStatePanel kind="empty" title="Nu ai încă elemente salvate" message="Folosește steaua de pe Bias, AAR, briefinguri sau Altcoins." /> : null}
      {!loading ? <View style={styles.list}>{favorites.map((item) => {
        const href = resolveHref(item.contentType, item.contentId);
        return <Pressable key={item.id} style={styles.row} onPress={() => href && router.push(href)}>
          <View style={styles.copy}><Text style={styles.type}>{item.contentType === "analysis" ? "BRIEFING" : item.contentType === "review" ? "AFTER ACTION REVIEW" : "ALTCOINS"}</Text><Text style={styles.title}>{item.title}</Text>{item.subtitle ? <Text style={styles.body} numberOfLines={2}>{item.subtitle}</Text> : null}{!href ? <Text style={styles.removed}>Acest element salvat nu mai este disponibil.</Text> : null}</View>
          <Pressable hitSlop={10} style={styles.remove} onPress={(event) => { event.stopPropagation(); void toggleFavorite({ contentType: item.contentType, contentId: item.contentId, title: item.title, subtitle: item.subtitle, marketLabel: item.marketLabel }); }}><MaterialCommunityIcons name="star-off-outline" color={colors.gold} size={19} /></Pressable>
          {href ? <MaterialCommunityIcons name="chevron-right" color={colors.textSoft} size={22} /> : null}
        </Pressable>;
      })}</View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { alignItems: "center", backgroundColor: colors.bgGlass, borderColor: colors.borderSubtle, borderRadius: radii.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: 15 },
  copy: { flex: 1, gap: 4 },
  type: { color: colors.gold, fontSize: typography.caption, fontWeight: "800", letterSpacing: 1.1 },
  title: { color: colors.textStrong, fontSize: typography.body, fontWeight: "800" },
  body: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
  removed: { color: colors.warning, fontSize: typography.small, fontWeight: "700" },
  remove: { alignItems: "center", backgroundColor: colors.bgMuted, borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
});
