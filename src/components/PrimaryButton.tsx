import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { colors, radii, typography } from "@/theme";

export function PrimaryButton({
  label,
  onPress,
  variant = "gold",
}: {
  label: string;
  onPress: () => void;
  variant?: "gold" | "ghost";
}) {
  const { width } = useWindowDimensions();
  const isCompactWeb = Platform.OS === "web" && width < 820;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrapper,
        pressed && styles.pressed,
      ]}
    >
      {variant === "gold" ? (
        <LinearGradient
          colors={[colors.goldBright, colors.gold, "#A57A16"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, styles.gold, isCompactWeb && styles.buttonCompactWeb]}
        >
          <Text style={[styles.label, styles.labelDark]}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.button, styles.ghost, isCompactWeb && styles.buttonCompactWeb]}>
          <Text style={[styles.label, styles.labelLight]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.pill,
  },
  button: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  buttonCompactWeb: {
    minHeight: 48,
    paddingHorizontal: 16,
  },
  gold: {
    borderColor: "rgba(255,255,255,0.18)",
  },
  ghost: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: colors.borderStrong,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  label: {
    fontSize: typography.body,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  labelDark: {
    color: "#050505",
  },
  labelLight: {
    color: colors.text,
  },
});
