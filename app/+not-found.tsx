import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { colors, typography } from "@/theme";

export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>Ruta nu este disponibilă</Text>
        <Text style={styles.body}>Deschiderea a ajuns într-o adresă invalidă. Revino în fluxul principal al aplicației.</Text>
        <PrimaryButton label="Mergi la Acasă" onPress={() => router.replace("/(tabs)")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  title: {
    color: colors.textStrong,
    fontSize: 26,
    fontWeight: "800",
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
