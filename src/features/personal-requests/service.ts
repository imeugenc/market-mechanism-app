import { supabase } from "@/lib/supabase";
import { PersonalRequest, RequestStatus } from "@/types/domain";

type PersonalRequestRow = {
  id: string;
  user_email: string;
  title: string;
  video_url: string | null;
  notes: string | null;
  tier: 2 | 5 | 10 | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  archived_by: string | null;
};

function mapPersonalRequest(row: PersonalRequestRow): PersonalRequest {
  return {
    id: row.id,
    userEmail: row.user_email,
    title: row.title,
    videoUrl: row.video_url ?? undefined,
    notes: row.notes ?? undefined,
    tier: row.tier ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at ?? undefined,
    archivedBy: row.archived_by ?? undefined,
  };
}

export async function fetchPersonalRequests(options?: {
  userEmail?: string;
  includeAll?: boolean;
}) {
  let query = supabase
    .from("personal_requests")
    .select("id, user_email, title, video_url, notes, tier, status, created_at, updated_at, archived_at, archived_by")
    .order("created_at", { ascending: false });

  if (!options?.includeAll && options?.userEmail) {
    query = query.eq("user_email", options.userEmail);
  }

  const result = await query;

  return {
    ...result,
    data: result.data?.map((item) => mapPersonalRequest(item as PersonalRequestRow)) ?? null,
  };
}

export async function createPersonalRequest(input: {
  user_email: string;
  title: string;
  video_url?: string;
  notes?: string;
  tier?: 2 | 5 | 10;
  status: RequestStatus;
}) {
  const result = await supabase
    .from("personal_requests")
    .insert({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .select("id, user_email, title, video_url, notes, tier, status, created_at, updated_at, archived_at, archived_by")
    .single();

  return {
    ...result,
    data: result.data ? mapPersonalRequest(result.data as PersonalRequestRow) : null,
  };
}

export async function updatePersonalRequest(
  requestId: string,
  input: {
    user_email: string;
    title: string;
    video_url?: string;
    notes?: string;
    tier?: 2 | 5 | 10;
    status: RequestStatus;
    archived_at?: string | null;
    archived_by?: string | null;
  },
) {
  const payload: Record<string, string | number | null> = {
    user_email: input.user_email,
    title: input.title,
    video_url: input.video_url ?? null,
    notes: input.notes ?? null,
    tier: input.tier ?? null,
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  if ("archived_at" in input) {
    payload.archived_at = input.archived_at ?? null;
  }

  if ("archived_by" in input) {
    payload.archived_by = input.archived_by ?? null;
  }

  const result = await supabase
    .from("personal_requests")
    .update(payload)
    .eq("id", requestId)
    .select("id, user_email, title, video_url, notes, tier, status, created_at, updated_at, archived_at, archived_by")
    .single();

  return {
    ...result,
    data: result.data ? mapPersonalRequest(result.data as PersonalRequestRow) : null,
  };
}
