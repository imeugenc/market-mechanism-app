import { type Href, router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { DailyVideoCard } from "@/components/DailyVideoCard";
import { DailyAnalysis } from "@/types/domain";

export function ContentPreviewCard({
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
    <Pressable onPress={() => router.push((locked ? "/(tabs)/membership" : `/analysis/${item.id}`) as Href)} style={styles.wrapper}>
      <DailyVideoCard item={item} locked={locked} favorited={favorited} onToggleFavorite={onToggleFavorite} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: "hidden",
  },
});
