import { supabase } from "@/lib/supabase";
import { AfterActionReview, Market } from "@/types/domain";

type AfterActionReviewRow = {
  id: string;
  market: Market;
  title: string;
  short_text: string | null;
  summary: string | null;
  chart_image: string | null;
  chart_url: string | null;
  published_at: string | null;
  created_at: string | null;
  is_free: true;
};

function mapAfterActionReview(row: AfterActionReviewRow): AfterActionReview {
  return {
    id: row.id,
    market: row.market,
    title: row.title,
    shortText: row.short_text ?? row.summary ?? "",
    chartImage: row.chart_image ?? row.chart_url ?? "",
    publishedAt: row.published_at ?? row.created_at ?? new Date().toISOString(),
    isFree: true,
  };
}

export async function fetchAfterActionReviews() {
  const result = await supabase
    .from("after_action_reviews")
    .select("id, market, title, short_text, summary, chart_image, chart_url, published_at, created_at, is_free")
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
  published_at?: string;
}) {
  const result = await supabase
    .from("after_action_reviews")
    .insert({
      ...input,
      summary: input.short_text,
      chart_url: input.chart_image,
      published_at: input.published_at ?? new Date().toISOString(),
      is_free: true,
    })
    .select("id, market, title, short_text, summary, chart_image, chart_url, published_at, created_at, is_free")
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
    published_at?: string;
  },
) {
  const result = await supabase
    .from("after_action_reviews")
    .update({
      ...input,
      summary: input.short_text,
      chart_url: input.chart_image,
      published_at: input.published_at ?? new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select("id, market, title, short_text, summary, chart_image, chart_url, published_at, created_at, is_free")
    .single();

  return {
    ...result,
    data: result.data ? mapAfterActionReview(result.data as AfterActionReviewRow) : null,
  };
}

export async function deleteAfterActionReview(reviewId: string) {
  return supabase.from("after_action_reviews").delete().eq("id", reviewId);
}
