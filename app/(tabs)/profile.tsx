import { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { rankDescriptions } from "@/features/profile/ranks";
import { MetricPill } from "@/components/MetricPill";
import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { displayRank } from "@/lib/display";
import { useAppState } from "@/providers/AppProvider";
import { colors, spacing, typography } from "@/theme";

export default function ProfileScreen() {
  const { authReady, membership, requests, session, signOut, updateProfileAbout, user } = useAppState();
  const sessionUser = session?.user ?? null;
  const hasSession = Boolean(sessionUser);
  const displayName = user?.name ?? sessionUser?.email?.split("@")[0] ?? "Vizitator";
  const displayEmail = user?.email ?? sessionUser?.email ?? "Nu ești autentificat";
  const savedMarketsLabel = user?.savedMarkets.length ? user.savedMarkets.join(", ") : "Nicio piață salvată";
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [aboutName, setAboutName] = useState(displayName);
  const [bio, setBio] = useState(user?.bio ?? "");
  const [tradingExperience, setTradingExperience] = useState(user?.tradingExperience ?? "");
  const [tradedMarkets, setTradedMarkets] = useState(user?.tradedMarkets ?? "");
  const [tradingStyle, setTradingStyle] = useState(user?.tradingStyle ?? "");
  const [preferredSessions, setPreferredSessions] = useState(user?.preferredSessions ?? "");
  const [focusedSetups, setFocusedSetups] = useState(user?.focusedSetups ?? "");
  const [currentGoal, setCurrentGoal] = useState(user?.currentGoal ?? "");
  const [visibleToMembers, setVisibleToMembers] = useState(user?.memberProfileVisibility === "members");

  useEffect(() => {
    setAboutName(displayName);
    setBio(user?.bio ?? "");
    setTradingExperience(user?.tradingExperience ?? "");
    setTradedMarkets(user?.tradedMarkets ?? "");
    setTradingStyle(user?.tradingStyle ?? "");
    setPreferredSessions(user?.preferredSessions ?? "");
    setFocusedSetups(user?.focusedSetups ?? "");
    setCurrentGoal(user?.currentGoal ?? "");
    setVisibleToMembers(user?.memberProfileVisibility === "members");
  }, [
    displayName,
    user?.bio,
    user?.currentGoal,
    user?.focusedSetups,
    user?.memberProfileVisibility,
    user?.preferredSessions,
    user?.tradedMarkets,
    user?.tradingExperience,
    user?.tradingStyle,
  ]);

  const hasAboutContent = Boolean(
    user?.bio ||
      user?.tradingExperience ||
      user?.tradedMarkets ||
      user?.tradingStyle ||
      user?.preferredSessions ||
      user?.focusedSetups ||
      user?.currentGoal,
  );

  const saveAboutSection = async () => {
    await updateProfileAbout({
      displayName: aboutName.trim() || displayName,
      bio: bio.trim(),
      tradingExperience: tradingExperience.trim(),
      tradedMarkets: tradedMarkets.trim(),
      tradingStyle: tradingStyle.trim(),
      preferredSessions: preferredSessions.trim(),
      focusedSetups: focusedSetups.trim(),
      currentGoal: currentGoal.trim(),
      memberProfileVisibility: visibleToMembers ? "members" : "private",
    });
    setSaveMessage("Secțiunea „Despre mine” a fost actualizată.");
    setIsEditingAbout(false);
  };

  return (
    <Screen>
      <PremiumCard>
        <Text style={styles.eyebrow}>Profil</Text>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.body}>{displayEmail}</Text>
        <View style={styles.rankHero}>
          <View style={styles.rankBadge}>
            <MaterialCommunityIcons name="shield-sword-outline" size={26} color={colors.gold} />
          </View>
          <View style={styles.rankTextWrap}>
            <Text style={styles.rankLabel}>Rang curent</Text>
            <Text style={styles.rankValue}>{displayRank(membership.currentRank)}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <MetricPill label="Rang" value={displayRank(membership.currentRank)} />
          <MetricPill label="Scor" value={String(membership.score)} />
          <MetricPill label="Plan" value={membership.currentPlan === "FREE" ? "GRATUIT" : "PREMIUM"} />
        </View>
      </PremiumCard>

      <SectionHeader eyebrow="Contul meu" title="Acces și abonament" />
      <View style={styles.panel}>
        {hasSession ? (
          <>
            <Text style={styles.body}>Email: {displayEmail}</Text>
            <Text style={styles.body}>Abonament: {membership.currentPlan === "FREE" ? "Gratuit" : "Premium"}</Text>
            <Text style={styles.body}>Rang: {displayRank(membership.currentRank)}</Text>
            <View style={styles.actionRow}>
              <PrimaryButton label="Upgrade" onPress={() => router.push("/membership")} />
              <PrimaryButton label="Deconectare" variant="ghost" onPress={() => void signOut()} />
            </View>
          </>
        ) : !authReady ? (
          <Text style={styles.body}>Se verifică sesiunea contului...</Text>
        ) : (
          <>
            <Text style={styles.body}>Nu ești autentificat. Intră în cont pentru a vedea istoricul și accesul tău curent.</Text>
            <View style={styles.actionRow}>
              <PrimaryButton label="Autentificare" onPress={() => router.push("/auth/login")} />
              <PrimaryButton label="Creare cont" variant="ghost" onPress={() => router.push("/auth/register")} />
            </View>
          </>
        )}
      </View>

      <SectionHeader
        eyebrow="Activitate"
        title="Motorul de rang și implicare"
        caption="Rangul este calculat din streak, vizualizări, sesiuni premium urmărite și cereri trimise."
      />
      <View style={styles.statsGrid}>
        <MetricPill label="Streak" value={`${membership.loginStreak}`} />
        <MetricPill label="Vizualizări" value={`${membership.totalViews}`} />
        <MetricPill label="Premium" value={`${membership.premiumViews}`} />
        <MetricPill label="Cereri" value={`${membership.totalRequests}`} />
      </View>

      <SectionHeader eyebrow="Piețe salvate" title="Acces rapid" />
      <View style={styles.panel}>
        <Text style={styles.body}>Piețe salvate: {savedMarketsLabel}</Text>
      </View>

      <SectionHeader eyebrow="Profil membru" title="Despre mine" caption="Completează profilul tău de trader și alege dacă este vizibil altor membri." />
      <View style={styles.panel}>
        {hasSession ? (
          <>
            {isEditingAbout ? (
              <>
                <Text style={styles.fieldLabel}>Nume afișat</Text>
                <TextInput value={aboutName} onChangeText={setAboutName} style={styles.input} placeholderTextColor="#6F6A5C" />

                <Text style={styles.fieldLabel}>Bio scurt</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  style={[styles.input, styles.textarea]}
                  multiline
                  placeholder="Spune pe scurt cine ești ca trader."
                  placeholderTextColor="#6F6A5C"
                />

                <Text style={styles.fieldLabel}>Experiență în trading</Text>
                <TextInput
                  value={tradingExperience}
                  onChangeText={setTradingExperience}
                  style={styles.input}
                  placeholder="Ex: 3 ani, învăț activ price action"
                  placeholderTextColor="#6F6A5C"
                />

                <Text style={styles.fieldLabel}>Piețe tranzacționate</Text>
                <TextInput
                  value={tradedMarkets}
                  onChangeText={setTradedMarkets}
                  style={styles.input}
                  placeholder="Ex: BTC, ETH, NQ, ES"
                  placeholderTextColor="#6F6A5C"
                />

                <Text style={styles.fieldLabel}>Stil de trading</Text>
                <TextInput
                  value={tradingStyle}
                  onChangeText={setTradingStyle}
                  style={styles.input}
                  placeholder="Ex: intraday, scalping, swing"
                  placeholderTextColor="#6F6A5C"
                />

                <Text style={styles.fieldLabel}>Sesiuni preferate</Text>
                <TextInput
                  value={preferredSessions}
                  onChangeText={setPreferredSessions}
                  style={styles.input}
                  placeholder="Ex: London, New York AM"
                  placeholderTextColor="#6F6A5C"
                />

                <Text style={styles.fieldLabel}>Setups urmărite</Text>
                <TextInput
                  value={focusedSetups}
                  onChangeText={setFocusedSetups}
                  style={styles.input}
                  placeholder="Ex: sweep + displacement, breakout retest"
                  placeholderTextColor="#6F6A5C"
                />

                <Text style={styles.fieldLabel}>Obiectiv curent</Text>
                <TextInput
                  value={currentGoal}
                  onChangeText={setCurrentGoal}
                  style={styles.input}
                  placeholder="Ex: disciplină mai bună și execuție mai clară"
                  placeholderTextColor="#6F6A5C"
                />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextBlock}>
                    <Text style={styles.fieldLabel}>Vizibilitate profil</Text>
                    <Text style={styles.toggleCaption}>{visibleToMembers ? "Vizibil membrilor" : "Profil privat"}</Text>
                  </View>
                  <Switch value={visibleToMembers} onValueChange={setVisibleToMembers} />
                </View>

                {saveMessage ? <Text style={styles.successMessage}>{saveMessage}</Text> : null}

                <View style={styles.actionRow}>
                  <PrimaryButton label="Salvează" onPress={() => void saveAboutSection()} />
                  <PrimaryButton
                    label="Anulează"
                    variant="ghost"
                    onPress={() => {
                      setIsEditingAbout(false);
                      setSaveMessage("");
                    }}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.profileLine}>Nume afișat: {displayName}</Text>
                <Text style={styles.profileLine}>Bio: {user?.bio || "Nu ai adăugat încă o bio."}</Text>
                <Text style={styles.profileLine}>Experiență: {user?.tradingExperience || "Nespecificat"}</Text>
                <Text style={styles.profileLine}>Piețe tranzacționate: {user?.tradedMarkets || "Nespecificat"}</Text>
                <Text style={styles.profileLine}>Stil de trading: {user?.tradingStyle || "Nespecificat"}</Text>
                <Text style={styles.profileLine}>Sesiuni preferate: {user?.preferredSessions || "Nespecificat"}</Text>
                <Text style={styles.profileLine}>Setups urmărite: {user?.focusedSetups || "Nespecificat"}</Text>
                <Text style={styles.profileLine}>Obiectiv curent: {user?.currentGoal || "Nespecificat"}</Text>
                <Text style={styles.profileLine}>
                  Vizibilitate: {user?.memberProfileVisibility === "members" ? "Vizibil membrilor" : "Privat"}
                </Text>
                {saveMessage ? <Text style={styles.successMessage}>{saveMessage}</Text> : null}
                <PrimaryButton label={hasAboutContent ? "Editează profilul" : "Completează profilul"} onPress={() => setIsEditingAbout(true)} />
              </>
            )}
          </>
        ) : (
          <Text style={styles.body}>Autentifică-te pentru a completa secțiunea „Despre mine”.</Text>
        )}
      </View>

      <SectionHeader eyebrow="Logică rang" title={displayRank(membership.currentRank)} />
      <View style={styles.panel}>
        <Text style={styles.body}>{rankDescriptions[membership.currentRank]}</Text>
      </View>

      <SectionHeader eyebrow="Istoric" title="Semnale de utilizare premium" />
      <View style={styles.panel}>
        <Text style={styles.body}>
          Briefinguri premium urmărite: {membership.premiumViews}. Cereri cumpărate: {requests.length}.
        </Text>
      </View>

      <SectionHeader eyebrow="Cont" title="Autentificare și acces" />
      <View style={styles.panel}>
        <Text style={styles.body}>
          {hasSession
            ? "Ești autentificat. Dacă ai nevoie de alt cont, te poți deconecta și autentifica din nou."
            : "Creează un cont nou sau autentifică-te pentru a-ți salva planul și istoricul."}
        </Text>
        {!hasSession && authReady ? (
          <View style={styles.actionRow}>
            <PrimaryButton label="Autentificare" onPress={() => router.push("/auth/login")} />
            <PrimaryButton label="Creare cont" variant="ghost" onPress={() => router.push("/auth/register")} />
          </View>
        ) : null}
      </View>

      {user?.isAdmin ? (
        <PrimaryButton label="Deschide consola creator" onPress={() => router.push("/admin")} />
      ) : null}
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
  name: {
    color: colors.textStrong,
    fontSize: 30,
    fontWeight: "800",
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  rankHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    padding: 16,
  },
  rankBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  rankTextWrap: {
    gap: 4,
  },
  rankLabel: {
    color: colors.textMuted,
    fontSize: typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    fontWeight: "700",
  },
  rankValue: {
    color: colors.goldBright,
    fontSize: 24,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  panel: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 22,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSoft,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typography.body,
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  toggleTextBlock: {
    flex: 1,
    gap: 4,
  },
  toggleCaption: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 18,
  },
  profileLine: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  successMessage: {
    color: colors.goldBright,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: "700",
  },
});
