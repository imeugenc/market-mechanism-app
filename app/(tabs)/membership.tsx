import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { pickAndUploadPaymentProof } from "@/features/storage/paymentProofs";
import { displayPlan } from "@/lib/display";
import { formatDate } from "@/lib/format";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

const comparison = [
  { label: "Review după mișcare", free: "Inclus", pro: "Inclus" },
  { label: "Briefing video zilnic", free: "Blocat", pro: "Deblocat" },
  { label: "Acces la toate piețele", free: "Limitat", pro: "Complet" },
  { label: "Notificări pentru analize", free: "Nu", pro: "Da" },
];

const benefits = [
  "Analiză zilnică video clară",
  "Plan de execuție structurat",
  "Fără zgomot, doar esențial",
];

export default function MembershipScreen() {
  const { createPaymentRequest, membership, paymentRequests, session, user } = useAppState();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const defaultName = useMemo(() => user?.name ?? session?.user?.email?.split("@")[0] ?? "", [session?.user?.email, user?.name]);
  const defaultEmail = useMemo(() => user?.email ?? session?.user?.email ?? "", [session?.user?.email, user?.email]);
  const [fullName, setFullName] = useState(defaultName);
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [selectedPlan, setSelectedPlan] = useState<"PRO">("PRO");
  const [durationDays, setDurationDays] = useState<30 | 90>(30);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "usdt" | "redotpay">("paypal");
  const [paymentProof, setPaymentProof] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);

  const resetForm = () => {
    setFullName(user?.name ?? session?.user?.email?.split("@")[0] ?? "");
    setContactEmail(user?.email ?? session?.user?.email ?? "");
    setSelectedPlan("PRO");
    setDurationDays(30);
    setPaymentMethod("paypal");
    setPaymentProof("");
    setTransactionRef("");
    setNotes("");
    setErrorMessage("");
  };

  const submitConfirmation = async () => {
    if (!session?.user) {
      setErrorMessage("Autentifică-te înainte să trimiți confirmarea pentru Premium.");
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage("Introdu numele complet.");
      return;
    }

    if (!contactEmail.trim()) {
      setErrorMessage("Introdu adresa de email.");
      return;
    }

    if (!paymentProof.trim()) {
      setErrorMessage("Introdu dovada plății sau o notă de plată.");
      return;
    }

    const result = await createPaymentRequest({
      planTarget: selectedPlan,
      planLabel: durationDays === 90 ? "Premium 90 zile" : "Premium 30 zile",
      durationDays,
      fullName: fullName.trim(),
      contactEmail: contactEmail.trim(),
      paymentMethod,
      paymentProof: paymentProof.trim(),
      transactionRef: transactionRef.trim(),
      notes: notes.trim(),
    });

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    setSuccessMessage("Contul tău Premium va deveni activ imediat ce plata este validată. Validarea poate dura până la 24 de ore.");
    setShowConfirmationModal(false);
    resetForm();
    Alert.alert("Confirmare trimisă", result.message);
  };

  const uploadProof = async () => {
    const activeUserId = session?.user?.id ?? user?.id;

    if (!activeUserId) {
      setErrorMessage("Autentifică-te înainte să încarci dovada plății.");
      return;
    }

    setUploadingProof(true);
    const result = await pickAndUploadPaymentProof(activeUserId);
    setUploadingProof(false);

    if (!result.success || !result.url) {
      setErrorMessage(result.message);
      return;
    }

    setPaymentProof(result.url);
    setErrorMessage("");
  };

  return (
    <Screen>
      <PremiumCard>
        <Text style={styles.eyebrow}>Premium</Text>
        <Text style={styles.title}>Deblochează analiza completă</Text>
        <Text style={styles.body}>
          Primești un produs construit pentru traderi serioși: briefing video zilnic, structură clară și focus pe ceea ce contează în execuție.
        </Text>
        <View style={styles.heroStrip}>
          <Text style={styles.heroStripText}>BTC • ETH • NQ • ES</Text>
          <Text style={styles.heroStripText}>Briefing premium</Text>
        </View>
        <View style={styles.benefitList}>
          {benefits.map((item) => (
            <View key={item} style={styles.benefitRow}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name="check-bold" size={14} color="#050505" />
              </View>
              <Text style={styles.benefitText}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={styles.trustBand}>
          <Text style={styles.trustText}>Răspuns rapid. Execuție clară.</Text>
        </View>
        <PrimaryButton
          label={membership.currentPlan === "FREE" ? "Trimite confirmarea pentru premium" : "Prelungește Premium"}
          onPress={() => {
            setSuccessMessage("");
            setShowConfirmationModal(true);
          }}
        />
      </PremiumCard>

      <Modal visible={showConfirmationModal} transparent animationType="fade" onRequestClose={() => setShowConfirmationModal(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalScrim} onPress={() => setShowConfirmationModal(false)} />
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalTopRow}>
                <PrimaryButton label="Înapoi" variant="ghost" onPress={() => setShowConfirmationModal(false)} />
              </View>
              <Text style={styles.eyebrow}>Confirmare Premium</Text>
              <Text style={styles.modalTitle}>Trimite datele pentru activare</Text>
              <Text style={styles.body}>
                Completează formularul și trimite dovada plății. Cererea va apărea imediat în panoul de administrare pentru verificare.
              </Text>

              <View style={styles.paymentCard}>
                <Text style={styles.paymentHeadline}>Metode de plată</Text>
                <Text style={styles.paymentValue}>PayPal: eugenfm95@gmail.com</Text>
                <Text style={styles.paymentValue}>USDT (TRC20): TLuz2gAdrWjv7UbS9FTcrkH2Z7pCw2RZLx</Text>
                <Text style={styles.paymentValue}>Redotpay UserID: 1838748987</Text>
                <Text style={styles.paymentNote}>După plată, trimite dovada sau referința tranzacției în formularul de mai jos.</Text>
              </View>

              <Text style={styles.formLabel}>Nume complet</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                placeholder="Nume și prenume"
                placeholderTextColor="#6F6A5C"
              />

              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                value={contactEmail}
                onChangeText={setContactEmail}
                style={styles.input}
                placeholder="nume@email.com"
                placeholderTextColor="#6F6A5C"
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.formLabel}>Plan selectat</Text>
              <View style={styles.methodRow}>
                <PrimaryButton
                  label="Premium"
                  variant={selectedPlan === "PRO" ? "gold" : "ghost"}
                  onPress={() => setSelectedPlan("PRO")}
                />
              </View>

              <Text style={styles.formLabel}>Durată acces</Text>
              <View style={styles.pricingBand}>
                <Text style={styles.pricingText}>30 zile = 10$</Text>
                <Text style={styles.pricingText}>90 zile = 25$</Text>
              </View>
              <View style={styles.methodRow}>
                <PrimaryButton
                  label="30 zile • 10$"
                  variant={durationDays === 30 ? "gold" : "ghost"}
                  onPress={() => setDurationDays(30)}
                />
                <PrimaryButton
                  label="90 zile • 25$"
                  variant={durationDays === 90 ? "gold" : "ghost"}
                  onPress={() => setDurationDays(90)}
                />
              </View>

              <Text style={styles.formLabel}>Metodă de plată</Text>
              <View style={styles.methodRow}>
                <PrimaryButton
                  label="PayPal"
                  variant={paymentMethod === "paypal" ? "gold" : "ghost"}
                  onPress={() => setPaymentMethod("paypal")}
                />
                <PrimaryButton
                  label="USDT"
                  variant={paymentMethod === "usdt" ? "gold" : "ghost"}
                  onPress={() => setPaymentMethod("usdt")}
                />
                <PrimaryButton
                  label="Redotpay"
                  variant={paymentMethod === "redotpay" ? "gold" : "ghost"}
                  onPress={() => setPaymentMethod("redotpay")}
                />
              </View>

              <Text style={styles.formLabel}>Dovadă plată / notă plată</Text>
              <TextInput
                value={paymentProof}
                onChangeText={setPaymentProof}
                style={[styles.input, styles.notes]}
                multiline
                placeholder="Link către captură, link cloud, hash tranzacție sau o notă clară despre plată"
                placeholderTextColor="#6F6A5C"
              />
              <PrimaryButton
                label={uploadingProof ? "Se încarcă dovada..." : "Încarcă captură / dovadă"}
                variant="ghost"
                onPress={() => void uploadProof()}
              />
              <Text style={styles.helperText}>
                Poți încărca o captură direct din telefon sau poți lipi manual un link / hash / referință de plată.
              </Text>

              <Text style={styles.formLabel}>Referință tranzacție</Text>
              <TextInput
                value={transactionRef}
                onChangeText={setTransactionRef}
                style={styles.input}
                placeholder="ID tranzacție / hash / referință"
                placeholderTextColor="#6F6A5C"
                autoCapitalize="none"
              />

              <Text style={styles.formLabel}>Mesaj opțional</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={[styles.input, styles.notes]}
                multiline
                placeholder="Detalii suplimentare pentru verificare"
                placeholderTextColor="#6F6A5C"
              />

              {errorMessage ? <Text style={styles.feedbackError}>{errorMessage}</Text> : null}

              <PrimaryButton label="Trimite confirmarea" onPress={submitConfirmation} />
              <PrimaryButton label="Închide" variant="ghost" onPress={() => setShowConfirmationModal(false)} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SectionHeader eyebrow="Status curent" title={`${displayPlan(membership.currentPlan)} activ`} />
      <View style={styles.statusCard}>
        <Text style={styles.statusHeadline}>
          {membership.currentPlan === "FREE" ? "Acces Gratuit cu review-uri utile" : "Acces Premium cu analiză zilnică completă"}
        </Text>
        <Text style={styles.statusBody}>
          Utilizatorii Gratuit văd review-urile după mișcare. Membrii Premium primesc analiza video completă și un flux mai clar de execuție.
        </Text>
        <Text style={styles.statusBody}>Plan activ: {membership.planLabel ?? (membership.currentPlan === "PRO" ? "Premium All Access" : "Acces Gratuit")}</Text>
        <Text style={styles.statusBody}>Expirare: {membership.expiresAt ? formatDate(membership.expiresAt) : "Nu este setată încă"}</Text>
        <Text style={styles.statusBody}>Reînnoire: {membership.renewalMode === "manual" ? "Confirmare manuală" : "Fără reînnoire"}</Text>
        {successMessage ? <Text style={styles.feedbackSuccess}>{successMessage}</Text> : null}
      </View>

      <SectionHeader eyebrow="Metode de plată" title="Instrucțiuni rapide" />
      <View style={styles.paymentCard}>
        <Text style={styles.paymentHeadline}>PayPal</Text>
        <Text style={styles.paymentValue}>eugenfm95@gmail.com</Text>
        <Text style={styles.paymentHeadline}>USDT (TRC20)</Text>
        <Text style={styles.paymentValue}>TLuz2gAdrWjv7UbS9FTcrkH2Z7pCw2RZLx</Text>
        <Text style={styles.paymentHeadline}>Redotpay UserID</Text>
        <Text style={styles.paymentValue}>1838748987</Text>
        <Text style={styles.paymentNote}>
          După ce efectuezi plata, revino în aplicație și trimite confirmarea cu nr. tranzacției sau atașează o captură de ecran.
        </Text>
        <Text style={styles.paymentNote}>Confirmarea plății este manuală și poate dura până la 24h.</Text>
      </View>

      <SectionHeader eyebrow="Confirmare" title="Trimite dovada pentru upgrade" />
      <View style={styles.formCard}>
        <Text style={styles.formLabel}>Nume complet</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
          placeholder="Nume și prenume"
          placeholderTextColor="#6F6A5C"
        />

        <Text style={styles.formLabel}>Email</Text>
        <TextInput
          value={contactEmail}
          onChangeText={setContactEmail}
          style={styles.input}
          placeholder="nume@email.com"
          placeholderTextColor="#6F6A5C"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.formLabel}>Plan selectat</Text>
        <View style={styles.methodRow}>
          <PrimaryButton
            label="Premium"
            variant={selectedPlan === "PRO" ? "gold" : "ghost"}
            onPress={() => setSelectedPlan("PRO")}
          />
        </View>

        <Text style={styles.formLabel}>Durată acces</Text>
        <View style={styles.pricingBand}>
          <Text style={styles.pricingText}>30 zile = 10$</Text>
          <Text style={styles.pricingText}>90 zile = 25$</Text>
        </View>
        <View style={styles.methodRow}>
          <PrimaryButton
            label="30 zile • 10$"
            variant={durationDays === 30 ? "gold" : "ghost"}
            onPress={() => setDurationDays(30)}
          />
          <PrimaryButton
            label="90 zile • 25$"
            variant={durationDays === 90 ? "gold" : "ghost"}
            onPress={() => setDurationDays(90)}
          />
        </View>

        <Text style={styles.formLabel}>Metodă de plată</Text>
        <View style={styles.methodRow}>
          <PrimaryButton
            label="PayPal"
            variant={paymentMethod === "paypal" ? "gold" : "ghost"}
            onPress={() => setPaymentMethod("paypal")}
          />
          <PrimaryButton
            label="USDT"
            variant={paymentMethod === "usdt" ? "gold" : "ghost"}
            onPress={() => setPaymentMethod("usdt")}
          />
          <PrimaryButton
            label="Redotpay"
            variant={paymentMethod === "redotpay" ? "gold" : "ghost"}
            onPress={() => setPaymentMethod("redotpay")}
          />
        </View>

        <Text style={styles.formLabel}>Dovadă plată</Text>
        <TextInput
          value={paymentProof}
          onChangeText={setPaymentProof}
          style={[styles.input, styles.notes]}
          multiline
          placeholder="Ex: link captură, link cloud, email PayPal, hash tranzacție"
          placeholderTextColor="#6F6A5C"
        />
        <Text style={styles.helperText}>
          Dacă nu încarci încă fișier direct din telefon, folosește un link către captură sau adaugă hash-ul / referința plății.
        </Text>

        <Text style={styles.formLabel}>Nr. tranzacției</Text>
        <TextInput
          value={transactionRef}
          onChangeText={setTransactionRef}
          style={styles.input}
          placeholder="ID tranzacție / hash / referință"
          placeholderTextColor="#6F6A5C"
          autoCapitalize="none"
        />

        <Text style={styles.formLabel}>Detalii suplimentare</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, styles.notes]}
          multiline
          placeholder="Mesaj opțional pentru confirmare"
          placeholderTextColor="#6F6A5C"
        />

        <PrimaryButton
          label="Trimite confirmarea"
          onPress={submitConfirmation}
        />
        {errorMessage ? <Text style={styles.feedbackError}>{errorMessage}</Text> : null}
      </View>

      {paymentRequests.length ? (
        <>
          <SectionHeader eyebrow="Istoric plăți" title="Confirmări trimise" />
          <View style={styles.historyList}>
            {paymentRequests.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <Text style={styles.historyTitle}>{item.fullName} • Upgrade Premium • {item.paymentMethod.toUpperCase()}</Text>
                <Text style={styles.historyMeta}>
                  {item.status === "verified" ? "Validată" : item.status === "rejected" ? "Respinsă" : "În procesare / validare"} • {formatDate(item.createdAt)}
                </Text>
                <Text style={styles.historyBody}>Email: {item.contactEmail}</Text>
                <Text style={styles.historyBody}>{item.paymentProof}</Text>
                {item.notes ? <Text style={styles.historyBody}>Mesaj: {item.notes}</Text> : null}
                <Text style={styles.historyBody}>
                  {item.status === "verified"
                    ? "Contul tău Premium este activ."
                    : item.status === "rejected"
                      ? "Cererea a fost respinsă. Poți retrimite confirmarea cu o dovadă mai clară."
                      : "Cererea a fost primită și este în curs de verificare manuală."}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader eyebrow="Comparativ" title="Gratuit vs Premium" />
      <View style={styles.table}>
        {comparison.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <View style={styles.column}>
              <Text style={styles.columnTitle}>GRATUIT</Text>
              <Text style={styles.columnValue}>{row.free}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnTitle}>Premium</Text>
              <Text style={[styles.columnValue, styles.proValue]}>{row.pro}</Text>
            </View>
          </View>
        ))}
      </View>

      <SectionHeader eyebrow="Cont" title="Gestionează abonamentul" />
      <View style={styles.actions}>
        <PrimaryButton label="Gestionează abonamentul" variant="ghost" onPress={() => setShowManagementModal(true)} />
      </View>

      <Modal visible={showManagementModal} transparent animationType="fade" onRequestClose={() => setShowManagementModal(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalScrim} onPress={() => setShowManagementModal(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalContent}>
              <Text style={styles.eyebrow}>Abonamentul meu</Text>
              <Text style={styles.modalTitle}>Status și pași utili</Text>
              <Text style={styles.body}>Aici vezi exact unde se află accesul tău și ce trebuie să faci pentru activare sau reînnoire.</Text>
              <View style={styles.statusCard}>
                <Text style={styles.statusBody}>Plan curent: {membership.planLabel ?? (membership.currentPlan === "PRO" ? "Premium All Access" : "Acces Gratuit")}</Text>
                <Text style={styles.statusBody}>Nivel acces: {displayPlan(membership.currentPlan)}</Text>
                <Text style={styles.statusBody}>Expirare: {membership.expiresAt ? formatDate(membership.expiresAt) : "Nu este setată încă"}</Text>
                <Text style={styles.statusBody}>Reînnoire: {membership.renewalMode === "manual" ? "Manuală după confirmarea plății" : "Nesetată"}</Text>
              </View>
              <Text style={styles.paymentNote}>Flux clar: vezi metodele de plată, plătești, trimiți confirmarea, apoi adminul aprobă sau respinge cererea. La aprobare, planul devine Premium imediat.</Text>
              <PrimaryButton label="Trimite confirmarea pentru premium" onPress={() => {
                setShowManagementModal(false);
                setShowConfirmationModal(true);
              }} />
              <PrimaryButton label="Închide" variant="ghost" onPress={() => setShowManagementModal(false)} />
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 31,
    lineHeight: 34,
    fontWeight: "800",
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  heroStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroStripText: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  benefitList: {
    gap: 12,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
  },
  benefitText: {
    flex: 1,
    color: colors.textStrong,
    fontSize: typography.body,
    fontWeight: "700",
  },
  trustBand: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  trustText: {
    color: colors.goldBright,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "800",
  },
  statusCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: 10,
  },
  statusHeadline: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  statusBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  table: {
    gap: spacing.sm,
  },
  row: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgPanel,
    padding: 16,
    gap: 12,
  },
  rowLabel: {
    color: colors.textStrong,
    fontSize: typography.body,
    fontWeight: "800",
  },
  column: {
    gap: 4,
  },
  columnTitle: {
    color: colors.textMuted,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  columnValue: {
    color: colors.text,
    fontSize: typography.body,
  },
  proValue: {
    color: colors.gold,
  },
  actions: {
    gap: spacing.sm,
  },
  paymentCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: 10,
  },
  paymentHeadline: {
    color: colors.goldBright,
    fontSize: typography.caption,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "800",
  },
  paymentValue: {
    color: colors.textStrong,
    fontSize: typography.body,
    fontWeight: "700",
  },
  paymentNote: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: 4,
  },
  formCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgPanel,
    padding: 18,
    gap: spacing.sm,
  },
  formLabel: {
    color: colors.text,
    fontSize: typography.small,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontWeight: "700",
  },
  methodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pricingBand: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pricingText: {
    color: colors.goldBright,
    fontSize: typography.small,
    fontWeight: "800",
    letterSpacing: 0.3,
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
  },
  notes: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  helperText: {
    color: colors.textMuted,
    fontSize: typography.small,
    lineHeight: 18,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgPanel,
    padding: 16,
    gap: 8,
  },
  historyTitle: {
    color: colors.textStrong,
    fontSize: typography.body,
    fontWeight: "800",
  },
  historyMeta: {
    color: colors.gold,
    fontSize: typography.small,
  },
  historyBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 21,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "center",
    padding: 18,
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bg,
    maxHeight: "88%",
    overflow: "hidden",
  },
  modalContent: {
    padding: 20,
    gap: spacing.sm,
  },
  modalTopRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  modalTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  feedbackSuccess: {
    color: colors.goldBright,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: "700",
  },
  feedbackError: {
    color: "#F2B8A0",
    fontSize: typography.body,
    lineHeight: 22,
  },
});
