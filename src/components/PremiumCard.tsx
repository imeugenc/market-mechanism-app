import { PropsWithChildren } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { colors, radii, shadows } from "@/theme";
import { useResponsiveWeb } from "@/hooks/useResponsiveWeb";

export function PremiumCard({ children }: PropsWithChildren) {
  const { isCompactWeb } = useResponsiveWeb();

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
