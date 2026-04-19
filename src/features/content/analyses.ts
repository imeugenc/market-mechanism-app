import { DailyAnalysis, Market } from "@/types/domain";
import { supabase } from "@/lib/supabase";
import { normalizeIsoDate } from "@/lib/dates";

type DailyAnalysisRow = {
  id: string;
  market: Market;
  title: string;
  summary: string | null;
  chart_images: string[] | null;
  video_url: string;
  is_premium: boolean | null;
  premium_only: boolean | null;
  published_at: string | null;
  created_at: string | null;
  tags: string[] | null;
  status: "Live" | "Plan" | "Watch";
};

function mapDailyAnalysis(row: DailyAnalysisRow): DailyAnalysis {
  const fallbackDate = normalizeIsoDate(row.created_at);

  return {
    id: row.id,
    market: row.market,
    title: row.title,
    summary: row.summary ?? undefined,
    chartImages: row.chart_images ?? undefined,
    videoUrl: row.video_url,
    isPremium: row.is_premium ?? row.premium_only ?? true,
    publishedAt: normalizeIsoDate(row.published_at, fallbackDate),
    tags: row.tags ?? undefined,
    status: row.status ?? undefined,
  };
}

export async function fetchDailyAnalyses() {
  const result = await supabase
    .from("daily_analyses")
    .select("id, market, title, summary, chart_images, video_url, is_premium, premium_only, published_at, created_at, tags, status")
    .order("created_at", { ascending: false });

  return {
    ...result,
    data: result.data?.map((item) => mapDailyAnalysis(item as DailyAnalysisRow)) ?? null,
  };
}

export async function publishDailyAnalysis(input: {
  market: Market;
  title: string;
  summary?: string;
  chart_images?: string[];
  video_url: string;
  is_premium: boolean;
  tags?: string[];
  status?: "Live" | "Plan" | "Watch";
  published_at?: string;
}) {
  const publishedAt = normalizeIsoDate(input.published_at);
  const result = await supabase
    .from("daily_analyses")
    .insert({
      ...input,
      summary: input.summary ?? null,
      chart_images: input.chart_images ?? [],
      premium_only: input.is_premium,
      published_at: publishedAt,
      tags: input.tags ?? [],
      status: input.status ?? "Live",
    })
    .select("id, market, title, summary, chart_images, video_url, is_premium, premium_only, published_at, created_at, tags, status")
    .single();

  return {
    ...result,
    data: result.data ? mapDailyAnalysis(result.data as DailyAnalysisRow) : null,
  };
}

export async function updateDailyAnalysis(
  analysisId: string,
  input: {
    market: Market;
    title: string;
    summary?: string;
    chart_images?: string[];
    video_url: string;
    is_premium: boolean;
    tags?: string[];
    status?: "Live" | "Plan" | "Watch";
    published_at?: string;
  },
) {
  const publishedAt = normalizeIsoDate(input.published_at);
  const result = await supabase
    .from("daily_analyses")
    .update({
      ...input,
      summary: input.summary ?? null,
      chart_images: input.chart_images ?? [],
      premium_only: input.is_premium,
      published_at: publishedAt,
      tags: input.tags ?? [],
      status: input.status ?? "Live",
    })
    .eq("id", analysisId)
    .select("id, market, title, summary, chart_images, video_url, is_premium, premium_only, published_at, created_at, tags, status")
    .single();

  return {
    ...result,
    data: result.data ? mapDailyAnalysis(result.data as DailyAnalysisRow) : null,
  };
}

export async function deleteDailyAnalysis(analysisId: string) {
  return supabase.from("daily_analyses").delete().eq("id", analysisId);
}
