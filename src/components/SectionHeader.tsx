import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme";

export function SectionHeader({
  eyebrow,
  title,
  caption,
}: {
  eyebrow?: string;
  title: string;
  caption?: string;
}) {
  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontWeight: "800",
  },
  title: {
    color: colors.textStrong,
    fontSize: typography.title,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  caption: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
    maxWidth: 620,
  },
});
