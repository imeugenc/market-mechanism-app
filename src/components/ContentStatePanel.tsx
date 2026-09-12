import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@/components/StableIcons";

import { colors, radii, spacing, typography } from "@/theme";

type ContentStatePanelProps = {
  kind: "loading" | "empty" | "error" | "removed" | "locked";
  title?: string;
  message?: string;
  compact?: boolean;
};

const defaults = {
  loading: {
    title: "Se încarcă conținutul…",
    message: "Verificăm cele mai recente informații disponibile.",
    icon: "clock-outline" as const,
  },
  empty: {
    title: "Nu există încă conținut publicat",
    message: "Revino după următoarea actualizare.",
    icon: "text-box-outline" as const,
  },
  error: {
    title: "Nu am putut încărca conținutul",
    message: "Încearcă din nou în câteva momente.",
    icon: "alert-circle-outline" as const,
  },
  removed: {
    title: "Elementul salvat nu mai este disponibil",
    message: "Îl poți elimina în siguranță din Favorite.",
    icon: "bookmark-remove-outline" as const,
  },
  locked: {
    title: "Disponibil cu Premium",
    message: "Activează Premium pentru acces la conținutul complet.",
    icon: "lock-outline" as const,
  },
};

export function ContentStatePanel({ kind, title, message, compact = false }: ContentStatePanelProps) {
  const content = defaults[kind];

  return (
    <View style={[styles.panel, compact && styles.panelCompact]}>
      <View style={styles.iconWrap}>
        {kind === "loading" ? (
          <ActivityIndicator color={colors.gold} size="small" />
        ) : (
          <MaterialCommunityIcons name={content.icon} color={colors.gold} size={20} />
        )}
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title ?? content.title}</Text>
        <Text style={styles.message}>{message ?? content.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: "center",
    backgroundColor: colors.bgGlass,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: 18,
  },
  panelCompact: {
    borderRadius: radii.md,
    padding: 14,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  copy: { flex: 1, gap: 4 },
  title: { color: colors.textStrong, fontSize: typography.body, fontWeight: "800" },
  message: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
});
