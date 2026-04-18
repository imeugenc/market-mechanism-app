alter table public.analysis_requests
  add column if not exists payment_proof text,
  add column if not exists payment_reference text;

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null default 'membership_upgrade',
  plan_target text not null default 'PRO',
  payment_method text not null,
  payment_proof text not null,
  transaction_ref text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create index if not exists payment_requests_user_id_idx on public.payment_requests (user_id);
create index if not exists payment_requests_status_idx on public.payment_requests (status);
