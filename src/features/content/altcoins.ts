import { normalizeIsoDate } from "@/lib/dates";
import { sanitizeRemoteImageUrl } from "@/lib/media";
import { supabase } from "@/lib/supabase";
import { AltcoinPost } from "@/types/domain";

type AltcoinPostRow = {
  id: string;
  coin_symbol: string;
  title: string;
  summary: string | null;
  body_text: string | null;
  chart_image: string | null;
  video_url: string | null;
  is_premium: boolean | null;
  published_at: string | null;
  created_at: string | null;
};

function mapAltcoinPost(row: AltcoinPostRow): AltcoinPost {
  const fallbackDate = normalizeIsoDate(row.created_at);

  return {
    id: row.id,
    coinSymbol: row.coin_symbol,
    title: row.title,
    summary: row.summary ?? "",
    bodyText: row.body_text ?? "",
    chartImage: sanitizeRemoteImageUrl(row.chart_image),
    videoUrl: row.video_url ?? undefined,
    isPremium: row.is_premium ?? false,
    publishedAt: normalizeIsoDate(row.published_at, fallbackDate),
  };
}

export async function fetchAltcoinPosts() {
  const result = await supabase
    .from("altcoin_posts")
    .select("id, coin_symbol, title, summary, body_text, chart_image, video_url, is_premium, published_at, created_at")
    .order("published_at", { ascending: false });

  return {
    ...result,
    data: result.data?.map((item) => mapAltcoinPost(item as AltcoinPostRow)) ?? null,
  };
}

export async function publishAltcoinPost(input: {
  coin_symbol: string;
  title: string;
  summary?: string;
  body_text: string;
  chart_image?: string;
  video_url?: string;
  is_premium: boolean;
  published_at?: string;
}) {
  const result = await supabase
    .from("altcoin_posts")
    .insert({
      ...input,
      chart_image: sanitizeRemoteImageUrl(input.chart_image),
      published_at: normalizeIsoDate(input.published_at),
    })
    .select("id, coin_symbol, title, summary, body_text, chart_image, video_url, is_premium, published_at, created_at")
    .single();

  return {
    ...result,
    data: result.data ? mapAltcoinPost(result.data as AltcoinPostRow) : null,
  };
}

export async function updateAltcoinPost(
  postId: string,
  input: {
    coin_symbol: string;
    title: string;
    summary?: string;
    body_text: string;
    chart_image?: string;
    video_url?: string;
    is_premium: boolean;
    published_at?: string;
  },
) {
  const result = await supabase
    .from("altcoin_posts")
    .update({
      ...input,
      chart_image: sanitizeRemoteImageUrl(input.chart_image),
      published_at: normalizeIsoDate(input.published_at),
    })
    .eq("id", postId)
    .select("id, coin_symbol, title, summary, body_text, chart_image, video_url, is_premium, published_at, created_at")
    .single();

  return {
    ...result,
    data: result.data ? mapAltcoinPost(result.data as AltcoinPostRow) : null,
  };
}

export async function deleteAltcoinPost(postId: string) {
  return supabase.from("altcoin_posts").delete().eq("id", postId);
}
