-- Stripe may deliver the same checkout event more than once. Keep notifications idempotent.
alter table public.email_notification_queue add column if not exists dedupe_key text;
create unique index if not exists email_notification_queue_dedupe_key_idx
  on public.email_notification_queue (dedupe_key);
