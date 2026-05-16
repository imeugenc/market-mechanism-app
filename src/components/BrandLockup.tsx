import { Image, ImageSourcePropType, Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { colors, spacing, typography } from "@/theme";

const BRAND_MARK = require("../../assets/branding/market-mechanism-mark.png") as ImageSourcePropType;

type BrandLockupProps = {
  mode?: "compact" | "hero";
  align?: "left" | "center";
};

export function BrandLockup({ mode = "compact", align = "left" }: BrandLockupProps) {
  const { width } = useWindowDimensions();
  const isHero = mode === "hero";
  const isCompactWeb = Platform.OS === "web" && width < 820;

  return (
    <View style={[styles.wrap, align === "center" && styles.wrapCenter]}>
      <View
        style={[
          styles.lockup,
          isHero ? styles.lockupHero : styles.lockupCompact,
          isCompactWeb && styles.lockupCompactWeb,
          align === "center" && styles.lockupCenter,
        ]}
      >
        <Image
          source={BRAND_MARK}
          style={[styles.mark, isHero ? styles.markHero : styles.markCompact]}
          resizeMode="contain"
        />
        <View style={[styles.wordmarkWrap, align === "center" && styles.wordmarkWrapCenter]}>
          <Text style={[styles.wordmark, isHero ? styles.wordmarkHero : styles.wordmarkCompact, align === "center" && styles.wordmarkCenter]}>
            Market Mechanism
          </Text>
          <Text style={[styles.submark, align === "center" && styles.wordmarkCenter]}>
            Trading clarity. Structured execution.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  wrapCenter: {
    alignItems: "center",
  },
  lockup: {
    width: "100%",
    gap: spacing.sm,
  },
  lockupCompact: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 320,
  },
  lockupHero: {
    alignItems: "center",
    maxWidth: 420,
    gap: spacing.md,
  },
  lockupCompactWeb: {
    maxWidth: 360,
  },
  lockupCenter: {
    alignItems: "center",
  },
  mark: {
    width: 72,
    height: 72,
  },
  markCompact: {
    width: 72,
    height: 72,
  },
  markHero: {
    width: 132,
    height: 132,
  },
  wordmarkWrap: {
    gap: 4,
    flexShrink: 1,
  },
  wordmarkWrapCenter: {
    alignItems: "center",
  },
  wordmark: {
    color: colors.textStrong,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  wordmarkCompact: {
    fontSize: 19,
    letterSpacing: 2.6,
    lineHeight: 24,
  },
  wordmarkHero: {
    fontSize: 24,
    letterSpacing: 5.2,
    lineHeight: 30,
  },
  submark: {
    color: colors.textMuted,
    fontSize: typography.small,
    letterSpacing: 0.4,
    fontWeight: "600",
  },
  wordmarkCenter: {
    textAlign: "center",
  },
});
