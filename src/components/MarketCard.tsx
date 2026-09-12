import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MARKET_DESCRIPTIONS } from "@/constants/markets";
import { formatDate } from "@/lib/format";
import { Market } from "@/types/domain";
import { colors, radii, typography } from "@/theme";
import { useResponsiveWeb } from "@/hooks/useResponsiveWeb";

export function MarketCard({ market, latestPublishedAt }: { market: Market; latestPublishedAt?: string }) {
  const { isCompactWeb } = useResponsiveWeb();

  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/markets/${market}`)}
      style={({ pressed }) => [styles.card, isCompactWeb && styles.cardCompactWeb, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <Text style={styles.market}>{market}</Text>
        <Text style={styles.status}>{latestPublishedAt ? `Ultima actualizare · ${formatDate(latestPublishedAt)}` : "Fără conținut publicat încă"}</Text>
      </View>
      <Text style={styles.description}>{MARKET_DESCRIPTIONS[market]}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Deschide piața</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: 260,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgGlass,
    padding: 20,
    gap: 14,
  },
  cardCompactWeb: {
    padding: 16,
    gap: 12,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.992 }],
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  market: {
    color: colors.textStrong,
    fontSize: typography.title,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  status: {
    color: colors.textSoft,
    fontSize: typography.caption,
    fontWeight: "700",
    maxWidth: 150,
    textAlign: "right",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
