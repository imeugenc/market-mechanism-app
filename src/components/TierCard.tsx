import { Pressable, StyleSheet, Text, View } from "react-native";

import { formatCurrency } from "@/lib/format";
import { RequestTier } from "@/types/domain";
import { colors, radii, typography } from "@/theme";

export function TierCard({
  tier,
  selected,
  title,
  description,
  deliveryLabel,
  turnaround,
  onPress,
}: {
  tier: RequestTier;
  selected: boolean;
  title: string;
  description: string;
  deliveryLabel: string;
  turnaround: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]}>
      <View style={styles.topRow}>
        <View style={styles.priceWrap}>
          <Text style={styles.price}>{formatCurrency(tier)}</Text>
          <Text style={styles.turnaround}>{turnaround}</Text>
        </View>
        <View style={[styles.selectBadge, selected && styles.selectBadgeActive]}>
          <Text style={[styles.selectText, selected && styles.selectTextActive]}>
            {selected ? "Selectat" : "Alege"}
          </Text>
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.footerRow}>
        <Text style={styles.delivery}>{deliveryLabel}</Text>
        {selected ? <Text style={styles.selectedHint}>Nivel activ</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgMuted,
    padding: 18,
    gap: 12,
  },
  selected: {
    borderColor: colors.gold,
    backgroundColor: "rgba(212, 175, 55, 0.11)",
    shadowColor: colors.gold,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  priceWrap: {
    gap: 4,
  },
  price: {
    color: colors.textStrong,
    fontSize: 32,
    fontWeight: "800",
  },
  turnaround: {
    color: colors.gold,
    fontSize: typography.small,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
  },
  label: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 21,
  },
  delivery: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  selectedHint: {
    color: colors.goldBright,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  selectBadge: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bgSoft,
  },
  selectBadgeActive: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },
  selectText: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700",
  },
  selectTextActive: {
    color: "#090909",
  },
});
