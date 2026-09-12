import { useEffect, useState } from "react";
import { Linking, StyleSheet, Text, TextInput, View } from "react-native";
import { type Href, router, Stack, useLocalSearchParams } from "expo-router";

import { PremiumCard } from "@/components/PremiumCard";
import { ContentStatePanel } from "@/components/ContentStatePanel";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { createContentComment, deleteContentComment, fetchContentComments } from "@/features/comments/service";
import { useAppState } from "@/providers/AppProvider";
import { formatDate } from "@/lib/format";
import { useClientReady } from "@/hooks/useResponsiveWeb";
import { sanitizeRemoteImageUrl } from "@/lib/media";
import { colors, radii, spacing, typography } from "@/theme";
import { Image } from "react-native";
import { ContentComment } from "@/types/domain";

export default function ReviewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dailyBiases, publicContentState, session, user, reviews } = useAppState();
  const clientReady = useClientReady();
  const review = reviews.find((item) => item.id === id);
  const relatedBias = dailyBiases.find((item) => item.relatedReviewId === id);
  const chartImage = sanitizeRemoteImageUrl(review?.chartImage);
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }

    setCommentsLoading(true);
    void fetchContentComments("review", id).then((result) => {
      setComments(result.data ?? []);
      setCommentsLoading(false);
    });
  }, [id]);

  const submitComment = async () => {
    if (!session?.user) {
      setCommentError("Autentifică-te pentru a comenta.");
      return;
    }

    if (commentBody.trim().length < 2) {
      setCommentError("Scrie un comentariu mai clar înainte să îl trimiți.");
      return;
    }

    const result = await createContentComment({
      content_type: "review",
      content_id: id,
      user_id: session.user.id,
      author_name: user?.name ?? session.user.email?.split("@")[0] ?? "Membru",
      body: commentBody.trim(),
    });

    if (result.error || !result.data) {
      setCommentError(`Comentariul nu a putut fi salvat. ${result.error?.message ?? "Încearcă din nou."}`);
      return;
    }

    setComments((prev) => [...prev, result.data!]);
    setCommentBody("");
    setCommentError("");
  };

  if (!clientReady || publicContentState === "loading") return <Screen><ContentStatePanel kind="loading" title="Se încarcă After Action Review…" /></Screen>;
  if (publicContentState === "error") return <Screen><ContentStatePanel kind="error" /></Screen>;

  if (!review) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "After Action Review", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }} />
        <ContentStatePanel kind="removed" title="Acest After Action Review nu mai este disponibil" />
        <PrimaryButton label="Înapoi la piețe" onPress={() => router.replace("/(tabs)/markets")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: "After Action Review", headerBackTitle: "", headerBackButtonDisplayMode: "minimal" }} />
      <PrimaryButton label={`Înapoi la ${review.market}`} variant="ghost" onPress={() => router.replace(`/(tabs)/markets/${review.market}`)} />
      <View style={styles.card}>
        {chartImage ? (
          <Image source={{ uri: chartImage }} style={styles.image} />
        ) : (
          <View style={styles.previewUnavailable}>
            <Text style={styles.previewUnavailableText}>Preview chart indisponibil</Text>
          </View>
        )}
        <View style={styles.header}>
          <Text style={styles.market}>{review.market}</Text>
          <Text style={styles.date}>{formatDate(review.publishedAt)}</Text>
        </View>
        <Text style={styles.title}>{review.title}</Text>
        <Text style={styles.body}>{review.bodyText ?? review.shortText}</Text>
        {review.videoUrl ? <PrimaryButton label="Deschide video" onPress={() => void Linking.openURL(review.videoUrl!)} /> : null}
        {relatedBias ? (
          <View style={styles.relatedCard}>
            <Text style={styles.relatedEyebrow}>DAILY BIAS ASOCIAT</Text>
            <Text style={styles.relatedTitle}>{relatedBias.market} · {relatedBias.forecastedBias} · {relatedBias.confidence} confidence</Text>
            <PrimaryButton label="Vezi Daily Bias" variant="ghost" onPress={() => router.push(`/bias/${relatedBias.id}` as Href)} />
          </View>
        ) : null}
        <View style={styles.commentsCard}>
          <Text style={styles.commentsTitle}>Comentarii</Text>
          <TextInput
            value={commentBody}
            onChangeText={setCommentBody}
            style={styles.input}
            placeholder="Adaugă opinia ta despre acest review"
            placeholderTextColor="#6F6A5C"
            multiline
          />
          {commentError ? <Text style={styles.error}>{commentError}</Text> : null}
          <PrimaryButton label="Trimite comentariul" onPress={() => void submitComment()} />
          <View style={styles.commentsList}>
            {commentsLoading ? <ContentStatePanel kind="loading" title="Se încarcă discuția…" compact /> : comments.length ? (
              comments.map((item) => (
                <View key={item.id} style={styles.commentRow}>
                  <Text
                    style={styles.commentAuthor}
                    onPress={() => {
                      if (item.userId) {
                        router.push(`/member/${item.userId}`);
                      }
                    }}
                  >
                    {item.authorName}
                  </Text>
                  <Text style={styles.commentMeta}>{formatDate(item.createdAt)}</Text>
                  <Text style={styles.commentBody}>{item.body}</Text>
                  {user?.isAdmin ? (
                    <View style={styles.commentActions}>
                      <PrimaryButton
                        label="Șterge comentariul"
                        variant="ghost"
                        onPress={() =>
                          void deleteContentComment(item.id).then((result) => {
                            if (result.error) {
                              setCommentError(`Comentariul nu a putut fi șters. ${result.error.message}`);
                              return;
                            }

                            setComments((prev) => prev.filter((comment) => comment.id !== item.id));
                          })
                        }
                      />
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.body}>Nu există încă comentarii. Poți deschide tu discuția.</Text>
            )}
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgPanel,
    overflow: "hidden",
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  image: {
    width: "100%",
    height: 220,
  },
  previewUnavailable: {
    alignItems: "center",
    backgroundColor: colors.bgMuted,
    height: 220,
    justifyContent: "center",
    padding: spacing.md,
  },
  previewUnavailableText: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "700",
  },
  relatedCard: {
    backgroundColor: colors.bgMuted,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.md,
  },
  relatedEyebrow: { color: colors.gold, fontSize: typography.small, fontWeight: "800", letterSpacing: 1 },
  relatedTitle: { color: colors.textStrong, fontSize: typography.body, fontWeight: "800" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  market: {
    color: colors.gold,
    fontSize: typography.small,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  date: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  title: {
    color: colors.textStrong,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
    paddingHorizontal: spacing.md,
  },
  body: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  commentsCard: {
    marginHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgMuted,
    padding: spacing.md,
    gap: spacing.sm,
  },
  commentsTitle: {
    color: colors.textStrong,
    fontSize: typography.section,
    fontWeight: "800",
  },
  input: {
    minHeight: 88,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSoft,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  error: {
    color: colors.danger,
    fontSize: typography.small,
    lineHeight: 18,
  },
  commentsList: {
    gap: spacing.sm,
  },
  commentRow: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgPanel,
    padding: 12,
    gap: 4,
  },
  commentAuthor: {
    color: colors.goldBright,
    fontSize: typography.body,
    fontWeight: "800",
  },
  commentMeta: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  commentBody: {
    color: colors.textSoft,
    fontSize: typography.body,
    lineHeight: 22,
  },
  commentActions: {
    marginTop: 6,
  },
});
