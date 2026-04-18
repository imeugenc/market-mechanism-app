import { Image, StyleSheet, Text, View } from "react-native";

import { AfterActionReview } from "@/types/domain";
import { formatDate } from "@/lib/format";
import { colors, radii, typography } from "@/theme";

export function ReviewCard({ item }: { item: AfterActionReview }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.chartImage }} style={styles.image} />
      <View style={styles.headerRow}>
        <Text style={styles.market}>{item.market}</Text>
        <Text style={styles.free}>ACCES GRATUIT</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.typeLine}>Review după mișcare</Text>
      <Text style={styles.body}>{item.shortText}</Text>
      <Text style={styles.date}>{formatDate(item.publishedAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgGlass,
    overflow: "hidden",
    gap: 14,
    paddingBottom: 18,
  },
  image: {
    width: "100%",
    height: 174,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  market: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  free: {
    color: colors.success,
    fontSize: typography.small,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
    paddingHorizontal: 14,
  },
  typeLine: {
    color: colors.success,
    fontSize: typography.small,
    fontWeight: "800",
    paddingHorizontal: 14,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  body: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 23,
    paddingHorizontal: 14,
  },
  date: {
    color: colors.textMuted,
    fontSize: typography.small,
    paddingHorizontal: 14,
  },
});
