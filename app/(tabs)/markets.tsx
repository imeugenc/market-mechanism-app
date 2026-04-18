import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { MarketCard } from "@/components/MarketCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { CORE_MARKETS } from "@/constants/markets";
import { spacing } from "@/theme";

export default function MarketsScreen() {
  return (
    <Screen>
      <SectionHeader
        eyebrow="Acoperire"
        title="Pagini dedicate pentru piețe"
        caption="Selectează rapid BTC, ETH, NQ sau ES. Fiecare piață are AAR sus, analiza zilei dedesubt și acces direct către solicitarea personalizată."
      />
      <View style={styles.marketTabs}>
        {CORE_MARKETS.map((market) => (
          <PrimaryButton key={market} label={market} variant="ghost" onPress={() => router.push(`/market/${market}`)} />
        ))}
      </View>
      <View style={styles.container}>
        {CORE_MARKETS.map((market) => (
          <MarketCard key={market} market={market} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  marketTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  container: {
    gap: spacing.sm,
  },
});
