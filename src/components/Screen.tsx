import { PropsWithChildren, RefObject } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "@/theme";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  webMaxWidth?: number;
  scrollRef?: RefObject<ScrollView | null>;
}>;

export function Screen({ children, scroll = true, webMaxWidth = 1120, scrollRef }: ScreenProps) {
  const { width } = useWindowDimensions();
  const isCompactWeb = Platform.OS === "web" && width < 820;

  const content = (
    <View
      style={[
        styles.content,
        Platform.OS === "web" && styles.contentWeb,
        isCompactWeb && styles.contentCompactWeb,
        Platform.OS === "web" ? { maxWidth: webMaxWidth } : null,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[colors.bgDeep, colors.bg, "#0C0B08"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.gradient}
      >
        {scroll ? <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  gradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  contentWeb: {
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: spacing.xl,
  },
  contentCompactWeb: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + 64,
    gap: spacing.lg,
  },
});
