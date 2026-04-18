import { supabase } from "@/lib/supabase";
import { AnalysisRequest, PaymentStatus, RequestStatus } from "@/types/domain";

type AnalysisRequestRow = {
  id: string;
  user_id: string;
  requester_email: string | null;
  asset_input: string;
  coin_symbol: string;
  tier: 2 | 5 | 10;
  notes: string;
  status: RequestStatus;
  delivery_type: "text" | "video";
  payment_status: PaymentStatus;
  payment_proof: string | null;
  payment_reference: string | null;
  delivery_notes: string | null;
  delivery_video_url: string | null;
  admin_notes: string | null;
  delivery_url: string | null;
  requested_at: string | null;
  fulfilled_at: string | null;
  delivered_at: string | null;
  updated_at: string | null;
  created_at: string;
};

function mapRequest(row: AnalysisRequestRow): AnalysisRequest {
  return {
    id: row.id,
    userId: row.user_id,
    requesterEmail: row.requester_email ?? undefined,
    ticker: row.coin_symbol,
    assetInput: row.asset_input,
    coinSymbol: row.coin_symbol,
    tier: row.tier,
    notes: row.notes,
    status: row.status,
    deliveryType: row.delivery_type,
    paymentStatus: row.payment_status,
    paymentProof: row.payment_proof ?? undefined,
    paymentReference: row.payment_reference ?? undefined,
    adminNotes: row.admin_notes ?? undefined,
    deliveryUrl: row.delivery_url ?? row.delivery_video_url ?? undefined,
    deliveryNotes: row.delivery_notes ?? undefined,
    deliveryVideoUrl: row.delivery_video_url ?? undefined,
    requestedAt: row.requested_at ?? row.created_at,
    fulfilledAt: row.fulfilled_at ?? row.delivered_at ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    createdAt: row.created_at,
  };
}

export async function fetchAnalysisRequests() {
  const result = await supabase
    .from("analysis_requests")
    .select(
      "id, user_id, requester_email, asset_input, coin_symbol, tier, notes, status, delivery_type, payment_status, payment_proof, payment_reference, delivery_notes, delivery_video_url, admin_notes, delivery_url, requested_at, fulfilled_at, delivered_at, updated_at, created_at",
    )
    .order("created_at", { ascending: false });

  return {
    ...result,
    data: result.data?.map((item) => mapRequest(item as AnalysisRequestRow)) ?? null,
  };
}

export async function createAnalysisRequest(input: {
  user_id: string;
  requester_email?: string;
  asset_input: string;
  coin_symbol: string;
  tier: 2 | 5 | 10;
  notes: string;
  delivery_type: "text" | "video";
  payment_proof?: string;
  payment_reference?: string;
}) {
  const result = await supabase
    .from("analysis_requests")
    .insert({
      ...input,
      payment_status: "pending",
      requested_at: new Date().toISOString(),
    })
    .select(
      "id, user_id, requester_email, asset_input, coin_symbol, tier, notes, status, delivery_type, payment_status, payment_proof, payment_reference, delivery_notes, delivery_video_url, admin_notes, delivery_url, requested_at, fulfilled_at, delivered_at, updated_at, created_at",
    )
    .single();

  return {
    ...result,
    data: result.data ? mapRequest(result.data as AnalysisRequestRow) : null,
  };
}

export async function updateAnalysisRequest(
  requestId: string,
  input: {
    status: RequestStatus;
    delivery_notes?: string;
    delivery_video_url?: string;
    admin_notes?: string;
    delivery_url?: string;
    payment_status?: PaymentStatus;
  },
) {
  const payload = {
    status: input.status,
    payment_status: input.payment_status ?? undefined,
    admin_notes: input.admin_notes ?? null,
    delivery_url: input.delivery_url ?? input.delivery_video_url ?? null,
    delivery_notes: input.delivery_notes ?? null,
    delivery_video_url: input.delivery_video_url ?? null,
    delivered_at: input.status === "delivered" ? new Date().toISOString() : null,
    fulfilled_at: input.status === "delivered" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const result = await supabase
    .from("analysis_requests")
    .update(payload)
    .eq("id", requestId)
    .select(
      "id, user_id, requester_email, asset_input, coin_symbol, tier, notes, status, delivery_type, payment_status, payment_proof, payment_reference, delivery_notes, delivery_video_url, admin_notes, delivery_url, requested_at, fulfilled_at, delivered_at, updated_at, created_at",
    )
    .single();

  return {
    ...result,
    data: result.data ? mapRequest(result.data as AnalysisRequestRow) : null,
  };
}

export async function createRequestStatusEvent(input: {
  request_id: string;
  user_id: string;
  status: RequestStatus;
}) {
  return supabase.from("request_status_events").insert(input);
}
