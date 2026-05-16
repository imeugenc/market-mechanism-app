import { router } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { MARKET_DESCRIPTIONS } from "@/constants/markets";
import { Market } from "@/types/domain";
import { colors, radii, typography } from "@/theme";

export function MarketCard({ market }: { market: Market }) {
  const { width } = useWindowDimensions();
  const isCompactWeb = Platform.OS === "web" && width < 820;

  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/markets/${market}`)}
      style={({ pressed }) => [styles.card, isCompactWeb && styles.cardCompactWeb, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <Text style={styles.market}>{market}</Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>Briefing</Text>
        </View>
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
  liveBadge: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveBadgeText: {
    color: colors.gold,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
