const JOURNAL_API_URL = (process.env.EXPO_PUBLIC_JOURNAL_API_URL || "https://edge.marketmechanism.xyz").replace(/\/+$/, "");

async function post(path: string, accessToken: string, body: object = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${JOURNAL_API_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Journal connection is unavailable.");
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function refreshJournalEntitlement(accessToken: string): Promise<{ linked: boolean }> {
  return post("/api/market-entitlement", accessToken);
}

export async function claimJournalEntitlement(accessToken: string, code: string): Promise<{ linked: boolean }> {
  return post("/api/market-claim", accessToken, { code: code.trim() });
}
