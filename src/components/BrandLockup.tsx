import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";
import { useResponsiveWeb } from "@/hooks/useResponsiveWeb";

const BRAND_MARK = require("../../assets/branding/market-mechanism-mark.png") as ImageSourcePropType;

type BrandLockupProps = {
  mode?: "compact" | "hero";
  align?: "left" | "center";
};

export function BrandLockup({ mode = "compact", align = "left" }: BrandLockupProps) {
  const { isCompactWeb } = useResponsiveWeb();
  const isHero = mode === "hero";

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
          style={[styles.mark, isHero ? styles.markHero : styles.markCompact, align === "center" && styles.markCenter]}
          resizeMode="contain"
        />
        {isHero ? (
          <Text style={[styles.submark, align === "center" && styles.wordmarkCenter]}>
            Trading clarity. Structured execution.
          </Text>
        ) : null}
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
    alignItems: "flex-start",
    maxWidth: 280,
  },
  lockupHero: {
    alignItems: "center",
    maxWidth: 420,
    gap: spacing.sm,
  },
  lockupCompactWeb: {
    maxWidth: 320,
  },
  lockupCenter: {
    alignItems: "center",
  },
  mark: {
    width: 96,
    height: 96,
  },
  markCompact: {
    width: 82,
    height: 82,
  },
  markHero: {
    width: 192,
    height: 192,
  },
  submark: {
    color: colors.textMuted,
    fontSize: typography.small,
    letterSpacing: 0.4,
    fontWeight: "600",
  },
  markCenter: {
    alignSelf: "center",
  },
  wordmarkCenter: {
    textAlign: "center",
  },
});
