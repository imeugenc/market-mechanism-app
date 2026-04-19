import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { fetchMemberProfileView, MemberProfileView } from "@/features/auth/member-profile";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAppState();
  const [member, setMember] = useState<MemberProfileView | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    void fetchMemberProfileView(id).then((result) => {
      if (result.error || !result.data) {
        setError(result.error?.message ?? "Profilul nu este disponibil.");
        return;
      }

      setMember(result.data);
    });
  }, [id]);

  return (
    <Screen>
      <Stack.Screen options={{ title: "Profil utilizator", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }} />

      {!member ? (
        <PremiumCard>
          <Text style={styles.title}>{error || "Se încarcă profilul..."}</Text>
        </PremiumCard>
      ) : (
        <>
          <PremiumCard>
            <Text style={styles.eyebrow}>{member.isAdmin ? "Creator" : "Membru"}</Text>
            <Text style={styles.title}>{member.displayName}</Text>
            <Text style={styles.meta}>
              {member.isAdmin ? "OWNER / CREATOR" : member.currentPlan === "PRO" ? "Premium" : "Gratuit"} • {member.currentRank}
            </Text>
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Plan</Text>
                <Text style={styles.metricValue}>{member.isAdmin ? "OWNER" : member.currentPlan}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Scor</Text>
                <Text style={styles.metricValue}>{String(member.score)}</Text>
              </View>
            </View>
          </PremiumCard>

          <SectionHeader eyebrow="Profil" title="Despre mine" />
          <View style={styles.card}>
            <Text style={styles.line}>Bio: {member.bio || "Nespecificat"}</Text>
            <Text style={styles.line}>Experiență: {member.tradingExperience || "Nespecificat"}</Text>
            <Text style={styles.line}>Piețe: {member.tradedMarkets || "Nespecificat"}</Text>
            <Text style={styles.line}>Stil: {member.tradingStyle || "Nespecificat"}</Text>
            <Text style={styles.line}>Sesiuni: {member.preferredSessions || "Nespecificat"}</Text>
            <Text style={styles.line}>Setups: {member.focusedSetups || "Nespecificat"}</Text>
            <Text style={styles.line}>Obiectiv: {member.currentGoal || "Nespecificat"}</Text>
            {user?.isAdmin ? <Text style={styles.line}>Email: {member.email}</Text> : null}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "800",
  },
  title: {
    color: colors.textStrong,
    fontSize: typography.title,
    fontWeight: "800",
  },
  meta: {
    color: colors.textSoft,
    fontSize: typography.body,
  },
  metrics: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgGlass,
    padding: 14,
    gap: 6,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metricValue: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: spacing.sm,
  },
  line: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
