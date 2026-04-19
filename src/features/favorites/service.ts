import { supabase } from "@/lib/supabase";
import { FavoriteContentType, FavoriteItem } from "@/types/domain";

type FavoriteRow = {
  id: string;
  user_id: string;
  content_type: FavoriteContentType;
  content_id: string;
  title: string;
  subtitle: string | null;
  market_label: string | null;
  created_at: string;
};

function mapFavorite(row: FavoriteRow): FavoriteItem {
  return {
    id: row.id,
    userId: row.user_id,
    contentType: row.content_type,
    contentId: row.content_id,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    marketLabel: row.market_label ?? undefined,
    createdAt: row.created_at,
  };
}

export async function fetchFavorites(userId: string) {
  const result = await supabase
    .from("content_favorites")
    .select("id, user_id, content_type, content_id, title, subtitle, market_label, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return {
    ...result,
    data: result.data?.map((row) => mapFavorite(row as FavoriteRow)) ?? null,
  };
}

export async function createFavorite(input: {
  user_id: string;
  content_type: FavoriteContentType;
  content_id: string;
  title: string;
  subtitle?: string;
  market_label?: string;
}) {
  const result = await supabase
    .from("content_favorites")
    .upsert({
      ...input,
      subtitle: input.subtitle ?? null,
      market_label: input.market_label ?? null,
    }, { onConflict: "user_id,content_type,content_id" })
    .select("id, user_id, content_type, content_id, title, subtitle, market_label, created_at")
    .single();

  return {
    ...result,
    data: result.data ? mapFavorite(result.data as FavoriteRow) : null,
  };
}

export async function deleteFavorite(userId: string, contentType: FavoriteContentType, contentId: string) {
  return supabase
    .from("content_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("content_type", contentType)
    .eq("content_id", contentId);
}
