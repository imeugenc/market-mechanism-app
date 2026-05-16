import { supabase } from "@/lib/supabase";
import { ContentComment } from "@/types/domain";

type CommentRow = {
  id: string;
  content_type: "review" | "analysis" | "altcoin" | "news";
  content_id: string;
  user_id: string | null;
  author_name: string;
  body: string;
  created_at: string;
};

function mapComment(row: CommentRow): ContentComment {
  return {
    id: row.id,
    contentType: row.content_type,
    contentId: row.content_id,
    userId: row.user_id ?? undefined,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function fetchContentComments(contentType: ContentComment["contentType"], contentId: string) {
  const result = await supabase
    .from("content_comments")
    .select("id, content_type, content_id, user_id, author_name, body, created_at")
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .order("created_at", { ascending: true });

  return {
    ...result,
    data: result.data?.map((row) => mapComment(row as CommentRow)) ?? null,
  };
}

export async function createContentComment(input: {
  content_type: ContentComment["contentType"];
  content_id: string;
  user_id?: string;
  author_name: string;
  body: string;
}) {
  const result = await supabase
    .from("content_comments")
    .insert({
      content_type: input.content_type,
      content_id: input.content_id,
      user_id: input.user_id ?? null,
      author_name: input.author_name,
      body: input.body,
    })
    .select("id, content_type, content_id, user_id, author_name, body, created_at")
    .single();

  return {
    ...result,
    data: result.data ? mapComment(result.data as CommentRow) : null,
  };
}

export async function deleteContentComment(commentId: string) {
  return supabase.from("content_comments").delete().eq("id", commentId);
}
