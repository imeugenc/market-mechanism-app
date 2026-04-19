// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";

type QueueRow = {
  id: string;
  user_id: string;
  event_name: string;
  subject: string;
  body: string;
  payload: Record<string, unknown> | null;
  status: string;
  created_at: string;
  attempt_count: number | null;
  sent_at: string | null;
  failed_at: string | null;
  last_attempt_at: string | null;
  provider_message_id: string | null;
  error_message: string | null;
};

type SendSummary = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  results: Array<{
    id: string;
    status: "sent" | "failed" | "skipped";
    recipient?: string;
    providerMessageId?: string;
    error?: string;
  }>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-email-queue-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const expectedSecret = Deno.env.get("EMAIL_QUEUE_CRON_SECRET");
const fromEmail = Deno.env.get("EMAIL_FROM") ?? "noreply@marketmechanism.xyz";
const fromName = Deno.env.get("EMAIL_FROM_NAME") ?? "Market Mechanism";
const replyTo = Deno.env.get("EMAIL_REPLY_TO") ?? Deno.env.get("OWNER_EMAIL") ?? "hello@marketmechanism.xyz";
const ownerEmail = Deno.env.get("OWNER_EMAIL") ?? "hello@marketmechanism.xyz";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
}

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY.");
}

if (!expectedSecret) {
  throw new Error("Missing EMAIL_QUEUE_CRON_SECRET.");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeHeaderValue(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}

function sanitizeTagValue(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 255);
}

function normalizeRecipient(row: QueueRow) {
  const payloadEmail = typeof row.payload?.email === "string" ? row.payload.email.trim() : "";
  return payloadEmail || ownerEmail;
}

function rowSubjectFallback(eventName: string) {
  return eventName
    .split("_")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function textToHtmlParagraphs(input: string) {
  return escapeHtml(input)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replaceAll("\n", "<br />"))
    .filter(Boolean)
    .map((paragraph) => `<p style="margin:0 0 14px;color:#f5f1e6;font-size:15px;line-height:1.7;">${paragraph}</p>`)
    .join("");
}

