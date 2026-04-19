import { supabase } from "@/lib/supabase";

type RequestEmailEvent = "cerere_primită" | "cerere_acceptată" | "cerere_livrată";

export interface EmailNotificationPayload {
  event: RequestEmailEvent;
  userId: string;
  email: string;
  requestId: string;
  subject: string;
  body: string;
  metadata?: Record<string, string | undefined>;
}

export interface AccountEmailNotificationPayload {
  userId: string;
  email: string;
  subject: string;
  body: string;
  eventName?: string;
  metadata?: Record<string, string | undefined>;
}

export async function queueRequestEmailNotification(payload: EmailNotificationPayload) {
  if (!payload.userId || payload.userId === "guest") {
    return {
      queued: false,
      payload,
    };
  }

  if (
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.EXPO_PUBLIC_SUPABASE_URL.includes("YOUR_PROJECT")
  ) {
    const result = await supabase.from("email_notification_queue").insert({
      user_id: payload.userId,
      event_name: payload.event,
      subject: payload.subject,
      body: payload.body,
      payload: {
        requestId: payload.requestId,
        email: payload.email,
        ...(payload.metadata ?? {}),
      },
    });

    if (!result.error) {
      return {
        queued: true,
        payload,
      };
    }

    console.warn("Email queue insert failed", result.error);
    return {
      queued: false,
      payload,
      error: result.error,
    };
  }

  return {
    queued: false,
    payload,
  };
}

export async function queueAccountEmailNotification(payload: AccountEmailNotificationPayload) {
  if (!payload.userId || payload.userId === "guest") {
    return {
      queued: false,
      payload,
    };
  }

  if (
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.EXPO_PUBLIC_SUPABASE_URL.includes("YOUR_PROJECT")
  ) {
    const result = await supabase.from("email_notification_queue").insert({
      user_id: payload.userId,
      event_name: payload.eventName ?? "premium_activat",
      subject: payload.subject,
      body: payload.body,
      payload: {
        email: payload.email,
        ...(payload.metadata ?? {}),
      },
    });

    if (!result.error) {
      return {
        queued: true,
        payload,
      };
    }

    console.warn("Account email queue insert failed", result.error);
    return {
      queued: false,
      payload,
      error: result.error,
    };
  }

  return {
    queued: false,
    payload,
  };
}
