import { MaterialCommunityIcons } from "@/components/StableIcons";
import { type Href, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ContentStatePanel } from "@/components/ContentStatePanel";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { sortNewest } from "@/lib/contentAvailability";
import { formatDailyLabel } from "@/lib/format";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

export function AltcoinsScreen() {
  const { altcoinPosts, membership, publicContentState } = useAppState();
  const posts = sortNewest(altcoinPosts);

  return (
    <Screen>
      <Pressable onPress={() => router.replace("/(tabs)/markets")}><Text style={styles.back}>‹ Piețe</Text></Pressable>
      <SectionHeader eyebrow="Editorial" title="Altcoins" caption="Actualizări punctuale pentru oportunități din afara BTC, ETH, NQ și ES." />
      {publicContentState === "loading" ? <ContentStatePanel kind="loading" /> : null}
      {publicContentState === "error" ? <ContentStatePanel kind="error" /> : null}
      {publicContentState === "partial" ? <ContentStatePanel kind="error" title="Fluxul Altcoins poate fi incomplet" compact /> : null}
      {publicContentState !== "loading" && publicContentState !== "error" && !posts.length ? <ContentStatePanel kind="empty" title="Nu există încă postări Altcoins" message="Prima actualizare publicată va apărea aici automat." /> : null}
      {publicContentState !== "loading" && publicContentState !== "error" ? <View style={styles.list}>{posts.map((item) => {
        const locked = item.isPremium && membership.currentPlan === "FREE";
        return <Pressable key={item.id} style={styles.card} onPress={() => router.push(`/altcoin/${item.id}` as Href)}>
          <View style={styles.top}><Text style={styles.coin}>{item.coinSymbol}</Text><Text style={styles.date}>{formatDailyLabel(item.publishedAt)}</Text></View>
          <Text style={styles.title}>{item.title}</Text><Text style={styles.summary} numberOfLines={3}>{item.summary}</Text>
          <View style={styles.footer}><View style={[styles.access, !locked && styles.accessFree]}><MaterialCommunityIcons name={locked ? "lock-outline" : "book-open-outline"} color={locked ? colors.gold : colors.success} size={15} /><Text style={[styles.accessText, !locked && styles.accessTextFree]}>{locked ? "Disponibil cu Premium" : item.isPremium ? "Premium activ" : "Acces gratuit"}</Text></View><Text style={styles.open}>Deschide ›</Text></View>
        </Pressable>;
      })}</View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.textMuted, fontSize: typography.body, fontWeight: "700" },
  list: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  card: { backgroundColor: colors.bgGlass, borderColor: colors.borderSubtle, borderRadius: radii.lg, borderWidth: 1, flexBasis: 320, flexGrow: 1, gap: spacing.sm, padding: 18 },
  top: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  coin: { color: colors.gold, fontSize: typography.small, fontWeight: "800", letterSpacing: 1.2 },
  date: { color: colors.textSoft, fontSize: typography.small },
  title: { color: colors.textStrong, fontSize: typography.section, fontWeight: "800" },
  summary: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22 },
  footer: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  access: { alignItems: "center", flexDirection: "row", gap: 6 },
  accessFree: {},
  accessText: { color: colors.gold, fontSize: typography.small, fontWeight: "700" },
  accessTextFree: { color: colors.success },
  open: { color: colors.text, fontSize: typography.small, fontWeight: "800" },
});
