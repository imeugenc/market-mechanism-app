import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

type Segment<T extends string> = { label: string; value: T };

export function SegmentedControl<T extends string>({ value, options, onChange }: { value: T; options: Segment<T>[]; onChange: (value: T) => void }) {
  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(option.value)} style={[styles.button, selected && styles.buttonSelected]}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: "flex-start", backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle, borderRadius: radii.pill, borderWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, padding: 5 },
  button: { borderRadius: radii.pill, paddingHorizontal: 15, paddingVertical: 10 },
  buttonSelected: { backgroundColor: colors.gold },
  label: { color: colors.textMuted, fontSize: typography.small, fontWeight: "800" },
  labelSelected: { color: colors.bgDeep },
});
