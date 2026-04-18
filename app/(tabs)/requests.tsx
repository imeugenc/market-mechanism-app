import { useState } from "react";
import { Linking, StyleSheet, Text, TextInput, View } from "react-native";
import { BlurView } from "expo-blur";

import { formatCurrency, formatDate } from "@/lib/format";
import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { TierCard } from "@/components/TierCard";
import { REQUEST_TIERS } from "@/features/requests/tiers";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";
import { RequestStatus, RequestTier } from "@/types/domain";

const statusStyles: Record<RequestStatus, { label: string; bg: string; color: string }> = {
  pending: { label: "În așteptare", bg: "rgba(216, 157, 42, 0.14)", color: colors.warning },
  accepted: { label: "Acceptată", bg: "rgba(212, 175, 55, 0.16)", color: colors.gold },
  delivered: { label: "Livrată", bg: "rgba(67, 196, 125, 0.16)", color: colors.success },
  cancelled: { label: "Anulată", bg: "rgba(214, 92, 92, 0.14)", color: colors.danger },
};

export default function RequestsScreen() {
  const { createRequest, notifications, personalRequests, requests, user } = useAppState();
  const [assetInput, setAssetInput] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [tier, setTier] = useState<RequestTier>(5);
  const [notes, setNotes] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState("");

  const selectedTier = REQUEST_TIERS.find((item) => item.tier === tier) ?? REQUEST_TIERS[1];

  const handleSubmit = () => {
    const trimmed = assetInput.trim();

    if (trimmed.length < 2) {
      setError("Te rugăm să introduci un activ sau ticker");
      return;
    }

    if (!user && requesterEmail.trim().length < 5) {
      setError("Te rugăm să introduci o adresă de email");
      return;
    }

    createRequest({
      assetInput: trimmed,
      requesterEmail: requesterEmail.trim(),
      tier,
      notes: notes.trim(),
      paymentProof: paymentProof.trim(),
      paymentReference: paymentReference.trim(),
    });
    setAssetInput("");
    setRequesterEmail("");
    setNotes("");
    setPaymentProof("");
    setPaymentReference("");
    setError("");
  };

  return (
    <Screen>
      <SectionHeader
        eyebrow="Analize personale"
        title="Livrări și solicitări personale"
        caption="Aici vezi analizele personale livrate către emailul tău și statusul solicitărilor aflate încă în procesare."
      />
      <View style={styles.list}>
        {personalRequests.length ? (
          personalRequests.map((item) => {
            const hasAccess = user?.isAdmin || item.userEmail.toLowerCase() === (user?.email ?? "").toLowerCase();

            return (
              <View key={item.id} style={styles.personalCard}>
                {!hasAccess ? (
                  <BlurView intensity={24} tint="dark" style={styles.personalLock}>
                    <Text style={styles.personalLockTitle}>Solicitare blocată</Text>
                    <Text style={styles.personalLockBody}>Nu aveți acces la această analiză personală.</Text>
                  </BlurView>
                ) : null}
                <Text style={styles.personalTitle}>{item.title}</Text>
                <Text style={styles.personalMeta}>
                  {item.status === "delivered"
                    ? "Livrată"
                    : item.status === "accepted"
                      ? "În curs de procesare"
                      : item.status === "cancelled"
                        ? "Respinsă"
                        : "În așteptare"}{" "}
                  • {formatDate(item.createdAt)}
                </Text>
                {item.notes ? <Text style={styles.personalBody}>{item.notes}</Text> : null}
                {item.status === "delivered" && item.videoUrl && hasAccess ? (
                  <PrimaryButton label="Vezi video" onPress={() => void Linking.openURL(item.videoUrl!)} />
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.personalCard}>
            <Text style={styles.personalTitle}>Nu ai încă analize personale</Text>
            <Text style={styles.personalBody}>După ce un admin livrează o analiză pe emailul tău, aceasta va apărea aici automat.</Text>
          </View>
        )}
      </View>

      <PremiumCard>
        <Text style={styles.heroEyebrow}>Solicită analiză</Text>
        <Text style={styles.heroTitle}>Solicită analiză personalizată</Text>
        <Text style={styles.heroBody}>
          Primești răspuns în max 8 ore. Alege activul, selectează nivelul potrivit și trimite rapid cererea.
        </Text>
        <View style={styles.heroTrustBand}>
          <Text style={styles.heroTrustText}>Primești răspuns în max 8 ore</Text>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillValue}>$2</Text>
            <Text style={styles.heroPillLabel}>Analiză rapidă</Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillValue}>$5</Text>
            <Text style={styles.heroPillLabel}>Analiză video personalizată</Text>
          </View>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillValue}>$10</Text>
            <Text style={styles.heroPillLabel}>Analiză video premium</Text>
          </View>
        </View>
      </PremiumCard>

      <SectionHeader
        eyebrow="Cerere nouă"
        title="Solicitare personală nouă"
        caption="Selectezi nivelul, trimiți cererea și urmărești statusul direct în aplicație."
      />
      <View style={styles.promiseCard}>
        <Text style={styles.promiseTitle}>Livrare în maximum 8 ore de la solicitare</Text>
        <Text style={styles.promiseBody}>Timpul de livrare începe după confirmarea solicitării.</Text>
      </View>
      <View style={styles.paymentCard}>
        <Text style={styles.paymentEyebrow}>Deblochează analiza completă sau cere analiză personalizată</Text>
        <Text style={styles.paymentBody}>
          Plătește mai întâi folosind una dintre metodele de mai jos. După ce efectuezi plata, revino în aplicație și trimite confirmarea cu nr. tranzacției sau atașează o captură de ecran.
        </Text>
        <View style={styles.paymentMethod}>
          <Text style={styles.paymentLabel}>PayPal</Text>
          <Text style={styles.paymentValue}>eugenfm95@gmail.com</Text>
        </View>
        <View style={styles.paymentMethod}>
          <Text style={styles.paymentLabel}>USDT (TRC20)</Text>
          <Text style={styles.paymentValue}>TLuz2gAdrWjv7UbS9FTcrkH2Z7pCw2RZLx</Text>
        </View>
        <View style={styles.paymentMethod}>
          <Text style={styles.paymentLabel}>Redotpay UserID</Text>
          <Text style={styles.paymentValue}>1838748987</Text>
        </View>
        <View style={styles.paymentSteps}>
          <Text style={styles.stepText}>Niveluri</Text>
          <Text style={styles.stepDetail}>Analiză rapidă: $2</Text>
          <Text style={styles.stepDetail}>Analiză video personalizată: $5</Text>
          <Text style={styles.stepDetail}>Analiză video premium: $10</Text>
        </View>
        <Text style={styles.manualConfirmNote}>Confirmarea plății este manuală și poate dura până la 24h.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formHeader}>
          <View>
            <Text style={styles.formTitle}>Construiește cererea</Text>
            <Text style={styles.formCaption}>Interfață clară, rapidă și orientată spre decizie.</Text>
          </View>
          <View style={styles.priceChip}>
            <Text style={styles.priceChipLabel}>Selectat</Text>
            <Text style={styles.priceChipValue}>{formatCurrency(tier)}</Text>
          </View>
        </View>

        <Text style={styles.label}>Activ / Ticker</Text>
        <TextInput
          value={assetInput}
          onChangeText={(value) => {
            setAssetInput(value);
            if (error) {
              setError("");
            }
          }}
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="Introdu activul sau tickerul (ex: BTC, SOL, ETH)"
          placeholderTextColor="#6F6A5C"
          autoCapitalize="characters"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!user ? (
          <>
            <Text style={styles.label}>Adresa de email</Text>
            <TextInput
              value={requesterEmail}
              onChangeText={(value) => {
                setRequesterEmail(value);
                if (error) {
                  setError("");
                }
              }}
              style={styles.input}
              placeholder="Introdu adresa de email pentru confirmare"
              placeholderTextColor="#6F6A5C"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </>
        ) : (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEyebrow}>Confirmare pe email</Text>
            <Text style={styles.summaryBody}>Cererea va fi confirmată automat pe adresa: {user.email}</Text>
          </View>
        )}

        <Text style={styles.label}>Alege nivelul</Text>
        <View style={styles.tiers}>
          {REQUEST_TIERS.map((item) => (
            <TierCard
              key={item.tier}
              tier={item.tier}
              title={item.title}
              selected={tier === item.tier}
              description={item.description}
              deliveryLabel={item.deliveryLabel}
              turnaround={item.turnaround}
              onPress={() => setTier(item.tier)}
            />
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryEyebrow}>Oferta selectată</Text>
          <Text style={styles.summaryTitle}>
            {selectedTier.title} • {formatCurrency(selectedTier.tier)}
          </Text>
          <Text style={styles.summaryBody}>{selectedTier.description}</Text>
          <Text style={styles.summaryMeta}>{selectedTier.deliveryLabel} • {selectedTier.turnaround}</Text>
        </View>

        <Text style={styles.label}>Detalii suplimentare</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, styles.notes]}
          multiline
          placeholder="Detalii suplimentare"
          placeholderTextColor="#6F6A5C"
        />

        <Text style={styles.label}>Dovadă plată</Text>
        <TextInput
          value={paymentProof}
          onChangeText={setPaymentProof}
          style={[styles.input, styles.notes]}
          multiline
          placeholder="Introdu dovada plății sau menționează captura trimisă"
          placeholderTextColor="#6F6A5C"
        />

        <Text style={styles.label}>Nr. tranzacției</Text>
        <TextInput
          value={paymentReference}
          onChangeText={setPaymentReference}
          style={styles.input}
          placeholder="ID tranzacție / hash / referință"
          placeholderTextColor="#6F6A5C"
          autoCapitalize="none"
        />

        <PrimaryButton label={`Trimite • ${formatCurrency(tier)}`} onPress={handleSubmit} />
      </View>

      {notifications[0] ? (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{notifications[0].title}</Text>
          <Text style={styles.confirmBody}>{notifications[0].body}</Text>
        </View>
      ) : null}

      <SectionHeader
        eyebrow="Istoric"
        title="Istoric solicitări personale"
        caption="Vezi rapid ce ai comandat, cât a costat și în ce stadiu se află."
      />
      <View style={styles.list}>
        {requests.map((request) => (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestTopRow}>
              <View style={styles.requestTitleWrap}>
                <Text style={styles.requestTicker}>{request.assetInput}</Text>
                <Text style={styles.requestSymbol}>{request.coinSymbol}</Text>
              </View>
              <Text style={styles.requestTier}>{formatCurrency(request.tier)}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusStyles[request.status].bg }]}>
              <Text style={[styles.statusText, { color: statusStyles[request.status].color }]}>
                {statusStyles[request.status].label}
              </Text>
            </View>
            <Text style={styles.requestBody}>{request.notes}</Text>
            <Text style={styles.meta}>
              {statusStyles[request.status].label} • {request.deliveryType === "video" ? "VIDEO" : "TEXT SCURT"} • {formatDate(request.requestedAt)}
            </Text>
            {request.requesterEmail ? <Text style={styles.meta}>Contact: {request.requesterEmail}</Text> : null}
            <Text style={styles.meta}>
              {request.paymentStatus === "paid" ? "Plată confirmată" : "Plată în verificare manuală"} • Confirmarea poate dura până la 24h
            </Text>
            <Text style={styles.deliveryPromiseText}>
              Livrare în maximum 8 ore de la solicitare. Timpul începe după confirmarea solicitării.
            </Text>
            {request.paymentReference ? <Text style={styles.deliveryNote}>Referință plată: {request.paymentReference}</Text> : null}
            {request.paymentProof ? <Text style={styles.deliveryNote}>Dovadă: {request.paymentProof}</Text> : null}
            {request.status === "delivered" ? <Text style={styles.readyLabel}>Analiza ta este gata</Text> : null}
            {request.adminNotes ? <Text style={styles.deliveryNote}>{request.adminNotes}</Text> : null}
            {request.deliveryUrl && request.status === "delivered" ? (
              <Text style={styles.deliveryLink}>Livrare: {request.deliveryUrl}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroEyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  heroTitle: {
    color: colors.textStrong,
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "800",
  },
  heroBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  heroTrustBand: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  heroTrustText: {
    color: colors.goldBright,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "800",
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  heroPill: {
    flex: 1,
    minWidth: 100,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    padding: 14,
    gap: 6,
  },
  heroPillLabel: {
    color: colors.textStrong,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
  },
  heroPillValue: {
    color: colors.goldBright,
    fontSize: typography.title,
    fontWeight: "800",
  },
  form: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgPanel,
    padding: 20,
    gap: spacing.md,
  },
  paymentCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "#101010",
    padding: 18,
    gap: 12,
  },
  paymentEyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "800",
  },
  paymentBody: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 22,
  },
  paymentMethod: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSoft,
    padding: 14,
    gap: 4,
  },
  paymentLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  paymentValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  paymentSteps: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(212, 175, 55, 0.06)",
    padding: 14,
    gap: 6,
  },
  stepText: {
    color: colors.gold,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "800",
  },
  stepDetail: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  manualConfirmNote: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  promiseCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(212, 175, 55, 0.06)",
    padding: 16,
    gap: 6,
  },
  promiseTitle: {
    color: colors.goldBright,
    fontSize: typography.body,
    fontWeight: "800",
  },
  promiseBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 21,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  formTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  formCaption: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 21,
    marginTop: 4,
  },
  priceChip: {
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    gap: 2,
  },
  priceChipLabel: {
    color: colors.textMuted,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  priceChipValue: {
    color: colors.gold,
    fontSize: typography.section,
    fontWeight: "800",
  },
  label: {
    color: colors.text,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSoft,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typography.body,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.small,
    marginTop: -8,
  },
  notes: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  tiers: {
    gap: spacing.sm,
  },
  summaryCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(212, 175, 55, 0.06)",
    padding: 16,
    gap: 6,
  },
  summaryEyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  summaryTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  summaryBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 21,
  },
  summaryMeta: {
    color: colors.gold,
    fontSize: typography.small,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  confirmCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgPanel,
    padding: 16,
    gap: 6,
  },
  confirmTitle: {
    color: colors.gold,
    fontSize: typography.body,
    fontWeight: "800",
  },
  confirmBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 21,
  },
  list: {
    gap: spacing.sm,
  },
  requestCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: 12,
  },
  personalCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: 10,
    overflow: "hidden",
  },
  personalTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  personalMeta: {
    color: colors.gold,
    fontSize: typography.small,
  },
  personalBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 21,
  },
  personalLock: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  personalLockTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  personalLockBody: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
  requestTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  requestTitleWrap: {
    gap: 4,
  },
  requestTicker: {
    color: colors.textStrong,
    fontSize: 20,
    fontWeight: "800",
  },
  requestSymbol: {
    color: colors.textMuted,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  requestTier: {
    color: colors.gold,
    fontSize: typography.section,
    fontWeight: "800",
  },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: typography.small,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  requestBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 21,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  deliveryPromiseText: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 18,
  },
  readyLabel: {
    color: colors.success,
    fontSize: typography.body,
    fontWeight: "800",
  },
  deliveryNote: {
    color: colors.textStrong,
    fontSize: typography.body,
    lineHeight: 21,
  },
  deliveryLink: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "700",
  },
});
