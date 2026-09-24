const CHECKOUT_URL = "https://edge.marketmechanism.xyz/api/market-analysis-checkout";

export async function startAnalysisCheckout(input: {
  accessToken: string;
  tier: 2 | 5 | 10;
  assetInput: string;
  notes: string;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(CHECKOUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${input.accessToken}` },
      body: JSON.stringify({ tier: input.tier, assetInput: input.assetInput, notes: input.notes }),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.url) throw new Error(result.error || "Nu am putut deschide plata Stripe.");
    return result.url as string;
  } finally {
    clearTimeout(timeout);
  }
}
