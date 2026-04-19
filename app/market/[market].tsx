import { Redirect, useLocalSearchParams } from "expo-router";

export default function LegacyMarketRedirect() {
  const { market } = useLocalSearchParams<{ market?: string }>();

  if (!market) {
    return <Redirect href="/(tabs)/markets" />;
  }

  return <Redirect href={`/(tabs)/markets/${market}`} />;
}
