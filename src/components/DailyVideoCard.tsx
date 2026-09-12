import { MaterialCommunityIcons } from "@/components/StableIcons";
import { BlurView } from "expo-blur";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { formatDailyLabel } from "@/lib/format";
import { isPublishedToday } from "@/lib/contentAvailability";
import { DailyAnalysis } from "@/types/domain";
import { colors, radii, typography } from "@/theme";

export function DailyVideoCard({
  item,
  locked,
  favorited,
  onToggleFavorite,
}: {
  item: DailyAnalysis;
  locked?: boolean;
  favorited?: boolean;
  onToggleFavorite?: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.playerShell}>
        <View style={styles.playerTopRow}>
          <View style={styles.playerMeta}>
            <Text style={styles.market}>{item.market}</Text>
            <Text style={styles.date}>{formatDailyLabel(item.publishedAt)}</Text>
          </View>
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
        <View style={styles.playerCenter}>
          <View style={styles.playWrap}>
            <MaterialCommunityIcons name={locked ? "lock-outline" : "play"} size={24} color={colors.gold} />
          </View>
          <Text style={styles.playerTitle}>{isPublishedToday(item.publishedAt) ? "Briefingul de astăzi" : "Briefing video"}</Text>
          <Text style={styles.playerSubtitle}>{item.title || "Briefing video zilnic"}</Text>
        </View>
        {!locked ? (
          <Pressable style={styles.videoButton} onPress={() => void Linking.openURL(item.videoUrl)}>
            <Text style={styles.videoButtonText}>Deschide video</Text>
          </Pressable>
        ) : null}
        {locked ? (
          <BlurView intensity={30} tint="dark" style={styles.lockOverlay}>
            <Text style={styles.lockTitle}>Conținut premium</Text>
            <Text style={styles.lockBody}>Conținut premium – fă upgrade pentru acces</Text>
          </BlurView>
        ) : null}
      </View>
      <Text style={styles.caption}>{item.title}</Text>
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
    gap: 12,
    paddingBottom: 16,
  },
  playerShell: {
    minHeight: 220,
    backgroundColor: "#0E0E0E",
    padding: 18,
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  playerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  playerMeta: {
    gap: 6,
  },
  market: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  date: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
  },
  playerCenter: {
    alignItems: "center",
    gap: 10,
  },
  playWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  playerTitle: {
    color: colors.textStrong,
    fontSize: typography.title,
    fontWeight: "800",
  },
  playerSubtitle: {
    color: colors.textSoft,
    fontSize: typography.body,
    textAlign: "center",
    lineHeight: 22,
  },
  videoButton: {
    alignSelf: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(212, 175, 55, 0.12)",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  videoButtonText: {
    color: colors.goldBright,
    fontSize: typography.body,
    fontWeight: "800",
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  lockTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  lockBody: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
  caption: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
    paddingHorizontal: 16,
  },
});
