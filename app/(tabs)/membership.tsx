import { MaterialCommunityIcons } from "@/components/StableIcons";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { marketBilling, MarketBillingStatus } from "@/features/payments/market-billing";
import { displayPlan } from "@/lib/display";
import { formatDate } from "@/lib/format";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";

const benefits = ["Briefinguri video zilnice", "Acces complet pentru BTC, ETH, NQ și ES", "Notificări pentru conținut nou", "Toate AAR-urile gratuite rămân incluse"];

export default function MembershipScreen() {
  const { membership, paymentRequests, session } = useAppState();
  const [durationDays, setDurationDays] = useState<30 | 90>(30);
  const [feedback, setFeedback] = useState("");
  const [billing, setBilling] = useState<MarketBillingStatus["subscription"]>(null);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    void marketBilling("status").then((result) => setBilling(result.subscription)).catch(() => setFeedback("Starea abonamentului este temporar indisponibilă."));
  }, [session?.user?.id]);

  const checkout = async () => {
    setBusy(true); setFeedback("");
    try {
      const result = await marketBilling("checkout", durationDays === 30 ? "monthly" : "quarterly");
      if (!result.url) throw new Error("Plata nu a putut fi deschisă.");
      await Linking.openURL(result.url);
    } catch (error) { setFeedback(String((error as Error).message)); }
    finally { setBusy(false); }
  };

  const changeRenewal = async (action: "cancel" | "resume") => {
    setBusy(true); setFeedback("");
    try {
      const result = await marketBilling(action);
      setBilling((current) => current ? { ...current, cancelAtPeriodEnd: Boolean(result.cancelAtPeriodEnd) } : current);
      setConfirmCancel(false);
      setFeedback(action === "cancel" ? "Reînnoirea s-a oprit. Premium rămâne activ până la sfârșitul perioadei plătite." : "Reînnoirea automată a fost reluată.");
    } catch (error) { setFeedback(String((error as Error).message)); }
    finally { setBusy(false); }
  };

  return (
    <Screen webMaxWidth={980}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>MEMBERSHIP</Text><Text style={styles.title}>Premium Market Mechanism</Text><Text style={styles.body}>Alege planul și activează Premium în siguranță prin Stripe.</Text></View>
        <View style={styles.currentPlan}><Text style={styles.currentLabel}>PLAN CURENT</Text><Text style={styles.currentValue}>{displayPlan(membership.currentPlan)}</Text>{membership.accessSource ? <Text style={styles.currentMeta}>{membership.accessSource === "market_paid" ? "Abonament Market" : membership.accessSource.startsWith("journal_") ? "Inclus prin MM Edge Journal" : membership.accessSource === "market_manual" ? "Acces Market acordat manual" : "Acces Owner"}</Text> : null}{membership.expiresAt ? <Text style={styles.currentMeta}>până la {formatDate(membership.expiresAt)}</Text> : null}</View>
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
      {billing ? <View style={styles.feedback}><Text style={styles.feedbackText}>{billing.cancelAtPeriodEnd ? "Reînnoirea este anulată" : "Abonament Stripe activ"}{billing.paidThroughAt ? ` · acces până la ${formatDate(billing.paidThroughAt)}` : ""}</Text></View> : null}
      {membership.accessSource === "owner"
        ? <Text style={styles.body}>Acces Owner activ, fără expirare.</Text>
        : billing && !billing.cancelAtPeriodEnd && billing.paidThroughAt && Date.parse(billing.paidThroughAt) > Date.now()
        ? <><PrimaryButton label={confirmCancel ? "Confirmă anularea" : "Anulează reînnoirea"} variant="ghost" onPress={() => confirmCancel ? void changeRenewal("cancel") : setConfirmCancel(true)} /><Text style={styles.body}>{confirmCancel ? "Premium rămâne activ până la sfârșitul perioadei plătite, apoi nu se mai reînnoiește." : ""}</Text></>
        : billing?.cancelAtPeriodEnd && billing.paidThroughAt && Date.parse(billing.paidThroughAt) > Date.now()
          ? <PrimaryButton label="Reia reînnoirea" onPress={() => void changeRenewal("resume")} />
          : <PrimaryButton label={busy ? "Se deschide plata…" : `Abonează-te pentru ${durationDays} zile`} onPress={() => void checkout()} />}

      <CollapsibleSection title="Gratuit vs Premium" eyebrow="Comparație">
        <ComparisonLine label="After Action Review" free="Inclus" premium="Inclus" />
        <ComparisonLine label="Briefing video zilnic" free="Blocat" premium="Complet" />
        <ComparisonLine label="Piețe principale" free="Context public" premium="Acces complet" />
        <ComparisonLine label="Notificări" free="Limitate" premium="Incluse" />
      </CollapsibleSection>

      <CollapsibleSection title="Plăți manuale anterioare" eyebrow="Istoric" rightLabel={String(paymentRequests.length)}>
        {paymentRequests.length ? paymentRequests.map((item) => <View key={item.id} style={styles.history}><View style={styles.historyTop}><Text style={styles.historyTitle}>{item.planLabel ?? "Premium"}</Text><Text style={styles.historyStatus}>{item.status === "verified" ? "Validată" : item.status === "rejected" ? "Respinsă" : "În verificare"}</Text></View><Text style={styles.currentMeta}>{formatDate(item.createdAt)} · {item.paymentMethod.toUpperCase()}</Text>{item.notes ? <Text style={styles.body}>{item.notes}</Text> : null}</View>) : <Text style={styles.body}>Nu ai trimis încă nicio confirmare.</Text>}
      </CollapsibleSection>

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
