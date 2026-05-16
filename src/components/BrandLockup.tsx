import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";

const BRAND_LOGO = require("../../assets/branding/market-mechanism-logo-full.png") as ImageSourcePropType;

type BrandLockupProps = {
  mode?: "compact" | "hero";
  align?: "left" | "center";
  showLabel?: boolean;
};

export function BrandLockup({ mode = "compact", align = "left", showLabel = false }: BrandLockupProps) {
  const isHero = mode === "hero";

  return (
    <View style={[styles.wrap, align === "center" && styles.wrapCenter]}>
      <Image
        source={BRAND_LOGO}
        style={[styles.logo, isHero ? styles.logoHero : styles.logoCompact]}
        resizeMode="contain"
      />
      {showLabel ? <Text style={[styles.kicker, align === "center" && styles.kickerCenter]}>Market Mechanism</Text> : null}
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
  logo: {
    width: "100%",
  },
  logoCompact: {
    height: 74,
    maxWidth: 238,
  },
  logoHero: {
    height: 112,
    maxWidth: 320,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: typography.caption,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  kickerCenter: {
    textAlign: "center",
  },
});
