export const OWNER_EMAIL = "hello@marketmechanism.xyz";
export const OWNER_EMAILS = [OWNER_EMAIL];

export function isOwnerEmail(email?: string | null) {
  return OWNER_EMAILS.includes((email ?? "").trim().toLowerCase());
}
