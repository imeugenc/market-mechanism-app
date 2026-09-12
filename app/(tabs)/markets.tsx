import { router } from "expo-router";
import { MaterialCommunityIcons } from "@/components/StableIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ContentStatePanel } from "@/components/ContentStatePanel";
import { MarketCard } from "@/components/MarketCard";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { CORE_MARKETS } from "@/constants/markets";
import { sortNewest } from "@/lib/contentAvailability";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

export default function MarketsScreen() {
  const { analyses, dailyBiases, publicContentState, reviews } = useAppState();

  return (
    <Screen>
      <SectionHeader eyebrow="Piețe" title="Context pe instrument" caption="Alege piața o singură dată, apoi vezi separat conținutul curent și istoricul." />
      {publicContentState === "loading" ? <ContentStatePanel kind="loading" /> : null}
      {publicContentState === "error" ? <ContentStatePanel kind="error" /> : null}
      {publicContentState === "partial" ? <ContentStatePanel kind="error" title="Unele piețe nu s-au încărcat" message="Poți folosi în continuare conținutul disponibil." compact /> : null}
      {publicContentState !== "loading" && publicContentState !== "error" ? (
        <View style={styles.grid}>
          {CORE_MARKETS.map((market) => {
            const newest = sortNewest([...analyses.filter((item) => item.market === market), ...dailyBiases.filter((item) => item.market === market), ...reviews.filter((item) => item.market === market)])[0];
            return <MarketCard key={market} market={market} latestPublishedAt={newest?.publishedAt} />;
          })}
        </View>
      ) : null}

      <Pressable style={styles.altcoinCard} onPress={() => router.push("/(tabs)/markets/altcoins")}>
        <View style={styles.altcoinIcon}><MaterialCommunityIcons name="chart-bubble" color={colors.gold} size={22} /></View>
        <View style={styles.copy}><Text style={styles.eyebrow}>EDITORIAL</Text><Text style={styles.title}>Altcoins</Text><Text style={styles.body}>Actualizări oportuniste, separate de fluxul piețelor principale.</Text></View>
        <MaterialCommunityIcons name="chevron-right" color={colors.textSoft} size={24} />
      </Pressable>

      <Pressable style={styles.calendarCard} onPress={() => router.push("/(tabs)/news")}>
        <MaterialCommunityIcons name="calendar-clock-outline" color={colors.gold} size={21} />
        <View style={styles.copy}><Text style={styles.title}>Calendare de piață</Text><Text style={styles.body}>Evenimente macro și crypto în browser.</Text></View>
        <MaterialCommunityIcons name="open-in-new" color={colors.textSoft} size={18} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  altcoinCard: { alignItems: "center", backgroundColor: "rgba(212,175,55,0.045)", borderColor: colors.borderStrong, borderRadius: radii.lg, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: 18 },
  altcoinIcon: { alignItems: "center", backgroundColor: colors.bgMuted, borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  copy: { flex: 1, gap: 4 },
  eyebrow: { color: colors.gold, fontSize: typography.caption, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: colors.textStrong, fontSize: typography.section, fontWeight: "800" },
  body: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
  calendarCard: { alignItems: "center", backgroundColor: colors.bgGlass, borderColor: colors.borderSubtle, borderRadius: radii.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: 15 },
});
