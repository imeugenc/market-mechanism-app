import { PropsWithChildren, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@/components/StableIcons";

import { colors, radii, spacing, typography } from "@/theme";

type CollapsibleSectionProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
  caption?: string;
  defaultOpen?: boolean;
  rightLabel?: string;
}>;

export function CollapsibleSection({
  title,
  eyebrow,
  caption,
  defaultOpen = false,
  rightLabel,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.header} onPress={() => setOpen((prev) => !prev)}>
        <View style={styles.headerText}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </View>
        <View style={styles.metaWrap}>
          {rightLabel ? <Text style={styles.meta}>{rightLabel}</Text> : null}
          <MaterialCommunityIcons
            name={open ? "chevron-up" : "chevron-down"}
            size={22}
            color={colors.gold}
          />
        </View>
      </Pressable>
      {open ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgPanel,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.bgMuted,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "800",
  },
  title: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  caption: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 20,
  },
  metaWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
  },
  content: {
    padding: 16,
    gap: spacing.sm,
  },
});
