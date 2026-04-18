import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { formatDate } from "@/lib/format";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";
import { Market, PaymentStatus, RequestStatus, UserPlan } from "@/types/domain";

export default function AdminScreen() {
  const {
    adminUsers,
    authReady,
    analyses,
    deleteAnalysis,
    createPersonalRequest,
    markUserAsPremium,
    paymentRequests,
    personalRequests,
    publishAnalysis,
    publishReview,
    requests,
    reviews,
    updateAnalysis,
    updateAdminUser,
    updatePaymentRequest,
    updatePersonalRequest,
    updateRequest,
    updateReview,
    deleteReview,
    session,
    user,
  } = useAppState();
  const [market, setMarket] = useState<Market>("BTC");
  const [title, setTitle] = useState("Briefing sesiune principală");
  const [videoUrl, setVideoUrl] = useState("https://example.com/video/new-upload");
  const [publishDate, setPublishDate] = useState("2026-04-17T09:00:00.000Z");
  const [editingAnalysisId, setEditingAnalysisId] = useState<string | null>(null);
  const [personalEmail, setPersonalEmail] = useState("");
  const [personalTitle, setPersonalTitle] = useState("Analiză personală");
  const [personalVideoUrl, setPersonalVideoUrl] = useState("");
  const [personalNotes, setPersonalNotes] = useState("");
  const [personalTier, setPersonalTier] = useState<2 | 5 | 10>(5);
  const [personalStatus, setPersonalStatus] = useState<RequestStatus>("pending");
  const [editingPersonalId, setEditingPersonalId] = useState<string | null>(null);
  const [reviewTitle, setReviewTitle] = useState("Review după mișcare");
  const [reviewText, setReviewText] = useState("Explicație scurtă despre ce s-a întâmplat în sesiune.");
  const [reviewImageUrl, setReviewImageUrl] = useState(
    "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80",
  );
  const [reviewDate, setReviewDate] = useState("2026-04-17T18:00:00.000Z");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(true);
  const [premiumUserId, setPremiumUserId] = useState("");
  const [requestEdits, setRequestEdits] = useState<
    Record<string, { status: RequestStatus; paymentStatus: PaymentStatus; adminNotes: string; deliveryUrl: string }>
  >({});

  const getRequestEdit = (requestId: string, request: (typeof requests)[number]) =>
    requestEdits[requestId] ?? {
      status: request.status,
      paymentStatus: request.paymentStatus,
      adminNotes: request.adminNotes ?? request.deliveryNotes ?? "",
      deliveryUrl: request.deliveryUrl ?? request.deliveryVideoUrl ?? "",
    };

  const startReviewEdit = (reviewId: string) => {
    const review = reviews.find((item) => item.id === reviewId);
    if (!review) {
      return;
    }

    setEditingReviewId(review.id);
    setMarket(review.market);
    setReviewTitle(review.title);
    setReviewText(review.shortText);
    setReviewImageUrl(review.chartImage);
    setReviewDate(review.publishedAt);
  };

  const startAnalysisEdit = (analysisId: string) => {
    const analysis = analyses.find((item) => item.id === analysisId);
    if (!analysis) {
      return;
    }

    setEditingAnalysisId(analysis.id);
    setMarket(analysis.market);
    setTitle(analysis.title);
    setVideoUrl(analysis.videoUrl);
    setPublishDate(analysis.publishedAt);
    setIsPremium(analysis.isPremium);
  };

  const startPersonalEdit = (requestId: string) => {
    const request = personalRequests.find((item) => item.id === requestId);
    if (!request) {
      return;
    }

    setEditingPersonalId(request.id);
    setPersonalEmail(request.userEmail);
    setPersonalTitle(request.title);
    setPersonalVideoUrl(request.videoUrl ?? "");
    setPersonalNotes(request.notes ?? "");
    setPersonalTier(request.tier ?? 5);
    setPersonalStatus(request.status);
  };

  if (!authReady) {
    return (
      <Screen>
        <PremiumCard>
          <Text style={styles.eyebrow}>Admin</Text>
          <Text style={styles.title}>Se verifică sesiunea</Text>
          <Text style={styles.body}>Așteaptă puțin cât încărcăm accesul contului tău.</Text>
        </PremiumCard>
      </Screen>
    );
  }

  if (!session?.user) {
    return (
      <Screen>
        <PremiumCard>
          <Text style={styles.eyebrow}>Admin</Text>
          <Text style={styles.title}>Autentificarea este necesară</Text>
          <Text style={styles.body}>Panoul de administrare este disponibil doar după logare cu un cont autorizat.</Text>
          <PrimaryButton label="Logare" onPress={() => router.push("/auth/login")} />
        </PremiumCard>
      </Screen>
    );
  }

  if (!user?.isAdmin) {
    return (
      <Screen>
        <PremiumCard>
          <Text style={styles.eyebrow}>Acces restricționat</Text>
          <Text style={styles.title}>Panoul de administrare este rezervat rolului admin</Text>
          <Text style={styles.body}>Contul tău nu are permisiuni pentru publicare, gestionarea plăților sau administrarea utilizatorilor.</Text>
          <PrimaryButton label="Înapoi la Acasă" onPress={() => router.replace("/")} />
        </PremiumCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <PremiumCard>
        <Text style={styles.eyebrow}>Consolă admin</Text>
        <Text style={styles.title}>Control complet pentru publicare, plăți și acces</Text>
        <Text style={styles.body}>
          Fluxul este organizat pentru operare manuală: publici conținutul, verifici plățile, actualizezi cererile și gestionezi accesul utilizatorilor.
        </Text>
      </PremiumCard>

      <SectionHeader eyebrow="Publicare" title="Analiză zilnică video" />
      <View style={styles.form}>
        <Text style={styles.label}>Piață</Text>
        <View style={styles.toggleRow}>
          {(["BTC", "ETH", "NQ", "ES"] as Market[]).map((value) => (
            <PrimaryButton
              key={value}
              label={value}
              onPress={() => setMarket(value)}
              variant={market === value ? "gold" : "ghost"}
            />
          ))}
        </View>

        <Text style={styles.label}>Titlu scurt</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholderTextColor="#6F6A5C" />

        <Text style={styles.label}>URL video</Text>
        <TextInput value={videoUrl} onChangeText={setVideoUrl} style={styles.input} placeholderTextColor="#6F6A5C" />

        <Text style={styles.label}>Dată publicare</Text>
        <TextInput value={publishDate} onChangeText={setPublishDate} style={styles.input} placeholderTextColor="#6F6A5C" />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Conținut Premium</Text>
          <Switch value={isPremium} onValueChange={setIsPremium} />
        </View>

        <PrimaryButton
          label={editingAnalysisId ? "Salvează briefingul" : "Publică briefingul"}
          onPress={() =>
            editingAnalysisId
              ? updateAnalysis(editingAnalysisId, {
                  market,
                  title,
                  videoUrl,
                  isPremium,
                  publishedAt: publishDate,
                })
              : publishAnalysis({
                  market,
                  title,
                  videoUrl,
                  isPremium,
                  publishedAt: publishDate,
                })
          }
        />
        {editingAnalysisId ? (
          <PrimaryButton
            label="Anulează editarea briefingului"
            variant="ghost"
            onPress={() => {
              setEditingAnalysisId(null);
              setTitle("Briefing sesiune principală");
              setVideoUrl("https://example.com/video/new-upload");
              setPublishDate("2026-04-17T09:00:00.000Z");
              setIsPremium(true);
            }}
          />
        ) : null}
      </View>

      <SectionHeader eyebrow="Analize zilnice" title="Ultimele briefinguri publicate" />
      <View style={styles.list}>
        {analyses.slice(0, 8).map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemTitle}>
              {item.market} • {item.title}
            </Text>
            <Text style={styles.itemMeta}>
              {item.isPremium ? "PREMIUM" : "GRATUIT"} • {formatDate(item.publishedAt)}
            </Text>
            <View style={styles.actionButtons}>
              <PrimaryButton label="Editează" variant="ghost" onPress={() => startAnalysisEdit(item.id)} />
              <PrimaryButton label="Șterge" variant="ghost" onPress={() => deleteAnalysis(item.id)} />
            </View>
          </View>
        ))}
      </View>

      <SectionHeader eyebrow="AAR" title="Publică și gestionează After Action Review" />
      <View style={styles.form}>
        <Text style={styles.label}>Titlu</Text>
        <TextInput value={reviewTitle} onChangeText={setReviewTitle} style={styles.input} placeholderTextColor="#6F6A5C" />

        <Text style={styles.label}>Explicație scurtă</Text>
        <TextInput
          value={reviewText}
          onChangeText={setReviewText}
          style={[styles.input, styles.notes]}
          placeholderTextColor="#6F6A5C"
          multiline
        />

        <Text style={styles.label}>Imagine chart</Text>
        <TextInput value={reviewImageUrl} onChangeText={setReviewImageUrl} style={styles.input} placeholderTextColor="#6F6A5C" />

        <Text style={styles.label}>Dată publicare</Text>
        <TextInput value={reviewDate} onChangeText={setReviewDate} style={styles.input} placeholderTextColor="#6F6A5C" />

        <PrimaryButton
          label={editingReviewId ? "Salvează review-ul" : "Publică review-ul"}
          onPress={() =>
            editingReviewId
              ? updateReview(editingReviewId, {
                  market,
                  title: reviewTitle,
                  shortText: reviewText,
                  chartImage: reviewImageUrl,
                  publishedAt: reviewDate,
                })
              : publishReview({
                  market,
                  title: reviewTitle,
                  shortText: reviewText,
                  chartImage: reviewImageUrl,
                  publishedAt: reviewDate,
                })
          }
        />
        {editingReviewId ? (
          <PrimaryButton
            label="Anulează editarea"
            variant="ghost"
            onPress={() => {
              setEditingReviewId(null);
              setReviewTitle("Review după mișcare");
              setReviewText("Explicație scurtă despre ce s-a întâmplat în sesiune.");
            }}
          />
        ) : null}
      </View>

      <View style={styles.list}>
        {reviews.map((review) => (
          <View key={review.id} style={styles.item}>
            <Text style={styles.itemTitle}>
              {review.market} • {review.title}
            </Text>
            <Text style={styles.itemMeta}>{formatDate(review.publishedAt)} • GRATUIT</Text>
            <Text style={styles.requestNotes}>{review.shortText}</Text>
            <View style={styles.actionButtons}>
              <PrimaryButton label="Editează" variant="ghost" onPress={() => startReviewEdit(review.id)} />
              <PrimaryButton label="Șterge" variant="ghost" onPress={() => deleteReview(review.id)} />
            </View>
          </View>
        ))}
      </View>

      <SectionHeader eyebrow="Plăți manuale" title="Confirmări pentru upgrade Premium" />
      <View style={styles.list}>
        {paymentRequests.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemTitle}>
              {item.fullName || "Utilizator"} • Upgrade {item.planTarget} • {item.paymentMethod.toUpperCase()}
            </Text>
            <Text style={styles.itemMeta}>
              {item.status === "verified" ? "CONFIRMATĂ" : item.status === "rejected" ? "RESPINSĂ" : "ÎN VERIFICARE"} • {formatDate(item.createdAt)}
            </Text>
            <Text style={styles.requestNotes}>Email: {item.contactEmail || "nespecificat"}</Text>
            <Text style={styles.requestNotes}>{item.paymentProof}</Text>
            {item.notes ? <Text style={styles.requestNotes}>Mesaj: {item.notes}</Text> : null}
            {item.transactionRef ? <Text style={styles.requestNotes}>Referință: {item.transactionRef}</Text> : null}
            <View style={styles.actionButtons}>
              <PrimaryButton label="Confirmă plata" variant="gold" onPress={() => updatePaymentRequest(item.id, "verified")} />
              <PrimaryButton label="Respinge" variant="ghost" onPress={() => updatePaymentRequest(item.id, "rejected")} />
            </View>
          </View>
        ))}
      </View>

      <SectionHeader eyebrow="Analize personale" title="Creează sau actualizează livrări private" />
      <View style={styles.form}>
        <Text style={styles.label}>Email client</Text>
        <TextInput
          value={personalEmail}
          onChangeText={setPersonalEmail}
          style={styles.input}
          placeholder="client@email.com"
          placeholderTextColor="#6F6A5C"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Titlu</Text>
        <TextInput value={personalTitle} onChangeText={setPersonalTitle} style={styles.input} placeholderTextColor="#6F6A5C" />

        <Text style={styles.label}>Tier</Text>
        <View style={styles.statusSelector}>
          {([2, 5, 10] as const).map((tier) => (
            <PrimaryButton
              key={tier}
              label={`$${tier}`}
              variant={personalTier === tier ? "gold" : "ghost"}
              onPress={() => setPersonalTier(tier)}
            />
          ))}
        </View>

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusSelector}>
          {(["pending", "accepted", "delivered", "cancelled"] as RequestStatus[]).map((status) => (
            <PrimaryButton
              key={status}
              label={
                status === "pending"
                  ? "În așteptare"
                  : status === "accepted"
                    ? "Acceptată"
                    : status === "delivered"
                      ? "Livrată"
                      : "Anulată"
              }
              variant={personalStatus === status ? "gold" : "ghost"}
              onPress={() => setPersonalStatus(status)}
            />
          ))}
        </View>

        <Text style={styles.label}>URL video</Text>
        <TextInput
          value={personalVideoUrl}
          onChangeText={setPersonalVideoUrl}
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor="#6F6A5C"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Notițe</Text>
        <TextInput
          value={personalNotes}
          onChangeText={setPersonalNotes}
          style={[styles.input, styles.notes]}
          placeholder="Notițe pentru client"
          placeholderTextColor="#6F6A5C"
          multiline
        />

        <PrimaryButton
          label={editingPersonalId ? "Salvează analiza personală" : "Creează analiza personală"}
          onPress={() =>
            editingPersonalId
              ? updatePersonalRequest(editingPersonalId, {
                  userEmail: personalEmail.trim(),
                  title: personalTitle.trim(),
                  videoUrl: personalVideoUrl.trim(),
                  notes: personalNotes.trim(),
                  tier: personalTier,
                  status: personalStatus,
                })
              : createPersonalRequest({
                  userEmail: personalEmail.trim(),
                  title: personalTitle.trim(),
                  videoUrl: personalVideoUrl.trim(),
                  notes: personalNotes.trim(),
                  tier: personalTier,
                  status: personalStatus,
                })
          }
        />
        {editingPersonalId ? (
          <PrimaryButton
            label="Anulează editarea"
            variant="ghost"
            onPress={() => {
              setEditingPersonalId(null);
              setPersonalEmail("");
              setPersonalTitle("Analiză personală");
              setPersonalVideoUrl("");
              setPersonalNotes("");
              setPersonalTier(5);
              setPersonalStatus("pending");
            }}
          />
        ) : null}
      </View>

      <View style={styles.list}>
        {personalRequests.map((request) => (
          <View key={request.id} style={styles.item}>
            <Text style={styles.itemTitle}>{request.title}</Text>
            <Text style={styles.itemMeta}>
              {request.userEmail} • {request.status === "delivered" ? "Livrată" : request.status === "accepted" ? "Acceptată" : request.status === "cancelled" ? "Anulată" : "În așteptare"}
            </Text>
            {request.notes ? <Text style={styles.requestNotes}>{request.notes}</Text> : null}
            {request.videoUrl ? <Text style={styles.requestNotes}>Video: {request.videoUrl}</Text> : null}
            <View style={styles.actionButtons}>
              <PrimaryButton label="Editează" variant="ghost" onPress={() => startPersonalEdit(request.id)} />
            </View>
          </View>
        ))}
      </View>

      <SectionHeader eyebrow="Plan utilizator" title="Upgrade manual rapid" />
      <View style={styles.item}>
        <Text style={styles.itemTitle}>Marcare manuală Premium</Text>
        <Text style={styles.itemMeta}>Introdu ID-ul utilizatorului după confirmarea plății sau lasă gol pentru utilizatorul curent.</Text>
        <TextInput
          value={premiumUserId}
          onChangeText={setPremiumUserId}
          style={styles.input}
          placeholder={user.id ?? "ID utilizator"}
          placeholderTextColor="#6F6A5C"
          autoCapitalize="none"
        />
        <PrimaryButton
          label="Marchează ca Premium"
          onPress={() => void markUserAsPremium((premiumUserId || user.id || "").trim())}
          variant="ghost"
        />
      </View>

      <SectionHeader eyebrow="Solicitări" title="Gestionează cererile de analiză" />
      <View style={styles.list}>
        {requests.map((request) => {
          const edit = getRequestEdit(request.id, request);

          return (
            <View key={request.id} style={styles.item}>
              <Text style={styles.itemTitle}>
                {request.ticker} • ${request.tier}
              </Text>
              <Text style={styles.itemMeta}>
                {request.userId} • {formatDate(request.requestedAt)}
              </Text>
              <Text style={styles.requestNotes}>{request.notes}</Text>
              {request.paymentProof ? <Text style={styles.requestNotes}>Dovadă plată: {request.paymentProof}</Text> : null}
              {request.paymentReference ? <Text style={styles.requestNotes}>Referință: {request.paymentReference}</Text> : null}

              <Text style={styles.label}>Status cerere</Text>
              <View style={styles.statusSelector}>
                {(["pending", "accepted", "delivered", "cancelled"] as RequestStatus[]).map((status) => (
                  <PrimaryButton
                    key={status}
                    label={
                      status === "pending"
                        ? "În așteptare"
                        : status === "accepted"
                          ? "Acceptată"
                          : status === "delivered"
                            ? "Livrată"
                            : "Anulată"
                    }
                    onPress={() =>
                      setRequestEdits((prev) => ({
                        ...prev,
                        [request.id]: { ...edit, status },
                      }))
                    }
                    variant={edit.status === status ? "gold" : "ghost"}
                  />
                ))}
              </View>

              <Text style={styles.label}>Status plată</Text>
              <View style={styles.statusSelector}>
                {(["pending", "paid", "refunded"] as PaymentStatus[]).map((status) => (
                  <PrimaryButton
                    key={status}
                    label={status === "pending" ? "În verificare" : status === "paid" ? "Plătită" : "Rambursată"}
                    onPress={() =>
                      setRequestEdits((prev) => ({
                        ...prev,
                        [request.id]: { ...edit, paymentStatus: status },
                      }))
                    }
                    variant={edit.paymentStatus === status ? "gold" : "ghost"}
                  />
                ))}
              </View>

              <Text style={styles.label}>Notițe admin</Text>
              <TextInput
                value={edit.adminNotes}
                onChangeText={(adminNotes) =>
                  setRequestEdits((prev) => ({
                    ...prev,
                    [request.id]: { ...edit, adminNotes },
                  }))
                }
                style={[styles.input, styles.notes]}
                placeholder="Adaugă mesajul pentru client"
                placeholderTextColor="#6F6A5C"
                multiline
              />

              <Text style={styles.label}>URL livrare</Text>
              <TextInput
                value={edit.deliveryUrl}
                onChangeText={(deliveryUrl) =>
                  setRequestEdits((prev) => ({
                    ...prev,
                    [request.id]: { ...edit, deliveryUrl },
                  }))
                }
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#6F6A5C"
                autoCapitalize="none"
              />

              <PrimaryButton
                label="Salvează actualizarea"
                onPress={() =>
                  updateRequest(request.id, {
                    status: edit.status,
                    paymentStatus: edit.paymentStatus,
                    deliveryNotes: edit.adminNotes.trim(),
                    deliveryVideoUrl: edit.deliveryUrl.trim(),
                  })
                }
                variant="ghost"
              />
            </View>
          );
        })}
      </View>

      <SectionHeader eyebrow="Utilizatori" title="Roluri și planuri" />
      <View style={styles.list}>
        {adminUsers.map((member) => (
          <View key={member.id} style={styles.item}>
            <Text style={styles.itemTitle}>{member.name}</Text>
            <Text style={styles.itemMeta}>
              {member.email} • {member.role.toUpperCase()} • {member.plan === "PRO" ? "PREMIUM" : "FREE"}
            </Text>
            <Text style={styles.label}>Rol</Text>
            <View style={styles.statusSelector}>
              {(["user", "admin"] as const).map((role) => (
                <PrimaryButton
                  key={role}
                  label={role === "admin" ? "Admin" : "User"}
                  variant={member.role === role ? "gold" : "ghost"}
                  onPress={() => updateAdminUser({ userId: member.id, role, plan: member.plan })}
                />
              ))}
            </View>
            <Text style={styles.label}>Plan</Text>
            <View style={styles.statusSelector}>
              {(["FREE", "PRO"] as UserPlan[]).map((plan) => (
                <PrimaryButton
                  key={plan}
                  label={plan === "PRO" ? "Premium" : "Free"}
                  variant={member.plan === plan ? "gold" : "ghost"}
                  onPress={() => updateAdminUser({ userId: member.id, role: member.role, plan })}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.gold,
    fontSize: typography.small,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  title: {
    color: colors.textStrong,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  form: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPanel,
    padding: 16,
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: typography.small,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
    minHeight: 120,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  switchLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  list: {
    gap: spacing.sm,
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  item: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPanel,
    padding: 16,
    gap: 8,
  },
  itemTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  itemMeta: {
    color: colors.gold,
    fontSize: typography.small,
  },
  requestNotes: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 21,
  },
  statusSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
