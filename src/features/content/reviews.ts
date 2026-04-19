import { supabase } from "@/lib/supabase";
import { AfterActionReview, Market } from "@/types/domain";
import { normalizeIsoDate } from "@/lib/dates";
import { sanitizeRemoteImageUrl } from "@/lib/media";

type AfterActionReviewRow = {
  id: string;
  market: Market;
  title: string;
  short_text: string | null;
  body_text: string | null;
  summary: string | null;
  chart_image: string | null;
  chart_url: string | null;
  video_url: string | null;
  published_at: string | null;
  created_at: string | null;
  is_free: true;
};

function mapAfterActionReview(row: AfterActionReviewRow): AfterActionReview {
  const fallbackDate = normalizeIsoDate(row.created_at);

  return {
    id: row.id,
    market: row.market,
    title: row.title,
    shortText: row.short_text ?? row.summary ?? "",
    bodyText: row.body_text ?? row.short_text ?? row.summary ?? "",
    chartImage: sanitizeRemoteImageUrl(row.chart_image ?? row.chart_url),
    videoUrl: row.video_url ?? undefined,
    publishedAt: normalizeIsoDate(row.published_at, fallbackDate),
    isFree: true,
  };
}

export async function fetchAfterActionReviews() {
  const result = await supabase
    .from("after_action_reviews")
    .select("id, market, title, short_text, body_text, summary, chart_image, chart_url, video_url, published_at, created_at, is_free")
    .order("created_at", { ascending: false });

  return {
    ...result,
    data: result.data?.map((item) => mapAfterActionReview(item as AfterActionReviewRow)) ?? null,
  };
}

export async function publishAfterActionReview(input: {
  market: Market;
  title: string;
  short_text: string;
  chart_image: string;
  body_text?: string;
  video_url?: string;
  published_at?: string;
}) {
  const publishedAt = normalizeIsoDate(input.published_at);
  const result = await supabase
    .from("after_action_reviews")
    .insert({
      ...input,
      summary: input.short_text,
      chart_url: input.chart_image,
      published_at: publishedAt,
      is_free: true,
    })
    .select("id, market, title, short_text, body_text, summary, chart_image, chart_url, video_url, published_at, created_at, is_free")
    .single();

  return {
    ...result,
    data: result.data ? mapAfterActionReview(result.data as AfterActionReviewRow) : null,
  };
}

export async function updateAfterActionReview(
  reviewId: string,
  input: {
    market: Market;
    title: string;
    short_text: string;
    chart_image: string;
    body_text?: string;
    video_url?: string;
    published_at?: string;
  },
) {
  const publishedAt = normalizeIsoDate(input.published_at);
  const result = await supabase
    .from("after_action_reviews")
    .update({
      ...input,
      summary: input.short_text,
      chart_url: input.chart_image,
      published_at: publishedAt,
    })
    .eq("id", reviewId)
    .select("id, market, title, short_text, body_text, summary, chart_image, chart_url, video_url, published_at, created_at, is_free")
    .single();

  return {
    ...result,
    data: result.data ? mapAfterActionReview(result.data as AfterActionReviewRow) : null,
  };
}

export async function deleteAfterActionReview(reviewId: string) {
  return supabase.from("after_action_reviews").delete().eq("id", reviewId);
}
