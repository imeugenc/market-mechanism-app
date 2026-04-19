import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";

import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { formatDate } from "@/lib/format";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

export function AltcoinsScreen() {
  const { altcoinPosts, favorites, membership, toggleFavorite } = useAppState();

  return (
    <Screen>
      <PremiumCard>
        <Text style={styles.eyebrow}>Altcoins</Text>
        <Text style={styles.title}>Update-uri oportuniste integrate sub Piețe</Text>
        <Text style={styles.body}>
          Aici apar postările ocazionale pe altcoins. Creatorul le poate publica separat din Admin, fără să amestece fluxul principal BTC, ETH, NQ și ES.
        </Text>
      </PremiumCard>

      <SectionHeader
        eyebrow="Flux"
        title="Postări Altcoins"
        caption="Actualizări punctuale, observații scurte și video-uri dedicate pentru monede în afara piețelor principale."
      />

      <View style={styles.list}>
        {altcoinPosts.length ? (
          altcoinPosts.map((item) => {
            const locked = item.isPremium && membership.currentPlan === "FREE";
            const favorited = favorites.some((favorite) => favorite.contentType === "altcoin" && favorite.contentId === item.id);

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.headerRow}>
                  <Text style={styles.coin}>{item.coinSymbol}</Text>
                  <Text style={styles.date}>{formatDate(item.publishedAt)}</Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.summary ? <Text style={styles.summary}>{item.summary}</Text> : null}
                <Text style={styles.bodyText}>{item.bodyText}</Text>
                <View style={styles.actions}>
                  <PrimaryButton
                    label={favorited ? "Scoate din Favorite" : "Adaugă la Favorite"}
                    variant="ghost"
                    onPress={() =>
                      void toggleFavorite({
                        contentType: "altcoin",
                        contentId: item.id,
                        title: item.title,
                        subtitle: item.summary,
                        marketLabel: item.coinSymbol,
                      }).then((result) => {
                        Alert.alert(result.success ? "Favorite actualizate" : "Actualizare eșuată", result.message);
                      })
                    }
                  />
                  {item.videoUrl && !locked ? (
                    <PrimaryButton label="Deschide video" onPress={() => void Linking.openURL(item.videoUrl!)} />
                  ) : null}
                </View>
                {locked ? (
                  <BlurView intensity={22} tint="dark" style={styles.lockedOverlay}>
                    <Text style={styles.lockedTitle}>Conținut premium</Text>
                    <Text style={styles.lockedBody}>Deblochează Premium pentru acces la această postare Altcoins.</Text>
                  </BlurView>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nu există încă postări Altcoins</Text>
            <Text style={styles.emptyBody}>După ce publici prima postare din Admin, ea va apărea aici automat.</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  title: {
    color: colors.textStrong,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: 12,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  coin: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  date: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  cardTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  summary: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.sm,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  lockedTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  lockedBody: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
  emptyCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
