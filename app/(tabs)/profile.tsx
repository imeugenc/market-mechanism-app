import { useEffect, useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { MetricPill } from "@/components/MetricPill";
import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { isOwnerEmail } from "@/constants/access";
import { rankDescriptions } from "@/features/profile/ranks";
import { displayRank } from "@/lib/display";
import { formatDate } from "@/lib/format";
import { useAppState } from "@/providers/AppProvider";
import { colors, spacing, typography, radii } from "@/theme";

function paymentStatusLabel(status: "pending" | "verified" | "rejected") {
  if (status === "verified") {
    return "Validată";
  }

  if (status === "rejected") {
    return "Respinsă";
  }

  return "În procesare / validare";
}

function requestStatusLabel(status: "pending" | "accepted" | "delivered" | "cancelled") {
  if (status === "accepted") {
    return "Acceptată";
  }

  if (status === "delivered") {
    return "Livrată";
  }

  if (status === "cancelled") {
    return "Respinsă";
  }

  return "În așteptare";
}

export default function ProfileScreen() {
  const {
    authReady,
    changePassword,
    contactMessages,
    favorites,
    membership,
    paymentRequests,
    personalRequests,
    requests,
    session,
    signOut,
    toggleFavorite,
    updateProfileAbout,
    user,
  } = useAppState();

  const sessionUser = session?.user ?? null;
  const hasSession = Boolean(sessionUser);
  const isOwner = isOwnerEmail(sessionUser?.email) || isOwnerEmail(user?.email);
  const isAdmin = user?.isAdmin || isOwner;
  const displayName = user?.name ?? sessionUser?.email?.split("@")[0] ?? "Vizitator";
  const displayEmail = user?.email ?? sessionUser?.email ?? "Nu ești autentificat";
  const currentPlanLabel = isOwner ? "Creator" : membership.currentPlan === "PRO" ? "Premium" : "Gratuit";
  const identityLabel = isOwner ? "Owner / Creator" : membership.currentPlan === "PRO" ? "Membru Premium" : "Membru Gratuit";

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
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

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

  const visibleRequests = useMemo(() => requests.slice(0, 2), [requests]);
  const remainingRequests = useMemo(() => requests.slice(2), [requests]);
  const deliveredItems = useMemo(
    () => [
      ...requests
        .filter((item) => item.status === "delivered")
        .map((item) => ({
          id: `request-${item.id}`,
          title: `${item.assetInput} • $${item.tier}`,
          status: requestStatusLabel(item.status),
          videoUrl: item.deliveryUrl ?? item.deliveryVideoUrl,
          message: item.deliveryNotes ?? item.adminNotes ?? "Fără mesaj suplimentar.",
          createdAt: item.deliveredAt ?? item.fulfilledAt ?? item.updatedAt ?? item.createdAt,
        })),
      ...personalRequests.map((item) => ({
        id: `personal-${item.id}`,
        title: item.title,
        status: requestStatusLabel(item.status),
        videoUrl: item.videoUrl,
        message: item.notes ?? "Fără mesaj suplimentar.",
        createdAt: item.updatedAt ?? item.createdAt,
      })),
    ],
    [personalRequests, requests],
  );

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

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      setPasswordMessage("Parola nouă trebuie să aibă cel puțin 8 caractere.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage("Parolele introduse nu coincid.");
      return;
    }

    const result = await changePassword(newPassword);
    setPasswordMessage(result.message);

    if (result.success) {
      setNewPassword("");
      setConfirmNewPassword("");
    }
  };

  const openExternalUrl = async (url?: string) => {
    if (!url) {
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Link indisponibil", "Nu am putut deschide link-ul în mediul curent.");
    }
  };

  return (
    <Screen>
      <PremiumCard>
        <Text style={styles.eyebrow}>Profil</Text>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.body}>{displayEmail}</Text>
        <View style={styles.rankHero}>
          <View style={styles.rankBadge}>
            <MaterialCommunityIcons
              name={isOwner ? "crown-outline" : "shield-sword-outline"}
              size={26}
              color={colors.gold}
            />
          </View>
          <View style={styles.rankTextWrap}>
            <Text style={styles.rankLabel}>{isOwner ? "Statut cont" : "Rang curent"}</Text>
            <Text style={styles.rankValue}>{isOwner ? "Creator" : displayRank(membership.currentRank)}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <MetricPill label="Identitate" value={identityLabel} />
          <MetricPill label="Rang" value={isOwner ? "Creator" : displayRank(membership.currentRank)} />
          <MetricPill label="Scor" value={String(membership.score)} />
          <MetricPill label="Plan" value={isOwner ? "OWNER" : membership.currentPlan === "PRO" ? "PREMIUM" : "GRATUIT"} />
        </View>
      </PremiumCard>

      <SectionHeader eyebrow="Profil membru" title="Despre mine" />
      <View style={styles.panel}>
        {hasSession ? (
          isEditingAbout ? (
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
              <TextInput value={tradingExperience} onChangeText={setTradingExperience} style={styles.input} placeholderTextColor="#6F6A5C" />

              <Text style={styles.fieldLabel}>Piețe tranzacționate</Text>
              <TextInput value={tradedMarkets} onChangeText={setTradedMarkets} style={styles.input} placeholderTextColor="#6F6A5C" />

              <Text style={styles.fieldLabel}>Stil de trading</Text>
              <TextInput value={tradingStyle} onChangeText={setTradingStyle} style={styles.input} placeholderTextColor="#6F6A5C" />

              <Text style={styles.fieldLabel}>Sesiuni preferate</Text>
              <TextInput value={preferredSessions} onChangeText={setPreferredSessions} style={styles.input} placeholderTextColor="#6F6A5C" />

              <Text style={styles.fieldLabel}>Setups urmărite</Text>
              <TextInput value={focusedSetups} onChangeText={setFocusedSetups} style={styles.input} placeholderTextColor="#6F6A5C" />

              <Text style={styles.fieldLabel}>Obiectiv curent</Text>
              <TextInput value={currentGoal} onChangeText={setCurrentGoal} style={styles.input} placeholderTextColor="#6F6A5C" />

              <View style={styles.toggleRow}>
                <View style={styles.toggleTextBlock}>
                  <Text style={styles.fieldLabel}>Vizibilitate profil</Text>
                  <Text style={styles.toggleCaption}>{visibleToMembers ? "Vizibil membrilor" : "Privat"}</Text>
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
          )
        ) : (
          <Text style={styles.body}>Autentifică-te pentru a completa secțiunea „Despre mine”.</Text>
        )}
      </View>

      <SectionHeader eyebrow="Contul meu" title="Acces și abonament" />
      <View style={styles.panel}>
        {hasSession ? (
          <>
            <Text style={styles.profileLine}>Plan curent: {currentPlanLabel}</Text>
            {!isOwner ? (
              <Text style={styles.profileLine}>
                {membership.currentPlan === "PRO"
                  ? `Premium activ${membership.expiresAt ? ` până la ${membership.expiresAt}` : ""}`
                  : "Acces gratuit activ"}
              </Text>
            ) : (
              <Text style={styles.profileLine}>Acces complet fără expirare, rol special Owner / Creator.</Text>
            )}
            <Text style={styles.profileLine}>{rankDescriptions[membership.currentRank]}</Text>
            <View style={styles.actionRow}>
              {!isOwner ? (
                <PrimaryButton
                  label={membership.currentPlan === "PRO" ? "Prelungește Premium" : "Upgrade"}
                  onPress={() => router.push("/(tabs)/membership")}
                />
              ) : null}
              <PrimaryButton label="Contact" variant="ghost" onPress={() => router.push("/contact")} />
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

      {hasSession ? (
        <>
          <SectionHeader eyebrow="Securitate" title="Schimbă parola" />
          <View style={styles.panel}>
            <Text style={styles.body}>Actualizează parola direct din profil, fără să părăsești aplicația.</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.input}
              placeholder="Parolă nouă"
              placeholderTextColor="#6F6A5C"
              secureTextEntry
            />
            <TextInput
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              style={styles.input}
              placeholder="Confirmă parola nouă"
              placeholderTextColor="#6F6A5C"
              secureTextEntry
            />
            {passwordMessage ? <Text style={styles.successMessage}>{passwordMessage}</Text> : null}
            <PrimaryButton label="Actualizează parola" onPress={() => void handlePasswordChange()} />
          </View>
        </>
      ) : null}

      <CollapsibleSection
        title="Cereri Premium"
        eyebrow="Istoric plăți"
        caption="Vezi toate confirmările trimise și stadiul lor curent."
        rightLabel={paymentRequests.length ? `${paymentRequests.length}` : "0"}
      >
        {paymentRequests.length ? (
          paymentRequests.map((item) => (
            <View key={item.id} style={styles.listCard}>
              <Text style={styles.listCardTitle}>{item.planLabel ?? "Premium All Access"} • {item.durationDays ?? 30} zile</Text>
              <Text style={styles.listCardMeta}>{paymentStatusLabel(item.status)} • {formatDate(item.createdAt)}</Text>
              <Text style={styles.profileLine}>Email confirmare: {item.contactEmail}</Text>
              {item.notes ? <Text style={styles.profileLine}>Mesaj: {item.notes}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.body}>Nu ai trimis încă nicio confirmare pentru Premium.</Text>
        )}
      </CollapsibleSection>

      <SectionHeader eyebrow="Cereri" title="Analize personale" caption="Ultimele 2 cereri rămân vizibile direct, iar restul sunt grupate mai jos." />
      <View style={styles.stack}>
        {visibleRequests.length ? (
          visibleRequests.map((item) => (
            <View key={item.id} style={styles.listCard}>
              <Text style={styles.listCardTitle}>{item.assetInput} • ${item.tier}</Text>
              <Text style={styles.listCardMeta}>{requestStatusLabel(item.status)} • {formatDate(item.requestedAt)}</Text>
              <Text style={styles.profileLine}>Plată: {item.paymentStatus === "paid" ? "Confirmată" : item.paymentStatus === "refunded" ? "Rambursată" : "În verificare"}</Text>
              {item.notes ? <Text style={styles.profileLine}>Detalii: {item.notes}</Text> : null}
            </View>
          ))
        ) : (
          <View style={styles.panel}>
            <Text style={styles.body}>Nu ai încă cereri de analiză înregistrate.</Text>
          </View>
        )}
      </View>

      {remainingRequests.length ? (
        <CollapsibleSection title="Vezi toate" eyebrow="Istoric complet" rightLabel={String(remainingRequests.length)}>
          {remainingRequests.map((item) => (
            <View key={item.id} style={styles.listCard}>
              <Text style={styles.listCardTitle}>{item.assetInput} • ${item.tier}</Text>
              <Text style={styles.listCardMeta}>{requestStatusLabel(item.status)} • {formatDate(item.requestedAt)}</Text>
              {item.notes ? <Text style={styles.profileLine}>Detalii: {item.notes}</Text> : null}
            </View>
          ))}
        </CollapsibleSection>
      ) : null}

      <CollapsibleSection
        title="Livrări primite"
        eyebrow="Conținut privat"
        caption="Fiecare livrare are status, mesaj și acces direct la video atunci când este disponibil."
        rightLabel={String(deliveredItems.length)}
      >
        {deliveredItems.length ? (
          deliveredItems.map((item) => (
            <View key={item.id} style={styles.listCard}>
              <Text style={styles.listCardTitle}>{item.title}</Text>
              <Text style={styles.listCardMeta}>{item.status} • {formatDate(item.createdAt)}</Text>
              <Text style={styles.profileLine}>{item.message}</Text>
              {item.videoUrl ? <PrimaryButton label="Vezi video" variant="ghost" onPress={() => void openExternalUrl(item.videoUrl)} /> : null}
            </View>
          ))
        ) : (
          <Text style={styles.body}>Nu ai încă livrări disponibile.</Text>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Comunicare cu adminul"
        eyebrow="Fir complet"
        caption="Aici urmărești mesajele trimise și răspunsurile primite direct în aplicație."
        rightLabel={String(contactMessages.length)}
      >
        <PrimaryButton label="Trimite mesaj" onPress={() => router.push("/contact")} />
        {contactMessages.length ? (
          contactMessages.map((item) => (
            <View key={item.id} style={styles.listCard}>
              <Text style={styles.listCardTitle}>{item.subject}</Text>
              <Text style={styles.listCardMeta}>
                {item.status === "new" ? "Trimis" : item.status === "read" ? "Citit de admin" : "Răspuns disponibil"} • {formatDate(item.createdAt)}
              </Text>
              <Text style={styles.profileLine}>{item.message}</Text>
              {item.replies?.length ? (
                item.replies.map((reply) => (
                  <View key={reply.id} style={styles.replyBubble}>
                    <Text style={styles.replyAuthor}>{reply.senderRole === "admin" ? "Admin" : reply.senderName}</Text>
                    <Text style={styles.replyMeta}>{formatDate(reply.createdAt)}</Text>
                    <Text style={styles.profileLine}>{reply.body}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.profileLine}>Nu există încă un răspuns în aplicație pe acest fir.</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.body}>Nu ai încă mesaje trimise din aplicație.</Text>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Conținut salvat"
        eyebrow="Favorite"
        caption="Salvezi briefinguri, AAR-uri și postări Altcoins pentru acces rapid din profil."
        rightLabel={String(favorites.length)}
      >
        {favorites.length ? (
          favorites.map((item) => (
            <Pressable
              key={item.id}
              style={styles.favoriteRow}
              onPress={() => {
                if (item.contentType === "review") {
                  router.push(`/review/${item.contentId}`);
                  return;
                }

                if (item.contentType === "altcoin") {
                  router.push("/(tabs)/markets/altcoins");
                  return;
                }

                if (item.marketLabel) {
                  router.push(`/(tabs)/markets/${item.marketLabel}`);
                }
              }}
            >
              <View style={styles.favoriteTextBlock}>
                <Text style={styles.favoriteTitle}>{item.title}</Text>
                <Text style={styles.favoriteMeta}>
                  {item.contentType === "analysis"
                    ? `Briefing • ${item.marketLabel ?? "-"}`
                    : item.contentType === "review"
                      ? `After Action Review • ${item.marketLabel ?? "-"}`
                      : `Altcoins • ${item.marketLabel ?? ""}`}
                </Text>
                {item.subtitle ? <Text style={styles.favoriteBody}>{item.subtitle}</Text> : null}
              </View>
              <View style={styles.favoriteActions}>
                <Pressable
                  style={styles.favoriteRemove}
                  onPress={(event) => {
                    event.stopPropagation();
                    void toggleFavorite({
                      contentType: item.contentType,
                      contentId: item.contentId,
                      title: item.title,
                      subtitle: item.subtitle,
                      marketLabel: item.marketLabel,
                    });
                  }}
                >
                  <MaterialCommunityIcons name="star-off-outline" size={18} color={colors.gold} />
                </Pressable>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={styles.body}>Nu ai încă elemente în Favorite.</Text>
        )}
      </CollapsibleSection>

      <SectionHeader eyebrow="Market Mechanism" title="Contact și identitate" />
      <View style={styles.panel}>
        <Text style={styles.profileLine}>Website oficial: https://www.marketmechanism.xyz</Text>
        <Text style={styles.body}>
          Identitatea vizuală rămâne aliniată cu Market Mechanism, iar rolul de creator este separat clar de planurile normale de membru.
        </Text>
        <PrimaryButton
          label="Deschide website-ul"
          variant="ghost"
          onPress={() => void openExternalUrl("https://www.marketmechanism.xyz")}
        />
      </View>

      {isAdmin ? <PrimaryButton label="Deschide consola creator" onPress={() => router.push("/admin")} /> : null}
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
  panel: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 22,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.sm,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
    padding: 14,
    gap: 6,
  },
  listCardTitle: {
    color: colors.textStrong,
    fontSize: typography.body,
    fontWeight: "800",
  },
  listCardMeta: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "700",
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
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
    padding: 14,
  },
  favoriteTextBlock: {
    flex: 1,
    gap: 4,
  },
  favoriteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  favoriteRemove: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgSoft,
  },
  favoriteTitle: {
    color: colors.textStrong,
    fontSize: typography.body,
    fontWeight: "800",
  },
  favoriteMeta: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "700",
  },
  favoriteBody: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 20,
  },
  replyBubble: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgSoft,
    padding: 12,
    gap: 4,
  },
  replyAuthor: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  replyMeta: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
});
