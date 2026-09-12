import { MaterialCommunityIcons } from "@/components/StableIcons";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { pickAndUploadPaymentProof } from "@/features/storage/paymentProofs";
import { displayPlan } from "@/lib/display";
import { formatDate } from "@/lib/format";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

const benefits = ["Briefinguri video zilnice", "Acces complet pentru BTC, ETH, NQ și ES", "Notificări pentru conținut nou", "Toate AAR-urile gratuite rămân incluse"];

export default function MembershipScreen() {
  const { createPaymentRequest, membership, paymentRequests, session, user } = useAppState();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const defaultName = useMemo(() => user?.name ?? session?.user?.email?.split("@")[0] ?? "", [session?.user?.email, user?.name]);
  const defaultEmail = useMemo(() => user?.email ?? session?.user?.email ?? "", [session?.user?.email, user?.email]);
  const [fullName, setFullName] = useState(defaultName);
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [durationDays, setDurationDays] = useState<30 | 90>(30);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "usdt" | "redotpay">("paypal");
  const [paymentProof, setPaymentProof] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!fullName && defaultName) setFullName(defaultName);
    if (!contactEmail && defaultEmail) setContactEmail(defaultEmail);
  }, [contactEmail, defaultEmail, defaultName, fullName]);

  const submit = async () => {
    if (!session?.user) return setFeedback("Autentifică-te înainte să trimiți confirmarea.");
    if (!fullName.trim() || !contactEmail.trim()) return setFeedback("Completează numele și adresa de email.");
    if (!paymentProof.trim()) return setFeedback("Adaugă dovada plății sau o notă clară despre plată.");
    const result = await createPaymentRequest({ planTarget: "PRO", planLabel: `Premium ${durationDays} zile`, durationDays, fullName: fullName.trim(), contactEmail: contactEmail.trim(), paymentMethod, paymentProof: paymentProof.trim(), transactionRef: transactionRef.trim(), notes: notes.trim() });
    if (!result.success) return setFeedback(result.message);
    setShowConfirmation(false); setPaymentProof(""); setTransactionRef(""); setNotes(""); setFeedback("Confirmarea a fost trimisă. Activarea are loc după validarea plății.");
    Alert.alert("Confirmare trimisă", result.message);
  };

  const upload = async () => {
    const id = session?.user?.id ?? user?.id;
    if (!id) return setFeedback("Autentifică-te înainte să încarci dovada plății.");
    setUploading(true); const result = await pickAndUploadPaymentProof(id); setUploading(false);
    if (!result.success || !result.url) return setFeedback(result.message);
    setPaymentProof(result.url); setFeedback("");
  };

  return (
    <Screen webMaxWidth={980}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>MEMBERSHIP</Text><Text style={styles.title}>Premium Market Mechanism</Text><Text style={styles.body}>Alege durata, vezi beneficiile și trimite confirmarea într-un singur flux.</Text></View>
        <View style={styles.currentPlan}><Text style={styles.currentLabel}>PLAN CURENT</Text><Text style={styles.currentValue}>{displayPlan(membership.currentPlan)}</Text>{membership.expiresAt ? <Text style={styles.currentMeta}>până la {formatDate(membership.expiresAt)}</Text> : null}</View>
      </View>

      <View style={styles.planGrid}>
        <PlanCard days={30} price="10$" selected={durationDays === 30} onPress={() => setDurationDays(30)} />
        <PlanCard days={90} price="25$" selected={durationDays === 90} badge="Economisești" onPress={() => setDurationDays(90)} />
      </View>

      <View style={styles.benefitCard}>
        <Text style={styles.sectionTitle}>Ce deblochezi</Text>
        {benefits.map((benefit) => <View key={benefit} style={styles.benefitRow}><MaterialCommunityIcons name="check-circle" color={colors.success} size={19} /><Text style={styles.benefitText}>{benefit}</Text></View>)}
      </View>

      {feedback ? <View style={styles.feedback}><Text style={styles.feedbackText}>{feedback}</Text></View> : null}
      <PrimaryButton label={membership.currentPlan === "PRO" ? "Prelungește Premium" : `Continuă cu ${durationDays} zile`} onPress={() => { setFeedback(""); setShowConfirmation(true); }} />

      <CollapsibleSection title="Gratuit vs Premium" eyebrow="Comparație">
        <ComparisonLine label="After Action Review" free="Inclus" premium="Inclus" />
        <ComparisonLine label="Briefing video zilnic" free="Blocat" premium="Complet" />
        <ComparisonLine label="Piețe principale" free="Context public" premium="Acces complet" />
        <ComparisonLine label="Notificări" free="Limitate" premium="Incluse" />
      </CollapsibleSection>

      <CollapsibleSection title="Confirmări trimise" eyebrow="Istoric" rightLabel={String(paymentRequests.length)}>
        {paymentRequests.length ? paymentRequests.map((item) => <View key={item.id} style={styles.history}><View style={styles.historyTop}><Text style={styles.historyTitle}>{item.planLabel ?? "Premium"}</Text><Text style={styles.historyStatus}>{item.status === "verified" ? "Validată" : item.status === "rejected" ? "Respinsă" : "În verificare"}</Text></View><Text style={styles.currentMeta}>{formatDate(item.createdAt)} · {item.paymentMethod.toUpperCase()}</Text>{item.notes ? <Text style={styles.body}>{item.notes}</Text> : null}</View>) : <Text style={styles.body}>Nu ai trimis încă nicio confirmare.</Text>}
      </CollapsibleSection>

      <Modal visible={showConfirmation} transparent animationType="fade" onRequestClose={() => setShowConfirmation(false)}>
        <View style={styles.backdrop}><Pressable style={styles.scrim} onPress={() => setShowConfirmation(false)} /><View style={styles.modal}><ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.modalHeader}><View><Text style={styles.eyebrow}>CONFIRMARE PREMIUM</Text><Text style={styles.modalTitle}>{durationDays} zile · {durationDays === 30 ? "10$" : "25$"}</Text></View><Pressable onPress={() => setShowConfirmation(false)}><MaterialCommunityIcons name="close" color={colors.text} size={24} /></Pressable></View>
          <View style={styles.paymentBox}><PaymentLine label="PayPal" value="eugenfm95@gmail.com" /><PaymentLine label="USDT (TRC20)" value="TLuz2gAdrWjv7UbS9FTcrkH2Z7pCw2RZLx" /><PaymentLine label="RedotPay UserID" value="1838748987" /><Text style={styles.helper}>Validarea manuală poate dura până la 24 de ore.</Text></View>
          <Text style={styles.label}>Nume complet</Text><TextInput value={fullName} onChangeText={setFullName} style={styles.input} placeholder="Nume și prenume" placeholderTextColor={colors.textSoft} />
          <Text style={styles.label}>Email</Text><TextInput value={contactEmail} onChangeText={setContactEmail} style={styles.input} placeholder="email@exemplu.com" placeholderTextColor={colors.textSoft} autoCapitalize="none" keyboardType="email-address" />
          <Text style={styles.label}>Metodă</Text><View style={styles.methodRow}>{(["paypal", "usdt", "redotpay"] as const).map((method) => <PrimaryButton key={method} label={method === "paypal" ? "PayPal" : method === "usdt" ? "USDT" : "RedotPay"} variant={paymentMethod === method ? "gold" : "ghost"} onPress={() => setPaymentMethod(method)} />)}</View>
          <Text style={styles.label}>Dovadă plată</Text><TextInput value={paymentProof} onChangeText={setPaymentProof} style={[styles.input, styles.notes]} placeholder="Link, hash sau detalii" placeholderTextColor={colors.textSoft} multiline /><PrimaryButton label={uploading ? "Se încarcă…" : "Încarcă o captură"} variant="ghost" onPress={() => void upload()} />
          <Text style={styles.label}>Referință tranzacție</Text><TextInput value={transactionRef} onChangeText={setTransactionRef} style={styles.input} placeholder="ID / hash / referință" placeholderTextColor={colors.textSoft} autoCapitalize="none" />
          <Text style={styles.label}>Mesaj opțional</Text><TextInput value={notes} onChangeText={setNotes} style={[styles.input, styles.notes]} placeholder="Detalii pentru verificare" placeholderTextColor={colors.textSoft} multiline />
          {feedback ? <Text style={styles.error}>{feedback}</Text> : null}<PrimaryButton label="Trimite confirmarea" onPress={() => void submit()} /><PrimaryButton label="Închide" variant="ghost" onPress={() => setShowConfirmation(false)} />
        </ScrollView></View></View>
      </Modal>
    </Screen>
  );
}

