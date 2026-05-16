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
        <View style={[styles.markWrap, isHero ? styles.markWrapHero : styles.markWrapCompact]}>
          <Image
            source={BRAND_MARK}
            style={[styles.mark, isHero ? styles.markHero : styles.markCompact]}
            resizeMode="contain"
          />
        </View>
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
  markWrap: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  markWrapCompact: {
    width: 64,
    height: 64,
    padding: 10,
  },
  markWrapHero: {
    width: 96,
    height: 96,
    padding: 14,
  },
  mark: {
    width: "100%",
    height: "100%",
  },
  markCompact: {
    maxWidth: 38,
    maxHeight: 38,
  },
  markHero: {
    maxWidth: 62,
    maxHeight: 62,
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
    fontSize: 20,
    letterSpacing: 2.8,
    lineHeight: 24,
  },
  wordmarkHero: {
    fontSize: 28,
    letterSpacing: 4.2,
    lineHeight: 32,
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
