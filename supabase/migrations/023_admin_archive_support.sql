alter table public.payment_requests
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null;

alter table public.personal_requests
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null;

alter table public.contact_messages
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null;

create index if not exists payment_requests_archived_at_idx
  on public.payment_requests (archived_at, created_at desc);

create index if not exists personal_requests_archived_at_idx
  on public.personal_requests (archived_at, created_at desc);

create index if not exists contact_messages_archived_at_idx
  on public.contact_messages (archived_at, created_at desc);