function renderMetadataCards(row: QueueRow) {
  const entries = Object.entries(row.payload ?? {})
    .filter(([key, value]) => key !== "email" && value !== null && value !== undefined && `${value}`.trim() !== "");

  if (!entries.length) {
    return "";
  }

  return `
    <div style="margin-top:18px;display:grid;gap:10px;">
      ${entries
        .map(
          ([key, value]) => `
            <div style="padding:12px 14px;border:1px solid #28231a;border-radius:12px;background:#0f1013;">
              <div style="margin-bottom:4px;color:#8e8a7a;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">${escapeHtml(key)}</div>
              <div style="color:#f5f1e6;font-size:14px;line-height:1.6;">${escapeHtml(String(value))}</div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function buildShell(title: string, recipient: string, preview: string, content: string) {
  return `
    <div style="background:#0b0b0d;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f5f1e6;">
      <div style="max-width:640px;margin:0 auto;background:#111215;border:1px solid #28231a;border-radius:18px;overflow:hidden;">
        <div style="padding:24px 24px 12px;border-bottom:1px solid #28231a;">
          <div style="color:#c89b2a;font-size:12px;letter-spacing:.18em;text-transform:uppercase;font-weight:700;">Market Mechanism</div>
          <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#f5f1e6;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px;color:#b8b2a3;font-size:14px;">Destinatar: ${escapeHtml(recipient)}</p>
          <p style="margin:0 0 18px;color:#a8a18f;font-size:14px;line-height:1.7;">${escapeHtml(preview)}</p>
          ${content}
          <div style="margin-top:24px;padding-top:16px;border-top:1px solid #28231a;color:#8e8a7a;font-size:12px;line-height:1.6;">
            Acest email a fost trimis automat din aplicația Execution Edge pentru notificări tranzacționale legate de contul tău.
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildGenericHtml(row: QueueRow, recipient: string, title: string, preview: string) {
  return buildShell(title, recipient, preview, `${textToHtmlParagraphs(row.body)}${renderMetadataCards(row)}`);
}

function buildPremiumRequestAdminHtml(row: QueueRow, recipient: string) {
  return buildShell(
    "Cerere nouă pentru upgrade Premium",
    recipient,
    "Un membru a trimis o confirmare de plată pentru activarea sau prelungirea accesului Premium.",
    `
      <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:#231b08;color:#f5c451;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">
        Premium
      </div>
      ${textToHtmlParagraphs(row.body)}
      <div style="margin-top:20px;padding:16px;border:1px solid #3a2d10;border-radius:14px;background:#15110a;">
        <div style="color:#c89b2a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Acțiune recomandată</div>
        <div style="margin-top:8px;color:#f5f1e6;font-size:14px;line-height:1.6;">Verifică dovada plății și validează accesul Premium din consola de administrare.</div>
      </div>
      ${renderMetadataCards(row)}
    `,
  );
}

function buildAnalysisRequestAdminHtml(row: QueueRow, recipient: string) {
  return buildShell(
    "Cerere nouă de analiză personală",
    recipient,
    "Un membru a trimis o solicitare nouă pentru analiză personalizată.",
    `
      <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:#0f1720;color:#7ec8ff;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">
        Analiză personală
      </div>
      ${textToHtmlParagraphs(row.body)}
      <div style="margin-top:20px;padding:16px;border:1px solid #24384a;border-radius:14px;background:#0f151c;">
        <div style="color:#7ec8ff;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Acțiune recomandată</div>
        <div style="margin-top:8px;color:#f5f1e6;font-size:14px;line-height:1.6;">Deschide solicitarea în Admin, confirmă plata și setează statusul inițial pentru livrare.</div>
      </div>
      ${renderMetadataCards(row)}
    `,
  );
}

function buildAnalysisDeliveredHtml(row: QueueRow, recipient: string) {
  return buildShell(
    "Analiza ta este gata",
    recipient,
    "Solicitarea ta a fost finalizată și este disponibilă în contul tău.",
    `
      ${textToHtmlParagraphs(row.body)}
      <div style="margin-top:20px;padding:16px;border:1px solid #1f3b22;border-radius:14px;background:#0f1811;">
        <div style="color:#7edb8a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Următorul pas</div>
        <div style="margin-top:8px;color:#f5f1e6;font-size:14px;line-height:1.6;">Intră în aplicație, deschide secțiunea de analize personale și accesează livrarea ta.</div>
      </div>
      ${renderMetadataCards(row)}
    `,
  );
}

function buildMessageReplyHtml(row: QueueRow, recipient: string) {
  return buildShell(
    "Ai primit un răspuns nou",
    recipient,
    "Adminul ți-a răspuns în aplicație. Poți continua conversația din contul tău.",
    `
      ${textToHtmlParagraphs(row.body)}
      <div style="margin-top:20px;padding:16px;border:1px solid #28231a;border-radius:14px;background:#101114;">
        <div style="color:#c89b2a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;">Comunicare</div>
        <div style="margin-top:8px;color:#f5f1e6;font-size:14px;line-height:1.6;">Deschide profilul tău și intră în secțiunea de comunicare cu adminul pentru context complet.</div>
      </div>
      ${renderMetadataCards(row)}
    `,
  );
}

function buildContentPublishedHtml(row: QueueRow, recipient: string) {
  return buildShell(
    "Conținut nou publicat",
    recipient,
    "A fost publicat un update nou în aplicație.",
    `
      ${textToHtmlParagraphs(row.body)}
      ${renderMetadataCards(row)}
    `,
  );
}

function resolveSubject(row: QueueRow, recipient: string) {
  switch (row.event_name) {
    case "premium_nou_admin":
      return "Cerere nouă pentru upgrade Premium";
    case "premium_validat":
    case "premium_activat":
      return "Accesul tău Premium este activ";
    case "premium_respins":
      return "Actualizare pentru cererea ta Premium";
    case "cerere_primită":
      return recipient.toLowerCase() === ownerEmail.toLowerCase()
        ? "Cerere nouă de analiză personală"
        : "Am primit solicitarea ta de analiză";
    case "cerere_acceptată":
      return "Solicitarea ta de analiză a fost acceptată";
    case "cerere_livrată":
      return "Analiza ta este gata";
    case "mesaj_admin":
      return "Ai primit un răspuns nou în aplicație";
    case "continut_nou":
      return "Conținut nou disponibil în aplicație";
    default:
      return row.subject || rowSubjectFallback(row.event_name);
  }
}

function resolveText(row: QueueRow, recipient: string, subject: string) {
  const metadata = Object.entries(row.payload ?? {})
    .filter(([key, value]) => key !== "email" && value !== null && value !== undefined && `${value}`.trim() !== "")
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("\n");

  return [subject, "", row.body, metadata ? `\n${metadata}` : "", "", "Execution Edge / Market Mechanism"]
    .join("\n")
    .trim();
}

function buildHtml(row: QueueRow, recipient: string, subject: string) {
  if (row.event_name === "premium_nou_admin") {
    return buildPremiumRequestAdminHtml(row, recipient);
  }

  if (row.event_name === "cerere_primită" && recipient.toLowerCase() === ownerEmail.toLowerCase()) {
    return buildAnalysisRequestAdminHtml(row, recipient);
  }

  if (row.event_name === "cerere_livrată") {
    return buildAnalysisDeliveredHtml(row, recipient);
  }

  if (row.event_name === "mesaj_admin") {
    return buildMessageReplyHtml(row, recipient);
  }

  if (row.event_name === "continut_nou") {
    return buildContentPublishedHtml(row, recipient);
  }

  return buildGenericHtml(row, recipient, subject, row.body);
}

async function markRow(rowId: string, status: "sent" | "failed", providerMessageId?: string, errorMessage?: string) {
  const { error } = await supabaseAdmin.rpc("complete_email_notification_delivery", {
    p_queue_id: rowId,
    p_status: status,
    p_provider_message_id: providerMessageId ?? null,
    p_error_message: errorMessage ?? null,
  });

  if (error) {
    console.error("Failed to finalize email queue row", rowId, error);
  }
}

async function sendEmail(row: QueueRow) {
  const recipient = normalizeRecipient(row);
  const idempotencyKey = sanitizeHeaderValue(`${row.event_name}-${row.id}`) || row.id;
  const eventTag = sanitizeTagValue(row.event_name) || "email-event";
  const queueIdTag = sanitizeTagValue(row.id) || "queue-id";
  const subject = resolveSubject(row, recipient);

  if (!recipient) {
    await markRow(row.id, "failed", undefined, "Missing recipient email in payload.");
    return {
      id: row.id,
      status: "failed" as const,
      error: "Missing recipient email in payload.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "User-Agent": "execution-edge-email-worker/1.0",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [recipient],
      reply_to: replyTo,
      subject,
      html: buildHtml(row, recipient, subject),
      text: resolveText(row, recipient, subject),
      tags: [
        { name: "event", value: eventTag },
        { name: "queue_id", value: queueIdTag },
      ],
    }),
  });

  const responseText = await response.text();
  let parsed: { id?: string; message?: string; name?: string } = {};

  try {
    parsed = responseText ? JSON.parse(responseText) : {};
  } catch (_error) {
    parsed = {};
  }

  if (!response.ok) {
    const errorMessage = parsed.message ?? parsed.name ?? responseText ?? `HTTP ${response.status}`;
    await markRow(row.id, "failed", undefined, errorMessage);
    return {
      id: row.id,
      status: "failed" as const,
      recipient,
      error: errorMessage,
    };
  }

  await markRow(row.id, "sent", parsed.id);
  return {
    id: row.id,
    status: "sent" as const,
    recipient,
    providerMessageId: parsed.id,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const providedSecret = request.headers.get("x-email-queue-secret");

  if (providedSecret !== expectedSecret) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  let body: { batchSize?: number } = {};

  try {
    body = await request.json();
  } catch (_error) {
    body = {};
  }

  const batchSize = Math.max(1, Math.min(50, Number(body.batchSize ?? 20)));
  const { data, error } = await supabaseAdmin.rpc("claim_email_notification_batch", {
    batch_size: batchSize,
  });

  if (error) {
    console.error("Failed to claim email queue batch", error);
    return jsonResponse({ error: error.message }, 500);
  }

  const rows = (data ?? []) as QueueRow[];
  const summary: SendSummary = {
    processed: rows.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    results: [],
  };

  for (const row of rows) {
    try {
      const result = await sendEmail(row);
      summary.results.push(result);
      if (result.status === "sent") {
        summary.sent += 1;
      } else {
        summary.failed += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown send error.";
      console.error("Unexpected email send failure", row.id, error);
      await markRow(row.id, "failed", undefined, message);
      summary.results.push({
        id: row.id,
        status: "failed",
        recipient: normalizeRecipient(row),
        error: message,
      });
      summary.failed += 1;
    }
  }

  return jsonResponse(summary, 200);
});
