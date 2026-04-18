import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { DailyVideoCard } from "@/components/DailyVideoCard";
import { DailyAnalysis } from "@/types/domain";

export function ContentPreviewCard({
  item,
  locked,
}: {
  item: DailyAnalysis;
  locked?: boolean;
}) {
  return (
    <Pressable onPress={() => router.push(locked ? "/membership" : `/market/${item.market}`)} style={styles.wrapper}>
      <DailyVideoCard item={item} locked={locked} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: "hidden",
  },
});
