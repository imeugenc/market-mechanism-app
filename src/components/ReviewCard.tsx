import { Pressable, Image, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { AfterActionReview } from "@/types/domain";
import { formatDate } from "@/lib/format";
import { sanitizeRemoteImageUrl } from "@/lib/media";
import { colors, radii, typography } from "@/theme";

export function ReviewCard({
  item,
  favorited,
  onToggleFavorite,
}: {
  item: AfterActionReview;
  favorited?: boolean;
  onToggleFavorite?: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/review/${item.id}`)}>
      <Image source={{ uri: sanitizeRemoteImageUrl(item.chartImage) }} style={styles.image} />
      <View style={styles.headerRow}>
        <Text style={styles.market}>{item.market}</Text>
        <View style={styles.headerActions}>
          <Text style={styles.free}>ACCES GRATUIT</Text>
          {onToggleFavorite ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation?.();
                onToggleFavorite();
              }}
              hitSlop={10}
              style={styles.favoriteButton}
            >
              <MaterialCommunityIcons
                name={favorited ? "star" : "star-outline"}
                size={20}
                color={favorited ? colors.goldBright : colors.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.typeLine}>Review după mișcare</Text>
      <Text style={styles.body}>{item.shortText}</Text>
      <Text style={styles.date}>{formatDate(item.publishedAt)}</Text>
    </Pressable>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  favoriteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
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
