import { supabase } from "@/lib/supabase";
import { ContactMessage, ContactMessageReply } from "@/types/domain";

type ContactMessageRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  created_at: string;
  archived_at: string | null;
  archived_by: string | null;
};

type ContactReplyRow = {
  id: string;
  message_id: string;
  sender_role: "admin" | "member";
  sender_name: string;
  body: string;
  created_at: string;
};

function mapContactMessage(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    fullName: row.full_name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? undefined,
    archivedBy: row.archived_by ?? undefined,
  };
}

function mapContactReply(row: ContactReplyRow): ContactMessageReply {
  return {
    id: row.id,
    messageId: row.message_id,
    senderRole: row.sender_role,
    senderName: row.sender_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function fetchContactMessages() {
  const messagesResult = await supabase
    .from("contact_messages")
    .select("id, user_id, full_name, email, subject, message, status, created_at, archived_at, archived_by")
    .order("created_at", { ascending: false });

  if (messagesResult.error || !messagesResult.data) {
    return {
      ...messagesResult,
      data: null,
    };
  }

  const messageIds = messagesResult.data.map((row) => row.id);
  let repliesByMessageId = new Map<string, ContactMessageReply[]>();

  if (messageIds.length) {
    const repliesResult = await supabase
      .from("contact_message_replies")
      .select("id, message_id, sender_role, sender_name, body, created_at")
      .in("message_id", messageIds)
      .order("created_at", { ascending: true });

    if (!repliesResult.error && repliesResult.data) {
      repliesByMessageId = (repliesResult.data as ContactReplyRow[]).reduce((map, row) => {
        const mapped = mapContactReply(row);
        const bucket = map.get(mapped.messageId) ?? [];
        bucket.push(mapped);
        map.set(mapped.messageId, bucket);
        return map;
      }, new Map<string, ContactMessageReply[]>());
    }
  }

  return {
    ...messagesResult,
    data:
      messagesResult.data?.map((row) => ({
        ...mapContactMessage(row as ContactMessageRow),
        replies: repliesByMessageId.get(row.id) ?? [],
      })) ?? null,
  };
}

export async function createContactMessage(input: {
  user_id?: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const result = await supabase
    .from("contact_messages")
    .insert({
      user_id: input.user_id ?? null,
      full_name: input.full_name,
      email: input.email,
      subject: input.subject,
      message: input.message,
    })
    .select("id, user_id, full_name, email, subject, message, status, created_at, archived_at, archived_by")
    .single();

  return {
    ...result,
    data: result.data ? mapContactMessage(result.data as ContactMessageRow) : null,
  };
}

export async function updateContactMessageStatus(contactMessageId: string, status: ContactMessage["status"]) {
  const result = await supabase
    .from("contact_messages")
    .update({ status })
    .eq("id", contactMessageId)
    .select("id, user_id, full_name, email, subject, message, status, created_at, archived_at, archived_by")
    .single();

  return {
    ...result,
    data: result.data ? mapContactMessage(result.data as ContactMessageRow) : null,
  };
}

export async function setContactMessageArchive(
  contactMessageId: string,
  input: {
    archived_at: string | null;
    archived_by: string | null;
  },
) {
  const result = await supabase
    .from("contact_messages")
    .update({
      archived_at: input.archived_at,
      archived_by: input.archived_by,
    })
    .eq("id", contactMessageId)
    .select("id, user_id, full_name, email, subject, message, status, created_at, archived_at, archived_by")
    .single();

  return {
    ...result,
    data: result.data ? mapContactMessage(result.data as ContactMessageRow) : null,
  };
}

export async function createContactMessageReply(input: {
  message_id: string;
  sender_role: "admin" | "member";
  sender_name: string;
  body: string;
}) {
  const result = await supabase
    .from("contact_message_replies")
    .insert({
      message_id: input.message_id,
      sender_role: input.sender_role,
      sender_name: input.sender_name,
      body: input.body,
    })
    .select("id, message_id, sender_role, sender_name, body, created_at")
    .single();

  return {
    ...result,
    data: result.data ? mapContactReply(result.data as ContactReplyRow) : null,
  };
}
