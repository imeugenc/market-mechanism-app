import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { colors, radii, spacing, typography } from "@/theme";

type NewsSection = "macro" | "crypto";

const MACRO_CALENDAR_URL = "https://www.forexfactory.com/calendar";
const CRYPTO_CALENDAR_URL = "https://www.cryptocraft.com/calendar";

async function openExternalUrl(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert("Link indisponibil", "Nu am putut deschide browserul în mediul curent.");
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert("Link indisponibil", "Nu am putut deschide linkul extern în mediul curent.");
  }
}

function NewsActionCard({
  eyebrow,
  title,
  description,
  helper,
  buttonLabel,
  icon,
  onPress,
}: {
  eyebrow: string;
  title: string;
  description: string;
  helper: string;
  buttonLabel: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.gold} />
      </View>
      <Text style={styles.cardEyebrow}>{eyebrow}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
      <Text style={styles.cardHelper}>{helper}</Text>

      <Pressable style={styles.cardButton} onPress={onPress}>
        <Text style={styles.cardButtonLabel}>{buttonLabel}</Text>
        <MaterialCommunityIcons name="open-in-new" size={18} color="#050505" />
      </Pressable>
    </View>
  );
}

export default function NewsScreen() {
  const [section, setSection] = useState<NewsSection>("macro");

  return (
    <Screen>
      <PremiumCard>
        <Text style={styles.eyebrow}>News</Text>
        <Text style={styles.heroTitle}>Calendar rapid pentru macro și crypto.</Text>
        <Text style={styles.heroBody}>
          Secțiunea News rămâne simplă și practică: deschizi rapid calendarul relevant, fără feed-uri externe în aplicație și fără zgomot inutil.
        </Text>
      </PremiumCard>

      <View style={styles.segmentWrap}>
        <Pressable
          onPress={() => setSection("macro")}
          style={[styles.segmentButton, section === "macro" && styles.segmentButtonActive]}
        >
          {section === "macro" ? <MaterialCommunityIcons name="check-circle" size={16} color="#050505" /> : null}
          <Text style={[styles.segmentLabel, section === "macro" && styles.segmentLabelActive]}>Indici / Macro</Text>
        </Pressable>
        <Pressable
          onPress={() => setSection("crypto")}
          style={[styles.segmentButton, section === "crypto" && styles.segmentButtonActive]}
        >
          {section === "crypto" ? <MaterialCommunityIcons name="check-circle" size={16} color="#050505" /> : null}
          <Text style={[styles.segmentLabel, section === "crypto" && styles.segmentLabelActive]}>Crypto</Text>
        </Pressable>
      </View>

      <SectionHeader
        eyebrow="Acces rapid"
        title={section === "macro" ? "Indici / Macro" : "Crypto"}
        caption={
          section === "macro"
            ? "Acces direct către calendarul economic extern, într-o interfață simplă și curată."
            : "Acces direct către calendarul crypto extern, fără integrare API și fără mentenanță suplimentară."
        }
      />

      {section === "macro" ? (
        <NewsActionCard
          eyebrow="Calendar economic"
          title="Evenimente macro pentru sesiunea curentă"
          description="Folosește această secțiune pentru a verifica rapid evenimentele economice relevante înainte de sesiune sau înainte de momentele cu volatilitate ridicată."
          helper="Se deschide în browserul extern, pe Forex Factory."
          buttonLabel="Vezi calendar economic"
          icon="finance"
          onPress={() => void openExternalUrl(MACRO_CALENDAR_URL)}
        />
      ) : (
        <NewsActionCard
          eyebrow="Calendar crypto"
          title="Evenimente crypto relevante"
          description="Folosește această secțiune pentru a vedea rapid calendarul crypto extern și pentru a filtra contextul înainte de mișcările importante."
          helper="Se deschide în browserul extern, pe CryptoCraft."
          buttonLabel="Vezi calendar crypto"
          icon="bitcoin"
          onPress={() => void openExternalUrl(CRYPTO_CALENDAR_URL)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  heroTitle: {
    color: colors.textStrong,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
  },
  heroBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  segmentWrap: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  segmentButtonActive: {
    borderColor: "rgba(200,155,42,0.55)",
    backgroundColor: colors.gold,
  },
  segmentLabel: {
    color: colors.textSoft,
    fontSize: typography.body,
    fontWeight: "800",
  },
  segmentLabelActive: {
    color: "#050505",
  },
  card: {
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgPanel,
    padding: spacing.lg,
  },
  cardIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(200,155,42,0.35)",
    backgroundColor: "rgba(200,155,42,0.08)",
  },
  cardEyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  cardTitle: {
    color: colors.textStrong,
    fontSize: typography.title,
    fontWeight: "800",
  },
  cardDescription: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  cardHelper: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 19,
  },
  cardButton: {
    marginTop: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  cardButtonLabel: {
    color: "#050505",
    fontSize: typography.body,
    fontWeight: "800",
  },
});
