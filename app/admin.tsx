import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { isOwnerEmail } from "@/constants/access";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { PremiumCard } from "@/components/PremiumCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { normalizeIsoDate } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { useAppState } from "@/providers/AppProvider";
import { colors, radii, spacing, typography } from "@/theme";
import { Market, PaymentStatus, RequestStatus, UserPlan } from "@/types/domain";

function currentIsoValue() {
  return new Date().toISOString();
}

export default function AdminScreen() {
  const {
    adminUsers,
    altcoinPosts,
    authReady,
    analyses,
    contactMessages,
    deleteAnalysis,
    createPersonalRequest,
    markUserAsPremium,
    paymentRequests,
    personalRequests,
    publishAnalysis,
    publishAltcoinPost,
    publishReview,
    requests,
    reviews,
    updateAnalysis,
    updateAltcoinPost,
    updateAdminUser,
    updateContactMessageStatus,
    replyToContactMessage,
    updatePaymentRequest,
    updatePersonalRequest,
    updateRequest,
    updateReview,
    deleteReview,
    deleteAltcoinPost,
    refreshProtectedData,
    session,
    user,
  } = useAppState();
  const [market, setMarket] = useState<Market>("BTC");
  const [title, setTitle] = useState("Briefing sesiune principală");
  const [summary, setSummary] = useState("Contextul principal al zilei, publicat pentru briefingul video.");
  const [videoUrl, setVideoUrl] = useState("https://example.com/video/new-upload");
  const [publishDate, setPublishDate] = useState(() => currentIsoValue());
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
  const [reviewBodyText, setReviewBodyText] = useState("Detaliază aici contextul complet pentru After Action Review.");
  const [reviewImageUrl, setReviewImageUrl] = useState(
    "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80",
  );
  const [reviewVideoUrl, setReviewVideoUrl] = useState("");
  const [reviewDate, setReviewDate] = useState(() => currentIsoValue());
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [altcoinSymbol, setAltcoinSymbol] = useState("SOL");
  const [altcoinTitle, setAltcoinTitle] = useState("Update oportunistic pe altcoin");
  const [altcoinSummary, setAltcoinSummary] = useState("Context scurt pentru un setup punctual din secțiunea Altcoins.");
  const [altcoinBody, setAltcoinBody] = useState("Explică aici ideea principală, nivelurile și contextul pentru postarea Altcoins.");
  const [altcoinVideoUrl, setAltcoinVideoUrl] = useState("");
  const [altcoinPublishDate, setAltcoinPublishDate] = useState(() => currentIsoValue());
  const [altcoinPremium, setAltcoinPremium] = useState(false);
  const [editingAltcoinId, setEditingAltcoinId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(true);
  const [premiumUserId, setPremiumUserId] = useState("");
  const [premiumDurationDays, setPremiumDurationDays] = useState<30 | 90>(30);
  const [activeComposer, setActiveComposer] = useState<"aar" | "briefing" | "altcoins" | "private" | null>(null);
  const [expandedPremiumRequests, setExpandedPremiumRequests] = useState<Record<string, boolean>>({});
  const [expandedAnalysisRequests, setExpandedAnalysisRequests] = useState<Record<string, boolean>>({});
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({});
  const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState({
    premiumRequests: true,
    premiumMembers: true,
    personalDeliveries: false,
    analysisRequests: true,
    contactMessages: false,
    users: false,
    content: false,
  });
  const [requestEdits, setRequestEdits] = useState<
    Record<string, { status: RequestStatus; paymentStatus: PaymentStatus; adminNotes: string; deliveryUrl: string }>
  >({});
  const [contactReplyDrafts, setContactReplyDrafts] = useState<Record<string, string>>({});
  const isOwnerAdmin = user?.isAdmin || isOwnerEmail(session?.user?.email);

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const togglePremiumRequest = (requestId: string) => {
    setExpandedPremiumRequests((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  const toggleAnalysisRequest = (requestId: string) => {
    setExpandedAnalysisRequests((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  const toggleMember = (memberId: string) => {
    setExpandedMembers((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  };

  const toggleContentItem = (contentId: string) => {
    setExpandedContent((prev) => ({
      ...prev,
      [contentId]: !prev[contentId],
    }));
  };

  const handleOpenEmail = async (email: string, subject: string) => {
    const url = `mailto:${email}?subject=${encodeURIComponent(`Re: ${subject}`)}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Email indisponibil",
          `Aplicația Mail nu este disponibilă în acest simulator. Adresa de contact este: ${email}`,
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Email indisponibil",
        `Nu am putut deschide clientul de email în mediul curent. Adresa de contact este: ${email}`,
      );
    }
  };

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
    setReviewBodyText(review.bodyText ?? review.shortText);
    setReviewImageUrl(review.chartImage);
    setReviewVideoUrl(review.videoUrl ?? "");
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
    setSummary(analysis.summary ?? "");
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

  const startAltcoinEdit = (postId: string) => {
    const post = altcoinPosts.find((item) => item.id === postId);
    if (!post) {
      return;
    }

    setEditingAltcoinId(post.id);
    setAltcoinSymbol(post.coinSymbol);
    setAltcoinTitle(post.title);
    setAltcoinSummary(post.summary);
    setAltcoinBody(post.bodyText);
    setAltcoinVideoUrl(post.videoUrl ?? "");
    setAltcoinPublishDate(post.publishedAt);
    setAltcoinPremium(post.isPremium);
  };

  useFocusEffect(
    useCallback(() => {
      void refreshProtectedData();
    }, [refreshProtectedData]),
  );

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

  if (!isOwnerAdmin) {
    return (
      <Screen>
        <PremiumCard>
          <Text style={styles.eyebrow}>Acces restricționat</Text>
          <Text style={styles.title}>Panoul de administrare este rezervat rolului admin</Text>
          <Text style={styles.body}>Contul tău nu are permisiuni pentru publicare, gestionarea plăților sau administrarea utilizatorilor.</Text>
          <PrimaryButton label="Înapoi la Acasă" onPress={() => router.replace("/(tabs)")} />
        </PremiumCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <PremiumCard>
        <View style={styles.actionButtons}>
          <PrimaryButton label="Înapoi în aplicație" variant="ghost" onPress={() => router.replace("/(tabs)")} />
          <PrimaryButton label="Reîncarcă datele" variant="ghost" onPress={() => void refreshProtectedData()} />
        </View>
        <Text style={styles.eyebrow}>Consolă admin</Text>
        <Text style={styles.title}>Control complet pentru publicare, plăți și acces</Text>
        <Text style={styles.body}>
          Fluxul este organizat pentru operare manuală: publici conținutul, verifici plățile, actualizezi cererile și gestionezi accesul utilizatorilor.
        </Text>
        <Text style={styles.body}>Ca owner/creator, aici vezi toate confirmările premium, toate cererile personale și toate postările publicate.</Text>
        <Text style={styles.body}>Acces curent: {session?.user?.email ?? user?.email ?? "necunoscut"}</Text>
      </PremiumCard>

      <SectionHeader eyebrow="Quick Actions" title="Publicare și livrare rapidă" />
      <View style={styles.quickActions}>
        <PrimaryButton
          label="Publică AAR"
          variant={activeComposer === "aar" ? "gold" : "ghost"}
          onPress={() => setActiveComposer((prev) => (prev === "aar" ? null : "aar"))}
        />
        <PrimaryButton
          label="Publică Briefing"
          variant={activeComposer === "briefing" ? "gold" : "ghost"}
          onPress={() => setActiveComposer((prev) => (prev === "briefing" ? null : "briefing"))}
        />
        <PrimaryButton
          label="Publică Altcoins"
          variant={activeComposer === "altcoins" ? "gold" : "ghost"}
          onPress={() => setActiveComposer((prev) => (prev === "altcoins" ? null : "altcoins"))}
        />
        <PrimaryButton
          label="Creează analiză privată"
          variant={activeComposer === "private" ? "gold" : "ghost"}
          onPress={() => setActiveComposer((prev) => (prev === "private" ? null : "private"))}
        />
      </View>

      {activeComposer === "private" ? (
      <>
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
          onPress={() => {
            if (editingPersonalId) {
              updatePersonalRequest(editingPersonalId, {
                userEmail: personalEmail.trim(),
                title: personalTitle.trim(),
                videoUrl: personalVideoUrl.trim(),
                notes: personalNotes.trim(),
                tier: personalTier,
                status: personalStatus,
              });
              Alert.alert("Livrare actualizată", "Actualizarea este vizibilă imediat în listă și în contul membrului.");
            } else {
              createPersonalRequest({
                userEmail: personalEmail.trim(),
                title: personalTitle.trim(),
                videoUrl: personalVideoUrl.trim(),
                notes: personalNotes.trim(),
                tier: personalTier,
                status: personalStatus,
              });
              Alert.alert("Livrare creată", "Analiza privată a fost salvată și apare imediat în listă.");
            }

            setEditingPersonalId(null);
            setPersonalEmail("");
            setPersonalTitle("Analiză personală");
            setPersonalVideoUrl("");
            setPersonalNotes("");
            setPersonalTier(5);
            setPersonalStatus("pending");
            setActiveComposer(null);
          }}
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
              setActiveComposer(null);
            }}
          />
        ) : null}
      </View>
      </>
      ) : null}

      {activeComposer === "briefing" ? (
      <>
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

        <Text style={styles.label}>Text / context</Text>
        <TextInput
          value={summary}
          onChangeText={setSummary}
          style={[styles.input, styles.notes]}
          placeholder="Contextul postării, ideea zilei sau notițe scurte pentru briefing."
          placeholderTextColor="#6F6A5C"
          multiline
        />

        <Text style={styles.label}>URL video YouTube unlisted</Text>
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
                  summary,
                  videoUrl,
                  isPremium,
                  publishedAt: normalizeIsoDate(publishDate),
                })
              : publishAnalysis({
                  market,
                  title,
                  summary,
                  videoUrl,
                  isPremium,
                  publishedAt: normalizeIsoDate(publishDate),
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
              setSummary("Contextul principal al zilei, publicat pentru briefingul video.");
              setVideoUrl("https://example.com/video/new-upload");
              setPublishDate(currentIsoValue());
              setIsPremium(true);
            }}
          />
        ) : null}
      </View>
      </>
      ) : null}

      {activeComposer === "aar" ? (
      <>
      <SectionHeader eyebrow="AAR" title="Publică și gestionează After Action Review" />
      <View style={styles.form}>
        <Text style={styles.label}>Piață AAR</Text>
        <View style={styles.toggleRow}>
          {(["BTC", "ETH", "NQ", "ES"] as Market[]).map((value) => (
            <PrimaryButton
              key={`review-${value}`}
              label={value}
              onPress={() => setMarket(value)}
              variant={market === value ? "gold" : "ghost"}
            />
          ))}
        </View>

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

        <Text style={styles.label}>Text complet</Text>
        <TextInput
          value={reviewBodyText}
          onChangeText={setReviewBodyText}
          style={[styles.input, styles.notes]}
          placeholderTextColor="#6F6A5C"
          multiline
        />

        <Text style={styles.label}>Imagine chart</Text>
        <TextInput value={reviewImageUrl} onChangeText={setReviewImageUrl} style={styles.input} placeholderTextColor="#6F6A5C" />

        <Text style={styles.label}>URL video opțional</Text>
        <TextInput value={reviewVideoUrl} onChangeText={setReviewVideoUrl} style={styles.input} placeholderTextColor="#6F6A5C" />

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
                  bodyText: reviewBodyText,
                  chartImage: reviewImageUrl,
                  videoUrl: reviewVideoUrl,
                  publishedAt: normalizeIsoDate(reviewDate),
                })
              : publishReview({
                  market,
                  title: reviewTitle,
                  shortText: reviewText,
                  bodyText: reviewBodyText,
                  chartImage: reviewImageUrl,
                  videoUrl: reviewVideoUrl,
                  publishedAt: normalizeIsoDate(reviewDate),
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
              setReviewBodyText("Detaliază aici contextul complet pentru After Action Review.");
              setReviewVideoUrl("");
              setReviewDate(currentIsoValue());
            }}
          />
        ) : null}
      </View>
      </>
      ) : null}

      {activeComposer === "altcoins" ? (
      <>
      <SectionHeader eyebrow="Altcoins" title="Publică update-uri separate pe Altcoins" />
      <View style={styles.form}>
        <Text style={styles.label}>Ticker Altcoin</Text>
        <TextInput value={altcoinSymbol} onChangeText={setAltcoinSymbol} style={styles.input} placeholderTextColor="#6F6A5C" />

        <Text style={styles.label}>Titlu</Text>
        <TextInput value={altcoinTitle} onChangeText={setAltcoinTitle} style={styles.input} placeholderTextColor="#6F6A5C" />

        <Text style={styles.label}>Rezumat</Text>
        <TextInput
          value={altcoinSummary}
          onChangeText={setAltcoinSummary}
          style={[styles.input, styles.notes]}
          multiline
          placeholderTextColor="#6F6A5C"
        />

        <Text style={styles.label}>Text complet</Text>
        <TextInput
          value={altcoinBody}
          onChangeText={setAltcoinBody}
          style={[styles.input, styles.notes]}
          multiline
          placeholderTextColor="#6F6A5C"
        />

        <Text style={styles.label}>URL video</Text>
        <TextInput value={altcoinVideoUrl} onChangeText={setAltcoinVideoUrl} style={styles.input} placeholderTextColor="#6F6A5C" />

        <Text style={styles.label}>Dată publicare</Text>
        <TextInput value={altcoinPublishDate} onChangeText={setAltcoinPublishDate} style={styles.input} placeholderTextColor="#6F6A5C" />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Postare Premium</Text>
          <Switch value={altcoinPremium} onValueChange={setAltcoinPremium} />
        </View>

        <PrimaryButton
          label={editingAltcoinId ? "Salvează postarea Altcoins" : "Publică pe Altcoins"}
          onPress={() =>
            editingAltcoinId
              ? updateAltcoinPost(editingAltcoinId, {
                  coinSymbol: altcoinSymbol.trim().toUpperCase(),
                  title: altcoinTitle.trim(),
                  summary: altcoinSummary.trim(),
                  bodyText: altcoinBody.trim(),
                  chartImage: "",
                  videoUrl: altcoinVideoUrl.trim(),
                  isPremium: altcoinPremium,
                  publishedAt: normalizeIsoDate(altcoinPublishDate),
                })
              : publishAltcoinPost({
                  coinSymbol: altcoinSymbol.trim().toUpperCase(),
                  title: altcoinTitle.trim(),
                  summary: altcoinSummary.trim(),
                  bodyText: altcoinBody.trim(),
                  chartImage: "",
                  videoUrl: altcoinVideoUrl.trim(),
                  isPremium: altcoinPremium,
                  publishedAt: normalizeIsoDate(altcoinPublishDate),
                })
          }
        />
        {editingAltcoinId ? (
          <PrimaryButton
            label="Anulează editarea Altcoins"
            variant="ghost"
            onPress={() => {
              setEditingAltcoinId(null);
              setAltcoinSymbol("SOL");
              setAltcoinTitle("Update oportunistic pe altcoin");
              setAltcoinSummary("Context scurt pentru un setup punctual din secțiunea Altcoins.");
              setAltcoinBody("Explică aici ideea principală, nivelurile și contextul pentru postarea Altcoins.");
              setAltcoinVideoUrl("");
              setAltcoinPublishDate(currentIsoValue());
              setAltcoinPremium(false);
            }}
          />
        ) : null}
      </View>
      </>
      ) : null}

      <CollapsibleSection
        title="Conținut publicat"
        eyebrow="Conținut"
        caption="Briefinguri, After Action Review și Altcoins sunt grupate clar și nu mai ocupă permanent tot ecranul."
        defaultOpen={false}
        rightLabel={`${analyses.length + reviews.length + altcoinPosts.length}`}
      >
        <SectionHeader eyebrow="Briefing" title="Analize zilnice" />
        <View style={styles.list}>
          {analyses.slice(0, 8).map((item) => (
            <View key={item.id} style={styles.item}>
              <Pressable style={styles.collapseHeader} onPress={() => toggleContentItem(`analysis-${item.id}`)}>
                <Text style={styles.collapseTitle}>{item.market} • {item.title}</Text>
                <Text style={styles.collapseMeta}>{expandedContent[`analysis-${item.id}`] ? "Ascunde" : "Arată"}</Text>
              </Pressable>
              {expandedContent[`analysis-${item.id}`] ? (
                <>
                  <Text style={styles.itemMeta}>{item.isPremium ? "PREMIUM" : "GRATUIT"} • {formatDate(item.publishedAt)}</Text>
                  {item.summary ? <Text style={styles.requestNotes}>{item.summary}</Text> : null}
                  <View style={styles.actionButtons}>
                    <PrimaryButton label="Editează" variant="ghost" onPress={() => { startAnalysisEdit(item.id); setActiveComposer("briefing"); }} />
                    <PrimaryButton label="Șterge" variant="ghost" onPress={() => deleteAnalysis(item.id)} />
                  </View>
                </>
              ) : null}
            </View>
          ))}
        </View>

        <SectionHeader eyebrow="AAR" title="After Action Review" />
        <View style={styles.list}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.item}>
              <Pressable style={styles.collapseHeader} onPress={() => toggleContentItem(`review-${review.id}`)}>
                <Text style={styles.collapseTitle}>{review.market} • {review.title}</Text>
                <Text style={styles.collapseMeta}>{expandedContent[`review-${review.id}`] ? "Ascunde" : "Arată"}</Text>
              </Pressable>
              {expandedContent[`review-${review.id}`] ? (
                <>
                  <Text style={styles.itemMeta}>{formatDate(review.publishedAt)} • GRATUIT</Text>
                  <Text style={styles.requestNotes}>{review.shortText}</Text>
                  <View style={styles.actionButtons}>
                    <PrimaryButton label="Editează" variant="ghost" onPress={() => { startReviewEdit(review.id); setActiveComposer("aar"); }} />
                    <PrimaryButton label="Șterge" variant="ghost" onPress={() => deleteReview(review.id)} />
                  </View>
                </>
              ) : null}
            </View>
          ))}
        </View>

        <SectionHeader eyebrow="Altcoins" title="Postări Altcoins" />
        <View style={styles.list}>
          {altcoinPosts.map((post) => (
            <View key={post.id} style={styles.item}>
              <Pressable style={styles.collapseHeader} onPress={() => toggleContentItem(`altcoin-${post.id}`)}>
                <Text style={styles.collapseTitle}>{post.coinSymbol} • {post.title}</Text>
                <Text style={styles.collapseMeta}>{expandedContent[`altcoin-${post.id}`] ? "Ascunde" : "Arată"}</Text>
              </Pressable>
              {expandedContent[`altcoin-${post.id}`] ? (
                <>
                  <Text style={styles.itemMeta}>{post.isPremium ? "PREMIUM" : "GRATUIT"} • {formatDate(post.publishedAt)}</Text>
                  {post.summary ? <Text style={styles.requestNotes}>{post.summary}</Text> : null}
                  <View style={styles.actionButtons}>
                    <PrimaryButton label="Editează" variant="ghost" onPress={() => { startAltcoinEdit(post.id); setActiveComposer("altcoins"); }} />
                    <PrimaryButton label="Șterge" variant="ghost" onPress={() => deleteAltcoinPost(post.id)} />
                  </View>
                </>
              ) : null}
            </View>
          ))}
        </View>
      </CollapsibleSection>

      <SectionHeader eyebrow="Plăți manuale" title="Confirmări pentru upgrade Premium" />
      <Pressable style={styles.collapseHeader} onPress={() => toggleSection("premiumRequests")}>
        <Text style={styles.collapseTitle}>Cereri Premium</Text>
        <Text style={styles.collapseMeta}>{openSections.premiumRequests ? "Ascunde" : "Arată"}</Text>
      </Pressable>
      {openSections.premiumRequests ? (
      <View style={styles.list}>
        {paymentRequests.map((item) => (
          <View key={item.id} style={styles.item}>
            <Pressable style={styles.collapseHeader} onPress={() => togglePremiumRequest(item.id)}>
              <Text style={styles.collapseTitle}>
                {item.fullName || "Utilizator"} • {item.planLabel ?? "Premium All Access"}
              </Text>
              <Text style={styles.collapseMeta}>{expandedPremiumRequests[item.id] ? "Ascunde" : "Arată"}</Text>
            </Pressable>
            {expandedPremiumRequests[item.id] ? (
              <>
                <Text style={styles.itemMeta}>
                  {item.status === "verified" ? "PREMIUM ACTIVAT" : item.status === "rejected" ? "RESPINSĂ" : "ÎN AȘTEPTAREA VALIDĂRII"} • {formatDate(item.createdAt)}
                </Text>
                <Text style={styles.requestNotes}>
                  Plan: {item.planLabel ?? "Premium All Access"} • Durată: {item.durationDays ?? 30} zile
                </Text>
                <Text style={styles.requestNotes}>Email: {item.contactEmail || "nespecificat"}</Text>
                <Text style={styles.requestNotes}>{item.paymentProof}</Text>
                <Text style={styles.requestNotes}>
                  {item.status === "verified"
                    ? "Plata a fost validată, iar contul utilizatorului a fost activat imediat pe Premium."
                    : item.status === "rejected"
                      ? "Cererea a fost respinsă. Utilizatorul rămâne pe planul curent."
                      : "Cererea așteaptă validarea manuală. Când apeși validarea, utilizatorul devine Premium imediat."}
                </Text>
                {item.notes ? <Text style={styles.requestNotes}>Mesaj: {item.notes}</Text> : null}
                {item.transactionRef ? <Text style={styles.requestNotes}>Referință: {item.transactionRef}</Text> : null}
                {item.status === "pending" ? (
                  <View style={styles.actionButtons}>
                    <PrimaryButton
                      label="Validează plata și activează Premium"
                      variant="gold"
                      onPress={() =>
                        void updatePaymentRequest(item.id, "verified").then((result) => {
                          if (result.success) {
                            setExpandedPremiumRequests((prev) => ({
                              ...prev,
                              [item.id]: true,
                            }));
                          }
                          Alert.alert(result.success ? "Premium activat" : "Actualizare eșuată", result.message);
                        })
                      }
                    />
                    <PrimaryButton
                      label="Respinge"
                      variant="ghost"
                      onPress={() =>
                        void updatePaymentRequest(item.id, "rejected").then((result) => {
                          if (result.success) {
                            setExpandedPremiumRequests((prev) => ({
                              ...prev,
                              [item.id]: true,
                            }));
                          }
                          Alert.alert(result.success ? "Cerere respinsă" : "Actualizare eșuată", result.message);
                        })
                      }
                    />
                  </View>
                ) : (
                  <Text style={styles.requestNotes}>
                    {item.status === "verified"
                      ? "Cererea este închisă: Premium a fost activat și notificarea a fost trimisă."
                      : "Cererea este închisă: plata a fost respinsă."}
                  </Text>
                )}
              </>
            ) : null}
          </View>
        ))}
      </View>
      ) : null}

      <SectionHeader eyebrow="Premium activ" title="Membri Premium" />
      <Pressable style={styles.collapseHeader} onPress={() => toggleSection("premiumMembers")}>
        <Text style={styles.collapseTitle}>Listă membri Premium</Text>
        <Text style={styles.collapseMeta}>{openSections.premiumMembers ? "Ascunde" : "Arată"}</Text>
      </Pressable>
      {openSections.premiumMembers ? <View style={styles.list}>
        {adminUsers.filter((member) => member.plan === "PRO").length ? (
          adminUsers
            .filter((member) => member.plan === "PRO")
            .map((member) => (
              <View key={member.id} style={styles.item}>
                <Text style={styles.itemTitle}>{member.name}</Text>
                <Text style={styles.itemMeta}>{member.email}</Text>
                <Text style={styles.requestNotes}>
                  {member.role === "admin" ? "Owner / Admin" : "Membru Premium"}
                </Text>
              </View>
            ))
        ) : (
          <View style={styles.item}>
            <Text style={styles.itemTitle}>Nu există încă membri Premium activi</Text>
            <Text style={styles.requestNotes}>După validarea unei plăți sau upgrade manual, membrii apar aici automat.</Text>
          </View>
        )}
      </View> : null}

      <Pressable style={styles.collapseHeader} onPress={() => toggleSection("personalDeliveries")}>
        <Text style={styles.collapseTitle}>Livrări private</Text>
        <Text style={styles.collapseMeta}>{openSections.personalDeliveries ? "Ascunde" : "Arată"}</Text>
      </Pressable>
      {openSections.personalDeliveries ? <View style={styles.list}>
        {personalRequests.map((request) => (
          <View key={request.id} style={styles.item}>
            <Text style={styles.itemTitle}>{request.title}</Text>
            <Text style={styles.itemMeta}>
              {request.userEmail} • {request.status === "delivered" ? "Livrată" : request.status === "accepted" ? "Acceptată" : request.status === "cancelled" ? "Anulată" : "În așteptare"}
            </Text>
            {request.notes ? <Text style={styles.requestNotes}>{request.notes}</Text> : null}
            <View style={styles.actionButtons}>
              {request.videoUrl ? (
                <PrimaryButton label="Vezi video" variant="ghost" onPress={() => void Linking.openURL(request.videoUrl!)} />
              ) : null}
              <PrimaryButton
                label="Editează"
                variant="ghost"
                onPress={() => {
                  startPersonalEdit(request.id);
                  setActiveComposer("private");
                }}
              />
            </View>
          </View>
        ))}
      </View> : null}

      <SectionHeader eyebrow="Plan utilizator" title="Upgrade manual rapid" />
      <View style={styles.item}>
        <Text style={styles.itemTitle}>Activare / prelungire Premium</Text>
        <Text style={styles.itemMeta}>Introdu emailul sau ID-ul utilizatorului. Dacă membrul este deja Premium, durata se prelungește automat.</Text>
        <TextInput
          value={premiumUserId}
          onChangeText={setPremiumUserId}
          style={styles.input}
          placeholder={user?.email ?? user?.id ?? "Email sau ID utilizator"}
          placeholderTextColor="#6F6A5C"
          autoCapitalize="none"
        />
        <View style={styles.statusSelector}>
          <PrimaryButton
            label="30 zile"
            variant={premiumDurationDays === 30 ? "gold" : "ghost"}
            onPress={() => setPremiumDurationDays(30)}
          />
          <PrimaryButton
            label="90 zile"
            variant={premiumDurationDays === 90 ? "gold" : "ghost"}
            onPress={() => setPremiumDurationDays(90)}
          />
        </View>
        <PrimaryButton
          label="Marchează ca Premium"
          onPress={() =>
            void markUserAsPremium({
              identifier: (premiumUserId || user?.email || user?.id || "").trim(),
              durationDays: premiumDurationDays,
              planLabel: "Premium All Access",
            }).then((result) => {
              Alert.alert(result.success ? "Premium activat" : "Actualizare eșuată", result.message);
            })
          }
          variant="ghost"
        />
      </View>

      <SectionHeader eyebrow="Solicitări" title="Gestionează cererile de analiză" />
      <Pressable style={styles.collapseHeader} onPress={() => toggleSection("analysisRequests")}>
        <Text style={styles.collapseTitle}>Cereri de analiză</Text>
        <Text style={styles.collapseMeta}>{openSections.analysisRequests ? "Ascunde" : "Arată"}</Text>
      </Pressable>
      {openSections.analysisRequests ? <View style={styles.list}>
        {requests.map((request) => {
          const edit = getRequestEdit(request.id, request);

          return (
            <View key={request.id} style={styles.item}>
              <Pressable style={styles.collapseHeader} onPress={() => toggleAnalysisRequest(request.id)}>
                <Text style={styles.collapseTitle}>{request.ticker} • ${request.tier}</Text>
                <Text style={styles.collapseMeta}>{expandedAnalysisRequests[request.id] ? "Ascunde" : "Arată"}</Text>
              </Pressable>
              {expandedAnalysisRequests[request.id] ? (
                <>
                  <Text style={styles.itemMeta}>
                    {request.userId} • {formatDate(request.requestedAt)}
                  </Text>
                  {request.requesterEmail ? <Text style={styles.requestNotes}>Contact: {request.requesterEmail}</Text> : null}
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

                  <Text style={styles.label}>Mesaj pentru membru</Text>
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
                      void updateRequest(request.id, {
                        status: edit.status,
                        paymentStatus: edit.paymentStatus,
                        deliveryNotes: edit.adminNotes.trim(),
                        deliveryVideoUrl: edit.deliveryUrl.trim(),
                      }).then((result) => {
                        if (result.success) {
                          setRequestEdits((prev) => {
                            const next = { ...prev };
                            delete next[request.id];
                            return next;
                          });
                        }

                        Alert.alert(result.success ? "Solicitare actualizată" : "Actualizare eșuată", result.message);
                      })
                    }
                    variant="ghost"
                  />
                </>
              ) : null}
            </View>
          );
        })}
      </View> : null}

      <SectionHeader eyebrow="Contact" title="Mesaje primite din aplicație" />
      <Pressable style={styles.collapseHeader} onPress={() => toggleSection("contactMessages")}>
        <Text style={styles.collapseTitle}>Mesaje membri</Text>
        <Text style={styles.collapseMeta}>{openSections.contactMessages ? "Ascunde" : "Arată"}</Text>
      </Pressable>
      {openSections.contactMessages ? <View style={styles.list}>
        {contactMessages.length ? (
          contactMessages.map((item) => (
            <View key={item.id} style={styles.item}>
              <Text style={styles.itemTitle}>{item.subject}</Text>
              <Text style={styles.itemMeta}>
                {item.fullName} • {item.email}
              </Text>
              <Text style={styles.requestNotes}>{item.message}</Text>
              <Text style={styles.requestNotes}>
                Status conversație: {item.status === "new" ? "Nou" : item.status === "read" ? "Citit" : "Răspuns trimis"}
              </Text>
              <View style={styles.replyThread}>
                {item.replies?.length ? (
                  item.replies.map((reply) => (
                    <View key={reply.id} style={styles.replyBubble}>
                      <Text style={styles.replyAuthor}>
                        {reply.senderRole === "admin" ? "Admin" : reply.senderName}
                      </Text>
                      <Text style={styles.replyMeta}>{formatDate(reply.createdAt)}</Text>
                      <Text style={styles.replyBody}>{reply.body}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.requestNotes}>Nu există încă răspunsuri în aplicație pe acest fir.</Text>
                )}
              </View>
              <TextInput
                value={contactReplyDrafts[item.id] ?? ""}
                onChangeText={(value) =>
                  setContactReplyDrafts((prev) => ({
                    ...prev,
                    [item.id]: value,
                  }))
                }
                style={[styles.input, styles.notes]}
                placeholder="Scrie răspunsul direct în aplicație"
                placeholderTextColor="#6F6A5C"
                multiline
              />
              <View style={styles.actionButtons}>
                {item.userId ? (
                  <PrimaryButton
                    label="Deschide profil"
                    variant="ghost"
                    onPress={() => router.push(`/member/${item.userId}`)}
                  />
                ) : null}
                <PrimaryButton
                  label="Deschide email"
                  variant="ghost"
                  onPress={() => void handleOpenEmail(item.email, item.subject)}
                />
                <PrimaryButton
                  label="Răspunde în app"
                  variant="gold"
                  onPress={() =>
                    void replyToContactMessage({
                      contactMessageId: item.id,
                      body: contactReplyDrafts[item.id] ?? "",
                    }).then((result) => {
                      Alert.alert(result.success ? "Răspuns trimis" : "Actualizare eșuată", result.message);
                      if (result.success) {
                        setContactReplyDrafts((prev) => ({
                          ...prev,
                          [item.id]: "",
                        }));
                      }
                    })
                  }
                />
                <PrimaryButton
                  label="Marchează citit"
                  variant="ghost"
                  onPress={() =>
                    void updateContactMessageStatus(item.id, "read").then((result) => {
                      Alert.alert(result.success ? "Mesaj actualizat" : "Actualizare eșuată", result.message);
                    })
                  }
                />
                <PrimaryButton
                  label="Marchează răspuns"
                  variant="ghost"
                  onPress={() =>
                    void updateContactMessageStatus(item.id, "replied").then((result) => {
                      Alert.alert(result.success ? "Mesaj actualizat" : "Actualizare eșuată", result.message);
                    })
                  }
                />
              </View>
            </View>
          ))
        ) : (
          <View style={styles.item}>
            <Text style={styles.itemTitle}>Nu există încă mesaje de contact</Text>
            <Text style={styles.requestNotes}>Mesajele trimise din pagina Contact apar aici automat.</Text>
          </View>
        )}
      </View> : null}

      <SectionHeader eyebrow="Utilizatori" title="Roluri și planuri" />
      <Pressable style={styles.collapseHeader} onPress={() => toggleSection("users")}>
        <Text style={styles.collapseTitle}>Utilizatori și planuri</Text>
        <Text style={styles.collapseMeta}>{openSections.users ? "Ascunde" : "Arată"}</Text>
      </Pressable>
      {openSections.users ? <View style={styles.list}>
        {adminUsers.map((member) => (
          <View key={member.id} style={styles.item}>
            <Pressable style={styles.collapseHeader} onPress={() => toggleMember(member.id)}>
              <Text style={styles.collapseTitle}>{member.name}</Text>
              <Text style={styles.collapseMeta}>{expandedMembers[member.id] ? "Ascunde" : "Arată"}</Text>
            </Pressable>
            {expandedMembers[member.id] ? (
              <>
                <Text style={styles.itemMeta}>
                  {member.email} • {member.role.toUpperCase()} • {member.plan === "PRO" ? "PREMIUM" : "FREE"}
                </Text>
                <View style={styles.actionButtons}>
                  <PrimaryButton label="Deschide profil" variant="ghost" onPress={() => router.push(`/member/${member.id}`)} />
                </View>
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
              </>
            ) : null}
          </View>
        ))}
      </View> : null}
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
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  collapseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  collapseTitle: {
    color: colors.textStrong,
    fontSize: typography.body,
    fontWeight: "800",
  },
  collapseMeta: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
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
  replyThread: {
    gap: spacing.sm,
  },
  replyBubble: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
    padding: 12,
    gap: 4,
  },
  replyAuthor: {
    color: colors.goldBright,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  replyMeta: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  replyBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
