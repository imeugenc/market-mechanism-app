import { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ContentStatePanel } from "@/components/ContentStatePanel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { TierCard } from "@/components/TierCard";
import { pickAndUploadPaymentProof } from "@/features/storage/paymentProofs";
import { REQUEST_TIERS } from "@/features/requests/tiers";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";
import { RequestStatus, RequestTier } from "@/types/domain";

type PageMode = "mine" | "request";
type HistoryFilter = "active" | "delivered" | "all";

const statusLabel: Record<RequestStatus, string> = {
  pending: "În așteptare",
  accepted: "În lucru",
  delivered: "Livrată",
  cancelled: "Anulată",
};

export default function RequestsScreen() {
  const { createRequest, notifications, personalRequests, protectedDataState, requests, session, user } = useAppState();
  const activeEmail = session?.user?.email ?? user?.email ?? "";
  const isAuthenticated = Boolean(session?.user);
  const [mode, setMode] = useState<PageMode>("mine");
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("active");
  const [assetInput, setAssetInput] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [tier, setTier] = useState<RequestTier>(5);
  const [notes, setNotes] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const selectedTier = REQUEST_TIERS.find((item) => item.tier === tier) ?? REQUEST_TIERS[1];

  const filterStatus = (status: RequestStatus) => historyFilter === "all" || (historyFilter === "delivered" ? status === "delivered" : status !== "delivered" && status !== "cancelled");
  const visibleRequests = requests.filter((item) => filterStatus(item.status));
  const visibleDeliveries = personalRequests.filter((item) => filterStatus(item.status));
  const totalVisible = visibleRequests.length + visibleDeliveries.length;

  const handleSubmit = async () => {
    if (assetInput.trim().length < 2) return setError("Introdu un activ sau ticker valid.");
    if (!isAuthenticated && requesterEmail.trim().length < 5) return setError("Introdu o adresă de email validă.");
    const result = await createRequest({ assetInput: assetInput.trim(), requesterEmail: requesterEmail.trim(), tier, notes: notes.trim(), paymentProof: paymentProof.trim(), paymentReference: paymentReference.trim() });
    if (!result.success) return setError(result.message);
    setAssetInput(""); setRequesterEmail(""); setNotes(""); setPaymentProof(""); setPaymentReference(""); setError(""); setMode("mine");
    Alert.alert("Cerere trimisă", "Cererea apare acum în Analizele mele. Termenul de livrare începe după verificarea plății și acceptare.");
  };

  const uploadProof = async () => {
    const userId = session?.user?.id ?? user?.id;
    if (!userId) return setError("Autentifică-te înainte să încarci dovada plății.");
    setUploadingProof(true);
    const result = await pickAndUploadPaymentProof(userId);
    setUploadingProof(false);
    if (!result.success || !result.url) return setError(result.message);
    setPaymentProof(result.url); setError("");
  };

  return (
    <Screen>
      <SectionHeader eyebrow="Analize" title="Analize personale" caption="Urmărește cererile și livrările tale sau trimite o solicitare nouă." />
      <SegmentedControl value={mode} options={[{ value: "mine", label: "Analizele mele" }, { value: "request", label: "Solicită analiză" }]} onChange={setMode} />

      {mode === "mine" ? (
        <>
          <SegmentedControl value={historyFilter} options={[{ value: "active", label: "Active" }, { value: "delivered", label: "Livrate" }, { value: "all", label: "Toate" }]} onChange={setHistoryFilter} />
          {protectedDataState === "loading" ? <ContentStatePanel kind="loading" title="Se încarcă analizele tale…" /> : null}
          {protectedDataState === "error" ? <ContentStatePanel kind="error" title="Nu am putut încărca analizele tale" /> : null}
          {protectedDataState === "ready" && !totalVisible ? <ContentStatePanel kind="empty" title={historyFilter === "delivered" ? "Nu ai încă analize livrate" : historyFilter === "active" ? "Nu ai cereri active" : "Nu ai încă analize personale"} message="Poți trimite o solicitare nouă din secțiunea alăturată." /> : null}
          {protectedDataState === "ready" ? <View style={styles.list}>
            {visibleRequests.map((request) => <View key={`request-${request.id}`} style={styles.item}>
              <View style={styles.itemTop}><View><Text style={styles.itemEyebrow}>CERERE · {request.assetInput}</Text><Text style={styles.itemTitle}>{request.deliveryType === "video" ? "Analiză video" : "Analiză rapidă"}</Text></View><StatusBadge status={request.status} /></View>
              <Text style={styles.meta}>{formatDate(request.requestedAt)} · {formatCurrency(request.tier)}</Text>
              {request.notes ? <Text style={styles.body}>{request.notes}</Text> : null}
              <View style={styles.lifecycle}><Text style={styles.lifecycleText}>Trimisă</Text><Text style={styles.arrow}>›</Text><Text style={styles.lifecycleText}>{request.paymentStatus === "paid" ? "Plată verificată" : "Plată în verificare"}</Text><Text style={styles.arrow}>›</Text><Text style={styles.lifecycleText}>{statusLabel[request.status]}</Text></View>
              {request.adminNotes || request.deliveryNotes ? <Text style={styles.deliveryNote}>{request.deliveryNotes ?? request.adminNotes}</Text> : null}
              {request.status === "delivered" && (request.deliveryVideoUrl || request.deliveryUrl) ? <PrimaryButton label="Deschide analiza livrată" onPress={() => void Linking.openURL((request.deliveryVideoUrl || request.deliveryUrl)!)} /> : null}
            </View>)}
            {visibleDeliveries.map((item) => <View key={`delivery-${item.id}`} style={styles.item}>
              <View style={styles.itemTop}><View><Text style={styles.itemEyebrow}>LIVRARE PRIVATĂ</Text><Text style={styles.itemTitle}>{item.title}</Text></View><StatusBadge status={item.status} /></View>
              <Text style={styles.meta}>{formatDate(item.createdAt)}{item.tier ? ` · ${formatCurrency(item.tier)}` : ""}</Text>
              {item.notes ? <Text style={styles.body}>{item.notes}</Text> : null}
              {item.status === "delivered" && item.videoUrl ? <PrimaryButton label="Deschide analiza livrată" onPress={() => void Linking.openURL(item.videoUrl!)} /> : null}
            </View>)}
          </View> : null}
          <PrimaryButton label="Solicită o analiză nouă" onPress={() => setMode("request")} />
        </>
      ) : (
        <>
          <View style={styles.promise}><Text style={styles.promiseTitle}>Proces clar, urmărit în aplicație</Text><Text style={styles.body}>Trimisă → Plata în verificare → Acceptată → În lucru → Livrată</Text><Text style={styles.promiseNote}>Termenul de livrare începe după verificarea plății și acceptarea cererii.</Text></View>

          <SectionHeader eyebrow="Pasul 1" title="Alege tipul analizei" />
          <View style={styles.tiers}>{REQUEST_TIERS.map((item) => <TierCard key={item.tier} tier={item.tier} title={item.title} selected={tier === item.tier} description={item.description} deliveryLabel={item.deliveryLabel} turnaround={item.turnaround} onPress={() => setTier(item.tier)} />)}</View>

          <SectionHeader eyebrow="Pasul 2" title="Descrie solicitarea" />
          <View style={styles.form}>
            <Text style={styles.label}>Activ / Ticker</Text><TextInput value={assetInput} onChangeText={(value) => { setAssetInput(value); setError(""); }} style={styles.input} placeholder="Ex: NQ, BTC, SOL" placeholderTextColor={colors.textSoft} autoCapitalize="characters" />
            {!isAuthenticated ? <><Text style={styles.label}>Email</Text><TextInput value={requesterEmail} onChangeText={setRequesterEmail} style={styles.input} placeholder="email@exemplu.com" placeholderTextColor={colors.textSoft} autoCapitalize="none" keyboardType="email-address" /></> : <View style={styles.emailNote}><Text style={styles.meta}>Confirmarea va fi trimisă la {activeEmail}</Text></View>}
            <Text style={styles.label}>Context suplimentar</Text><TextInput value={notes} onChangeText={setNotes} style={[styles.input, styles.textarea]} placeholder="Setup, interval, întrebarea principală…" placeholderTextColor={colors.textSoft} multiline />
          </View>

          <SectionHeader eyebrow="Pasul 3" title="Confirmă plata" />
          <View style={styles.form}>
            <View style={styles.orderSummary}><Text style={styles.itemTitle}>{selectedTier.title}</Text><Text style={styles.price}>{formatCurrency(selectedTier.tier)}</Text></View>
            <Pressable onPress={() => setShowPaymentDetails((value) => !value)} style={styles.disclosure}><Text style={styles.disclosureText}>{showPaymentDetails ? "Ascunde metodele de plată" : "Vezi metodele de plată"}</Text><Text style={styles.arrow}>{showPaymentDetails ? "⌃" : "⌄"}</Text></Pressable>
            {showPaymentDetails ? <View style={styles.paymentDetails}><PaymentLine label="PayPal" value="eugenfm95@gmail.com" /><PaymentLine label="USDT (TRC20)" value="TLuz2gAdrWjv7UbS9FTcrkH2Z7pCw2RZLx" /><PaymentLine label="RedotPay UserID" value="1838748987" /><Text style={styles.promiseNote}>Verificarea manuală a plății poate dura până la 24 de ore.</Text></View> : null}
            <Text style={styles.label}>Dovadă plată</Text><TextInput value={paymentProof} onChangeText={setPaymentProof} style={[styles.input, styles.textarea]} placeholder="Link sau detalii despre dovadă" placeholderTextColor={colors.textSoft} multiline />
            <PrimaryButton label={uploadingProof ? "Se încarcă…" : "Încarcă o captură"} variant="ghost" onPress={() => void uploadProof()} />
            <Text style={styles.label}>Referință tranzacție</Text><TextInput value={paymentReference} onChangeText={setPaymentReference} style={styles.input} placeholder="ID / hash / referință" placeholderTextColor={colors.textSoft} autoCapitalize="none" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Trimite cererea" onPress={() => void handleSubmit()} />
          </View>
          {notifications[0] ? <View style={styles.notice}><Text style={styles.itemTitle}>{notifications[0].title}</Text><Text style={styles.body}>{notifications[0].body}</Text></View> : null}
        </>
      )}
    </Screen>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return <View style={[styles.status, status === "delivered" && styles.statusDelivered, status === "cancelled" && styles.statusCancelled]}><Text style={styles.statusText}>{statusLabel[status]}</Text></View>;
}

function PaymentLine({ label, value }: { label: string; value: string }) {
  return <View style={styles.paymentLine}><Text style={styles.meta}>{label}</Text><Text selectable style={styles.paymentValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm }, tiers: { gap: spacing.sm },
  item: { backgroundColor: colors.bgGlass, borderColor: colors.borderSubtle, borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: 18 },
  itemTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  itemEyebrow: { color: colors.gold, fontSize: typography.caption, fontWeight: "800", letterSpacing: 1.1 },
  itemTitle: { color: colors.textStrong, fontSize: typography.section, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
  body: { color: colors.textSoft, fontSize: typography.body, lineHeight: 22 },
  status: { backgroundColor: "rgba(212,175,55,0.1)", borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  statusDelivered: { backgroundColor: "rgba(67,196,125,0.12)" }, statusCancelled: { backgroundColor: "rgba(214,92,92,0.12)" },
  statusText: { color: colors.text, fontSize: typography.caption, fontWeight: "800" },
  lifecycle: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 6 },
  lifecycleText: { color: colors.textMuted, fontSize: typography.caption, fontWeight: "700" }, arrow: { color: colors.gold, fontSize: typography.body },
  deliveryNote: { backgroundColor: colors.bgMuted, borderRadius: radii.sm, color: colors.text, fontSize: typography.body, lineHeight: 22, padding: 12 },
  promise: { backgroundColor: "rgba(212,175,55,0.045)", borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, gap: 7, padding: 18 },
  promiseTitle: { color: colors.textStrong, fontSize: typography.section, fontWeight: "800" }, promiseNote: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
  form: { backgroundColor: colors.bgPanel, borderColor: colors.borderSubtle, borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: 18 },
  label: { color: colors.text, fontSize: typography.small, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  input: { backgroundColor: colors.bgSoft, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, color: colors.text, fontSize: typography.body, minHeight: 50, paddingHorizontal: 14, paddingVertical: 12 },
  textarea: { minHeight: 90, textAlignVertical: "top" }, emailNote: { backgroundColor: colors.bgMuted, borderRadius: radii.sm, padding: 12 },
  orderSummary: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }, price: { color: colors.goldBright, fontSize: typography.title, fontWeight: "800" },
  disclosure: { alignItems: "center", borderColor: colors.borderSubtle, borderRadius: radii.md, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", padding: 14 }, disclosureText: { color: colors.text, fontSize: typography.body, fontWeight: "800" },
  paymentDetails: { gap: spacing.sm }, paymentLine: { backgroundColor: colors.bgMuted, borderRadius: radii.sm, gap: 4, padding: 12 }, paymentValue: { color: colors.textStrong, fontSize: typography.body, fontWeight: "700" },
  error: { color: colors.danger, fontSize: typography.small }, notice: { backgroundColor: colors.bgMuted, borderRadius: radii.md, gap: 6, padding: 14 },
});
