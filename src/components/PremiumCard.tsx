import { PropsWithChildren } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";

import { colors, radii, shadows } from "@/theme";

export function PremiumCard({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const isCompactWeb = Platform.OS === "web" && width < 820;

  return (
    <LinearGradient
      colors={["rgba(230, 200, 105, 0.2)", "rgba(22, 22, 22, 0.98)", "rgba(8, 8, 8, 0.99)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.outer}
    >
      <View style={[styles.inner, isCompactWeb && styles.innerCompactWeb]}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radii.xl,
    padding: 1,
    ...shadows.card,
    ...shadows.glow,
  },
  inner: {
    borderRadius: radii.xl,
    backgroundColor: colors.bgPanel,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  innerCompactWeb: {
    padding: 18,
    gap: 14,
  },
});
