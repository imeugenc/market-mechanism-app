import { supabase } from "@/lib/supabase";
import { PaymentRequest, UserPlan } from "@/types/domain";

type PaymentRequestRow = {
  id: string;
  user_id: string;
  type: "membership_upgrade";
  plan_target: UserPlan;
  plan_label: string | null;
  duration_days: number | null;
  full_name: string | null;
  contact_email: string | null;
  payment_method: "paypal" | "usdt" | "redotpay";
  payment_proof: string;
  transaction_ref: string | null;
  notes: string | null;
  status: "pending" | "verified" | "rejected";
  created_at: string;
  verified_at: string | null;
};

function mapPaymentRequest(row: PaymentRequestRow): PaymentRequest {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    planTarget: row.plan_target,
    planLabel: row.plan_label ?? undefined,
    durationDays: row.duration_days ?? undefined,
    fullName: row.full_name ?? "",
    contactEmail: row.contact_email ?? "",
    paymentMethod: row.payment_method,
    paymentProof: row.payment_proof,
    transactionRef: row.transaction_ref ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    verifiedAt: row.verified_at ?? undefined,
  };
}

export async function fetchPaymentRequests() {
  const result = await supabase
    .from("payment_requests")
    .select("id, user_id, type, plan_target, plan_label, duration_days, full_name, contact_email, payment_method, payment_proof, transaction_ref, notes, status, created_at, verified_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return {
    ...result,
    data: result.data?.map((row) => mapPaymentRequest(row as PaymentRequestRow)) ?? null,
  };
}

export async function createPaymentRequest(input: {
  user_id: string;
  plan_target: UserPlan;
  plan_label?: string;
  duration_days?: number;
  full_name: string;
  contact_email: string;
  payment_method: "paypal" | "usdt" | "redotpay";
  payment_proof: string;
  transaction_ref?: string;
  notes?: string;
}) {
  const result = await supabase
    .from("payment_requests")
    .insert({
      type: "membership_upgrade",
      ...input,
    })
    .select("id, user_id, type, plan_target, plan_label, duration_days, full_name, contact_email, payment_method, payment_proof, transaction_ref, notes, status, created_at, verified_at")
    .single();

  return {
    ...result,
    data: result.data ? mapPaymentRequest(result.data as PaymentRequestRow) : null,
  };
}

export async function updatePaymentRequest(
  paymentRequestId: string,
  input: {
    status: "pending" | "verified" | "rejected";
  },
) {
  const result = await supabase
    .from("payment_requests")
    .update({
      status: input.status,
      verified_at: input.status === "verified" ? new Date().toISOString() : null,
    })
    .eq("id", paymentRequestId)
    .select("id, user_id, type, plan_target, plan_label, duration_days, full_name, contact_email, payment_method, payment_proof, transaction_ref, notes, status, created_at, verified_at")
    .maybeSingle();

  return {
    ...result,
    data: result.data ? mapPaymentRequest(result.data as PaymentRequestRow) : null,
  };
}
