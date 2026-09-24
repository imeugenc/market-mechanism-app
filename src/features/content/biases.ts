import { normalizeIsoDate } from "@/lib/dates";
import { sanitizeRemoteImageUrl } from "@/lib/media";
import { supabase } from "@/lib/supabase";
import { DailyBias, Market } from "@/types/domain";

type DailyBiasRow = {
  id: string;
  market: Market;
  forecasted_bias: DailyBias["forecastedBias"];
  confidence: DailyBias["confidence"];
  outcome: DailyBias["outcome"];
  notes: string | null;
  chart_image: string | null;
  video_url: string | null;
  related_review_id: string | null;
  published_at: string | null;
  created_at: string | null;
  trading_date: string | null;
  liquidity_target: string | null;
  tradingview_url: string | null;
  thumbnail_url: string | null;
  external_source_id: string | null;
};

const SELECT_COLUMNS = "id, market, forecasted_bias, confidence, outcome, notes, chart_image, video_url, related_review_id, published_at, created_at, trading_date, liquidity_target, tradingview_url, thumbnail_url, external_source_id";

function mapDailyBias(row: DailyBiasRow): DailyBias {
  return {
    id: row.id,
    market: row.market,
    forecastedBias: row.forecasted_bias,
    confidence: row.confidence,
    outcome: row.outcome,
    notes: row.notes ?? "",
    chartImage: sanitizeRemoteImageUrl(row.chart_image),
    videoUrl: row.video_url ?? undefined,
    relatedReviewId: row.related_review_id ?? undefined,
    publishedAt: normalizeIsoDate(row.published_at, normalizeIsoDate(row.created_at)),
    tradingDate: row.trading_date ?? undefined,
    liquidityTarget: row.liquidity_target ?? undefined,
    tradingviewUrl: row.tradingview_url ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    externalSourceId: row.external_source_id ?? undefined,
  };
}

export async function fetchDailyBiases() {
  const result = await supabase.from("daily_biases").select(SELECT_COLUMNS).order("published_at", { ascending: false });

  return {
    ...result,
    data: result.data?.map((item) => mapDailyBias(item as DailyBiasRow)) ?? null,
  };
}

export async function fetchDailyBiasById(id: string) {
  const result = await supabase.from("daily_biases").select(SELECT_COLUMNS)
    .eq("id", id).eq("is_visible", true).maybeSingle();

  return { ...result, data: result.data ? mapDailyBias(result.data as DailyBiasRow) : null };
}

export async function publishDailyBias(input: Omit<DailyBias, "id">) {
  const result = await supabase
    .from("daily_biases")
    .insert({
      market: input.market,
      forecasted_bias: input.forecastedBias,
      confidence: input.confidence,
      outcome: input.outcome,
      notes: input.notes,
      chart_image: sanitizeRemoteImageUrl(input.chartImage),
      video_url: input.videoUrl?.trim() || null,
      related_review_id: input.relatedReviewId || null,
      published_at: normalizeIsoDate(input.publishedAt),
      trading_date: input.tradingDate || null,
      liquidity_target: input.liquidityTarget || null,
      tradingview_url: input.tradingviewUrl || null,
      thumbnail_url: input.thumbnailUrl || null,
    })
    .select(SELECT_COLUMNS)
    .single();

  return { ...result, data: result.data ? mapDailyBias(result.data as DailyBiasRow) : null };
}

export async function updateDailyBias(biasId: string, input: Omit<DailyBias, "id">) {
  const result = await supabase
    .from("daily_biases")
    .update({
      market: input.market,
      forecasted_bias: input.forecastedBias,
      confidence: input.confidence,
      outcome: input.outcome,
      notes: input.notes,
      chart_image: sanitizeRemoteImageUrl(input.chartImage),
      video_url: input.videoUrl?.trim() || null,
      related_review_id: input.relatedReviewId || null,
      published_at: normalizeIsoDate(input.publishedAt),
      updated_at: new Date().toISOString(),
      ...(input.tradingDate !== undefined ? { trading_date: input.tradingDate || null } : {}),
      ...(input.liquidityTarget !== undefined ? { liquidity_target: input.liquidityTarget || null } : {}),
      ...(input.tradingviewUrl !== undefined ? { tradingview_url: input.tradingviewUrl || null } : {}),
      ...(input.thumbnailUrl !== undefined ? { thumbnail_url: input.thumbnailUrl || null } : {}),
    })
    .eq("id", biasId)
    .select(SELECT_COLUMNS)
    .single();

  return { ...result, data: result.data ? mapDailyBias(result.data as DailyBiasRow) : null };
}

export async function deleteDailyBias(biasId: string) {
  return supabase.from("daily_biases").delete().eq("id", biasId);
}
