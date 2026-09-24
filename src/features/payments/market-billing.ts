import { supabase } from "@/lib/supabase";

const ENDPOINT = "https://edge.marketmechanism.xyz/api/market-billing";

export type MarketBillingStatus = {
  subscription: null | { status: string; cancelAtPeriodEnd: boolean; paidThroughAt: string | null };
};

export async function marketBilling(action: "status" | "checkout" | "cancel" | "resume", plan?: "monthly" | "quarterly") {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Sign in to manage your subscription.");
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ action, plan }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Billing is unavailable.");
  return result as MarketBillingStatus & { url?: string; cancelAtPeriodEnd?: boolean; paidThroughAt?: string };
}
