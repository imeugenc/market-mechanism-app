import { StyleSheet, Text, View } from "react-native";

import { colors, radii, typography } from "@/theme";

export function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    minWidth: 100,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgGlass,
    padding: 16,
    gap: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    fontWeight: "700",
  },
  value: {
    color: colors.textStrong,
    fontSize: 21,
    fontWeight: "800",
  },
});
