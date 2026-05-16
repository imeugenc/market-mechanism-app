import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";

const BRAND_LOGO = require("../../assets/branding/market-mechanism-logo.jpg") as ImageSourcePropType;

type BrandLockupProps = {
  mode?: "compact" | "hero";
  align?: "left" | "center";
};

export function BrandLockup({ mode = "compact", align = "left" }: BrandLockupProps) {
  const isHero = mode === "hero";

  return (
    <View style={[styles.wrap, align === "center" && styles.wrapCenter]}>
      <Image
        source={BRAND_LOGO}
        style={[styles.logo, isHero ? styles.logoHero : styles.logoCompact]}
        resizeMode="contain"
      />
      <Text style={[styles.kicker, align === "center" && styles.kickerCenter]}>Market Mechanism</Text>
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
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#050505",
  },
  logoCompact: {
    height: 60,
    maxWidth: 210,
  },
  logoHero: {
    height: 78,
    maxWidth: 260,
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