function PlanCard({ days, price, selected, badge, onPress }: { days: number; price: string; selected: boolean; badge?: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.planCard, selected && styles.planCardSelected]}>{badge ? <Text style={styles.badge}>{badge}</Text> : null}<Text style={styles.planDays}>{days} zile</Text><Text style={styles.planPrice}>{price}</Text><Text style={styles.planCaption}>Acces Premium complet</Text><View style={[styles.radio, selected && styles.radioSelected]} /></Pressable>;
}
function ComparisonLine({ label, free, premium }: { label: string; free: string; premium: string }) { return <View style={styles.compare}><Text style={styles.compareLabel}>{label}</Text><Text style={styles.compareValue}>{free}</Text><Text style={[styles.compareValue, styles.comparePremium]}>{premium}</Text></View>; }
function PaymentLine({ label, value }: { label: string; value: string }) { return <View style={styles.paymentLine}><Text style={styles.helper}>{label}</Text><Text selectable style={styles.paymentValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  header: { alignItems: "center", backgroundColor: colors.bgGlass, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, padding: 20 },
  headerCopy: { flex: 1, gap: 8, minWidth: 240 }, eyebrow: { color: colors.gold, fontSize: typography.caption, fontWeight: "800", letterSpacing: 1.4 }, title: { color: colors.textStrong, fontSize: 30, fontWeight: "800" }, body: { color: colors.textSoft, fontSize: typography.body, lineHeight: 22 },
  currentPlan: { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle, borderRadius: radii.md, borderWidth: 1, minWidth: 180, padding: 16 }, currentLabel: { color: colors.textSoft, fontSize: typography.caption, fontWeight: "800", letterSpacing: 1 }, currentValue: { color: colors.goldBright, fontSize: typography.title, fontWeight: "800" }, currentMeta: { color: colors.textMuted, fontSize: typography.small },
  planGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, planCard: { backgroundColor: colors.bgGlass, borderColor: colors.borderSubtle, borderRadius: radii.lg, borderWidth: 1, flex: 1, gap: 7, minWidth: 240, padding: 20, position: "relative" }, planCardSelected: { backgroundColor: "rgba(212,175,55,0.05)", borderColor: colors.borderStrong }, badge: { alignSelf: "flex-start", color: colors.gold, fontSize: typography.caption, fontWeight: "800" }, planDays: { color: colors.textStrong, fontSize: typography.section, fontWeight: "800" }, planPrice: { color: colors.goldBright, fontSize: 34, fontWeight: "800" }, planCaption: { color: colors.textMuted, fontSize: typography.small }, radio: { borderColor: colors.textSoft, borderRadius: 9, borderWidth: 1, height: 18, position: "absolute", right: 18, top: 18, width: 18 }, radioSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  benefitCard: { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle, borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: 18 }, sectionTitle: { color: colors.textStrong, fontSize: typography.section, fontWeight: "800" }, benefitRow: { alignItems: "center", flexDirection: "row", gap: 10 }, benefitText: { color: colors.text, fontSize: typography.body }, feedback: { backgroundColor: colors.bgMuted, borderRadius: radii.md, padding: 14 }, feedbackText: { color: colors.goldBright, fontSize: typography.small },
  history: { backgroundColor: colors.bgMuted, borderRadius: radii.md, gap: 5, padding: 14 }, historyTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }, historyTitle: { color: colors.textStrong, fontSize: typography.body, fontWeight: "800" }, historyStatus: { color: colors.gold, fontSize: typography.small, fontWeight: "800" },
  compare: { alignItems: "center", borderBottomColor: colors.borderSubtle, borderBottomWidth: 1, flexDirection: "row", gap: spacing.sm, paddingVertical: 12 }, compareLabel: { color: colors.text, flex: 1, fontSize: typography.small, fontWeight: "700" }, compareValue: { color: colors.textMuted, flex: 0.6, fontSize: typography.small, textAlign: "right" }, comparePremium: { color: colors.goldBright, fontWeight: "800" },
  backdrop: { alignItems: "center", flex: 1, justifyContent: "center", padding: spacing.md }, scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.82)" }, modal: { backgroundColor: colors.bgPanel, borderColor: colors.borderStrong, borderRadius: radii.xl, borderWidth: 1, maxHeight: "92%", maxWidth: 680, overflow: "hidden", width: "100%" }, modalContent: { gap: spacing.sm, padding: 20 }, modalHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }, modalTitle: { color: colors.textStrong, fontSize: 26, fontWeight: "800" },
  paymentBox: { backgroundColor: colors.bgMuted, borderColor: colors.borderSubtle, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: 14 }, paymentLine: { gap: 3 }, paymentValue: { color: colors.textStrong, fontSize: typography.body, fontWeight: "700" }, helper: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
  label: { color: colors.text, fontSize: typography.small, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" }, input: { backgroundColor: colors.bgSoft, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, color: colors.text, fontSize: typography.body, minHeight: 50, paddingHorizontal: 14, paddingVertical: 12 }, notes: { minHeight: 86, textAlignVertical: "top" }, methodRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }, error: { color: colors.danger, fontSize: typography.small },
});
