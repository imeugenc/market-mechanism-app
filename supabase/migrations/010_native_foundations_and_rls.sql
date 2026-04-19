alter table public.memberships
  add column if not exists plan_label text not null default 'Premium All Access',
  add column if not exists started_at timestamptz not null default now(),
  add column if not exists expires_at timestamptz,
  add column if not exists renewal_mode text not null default 'manual'
    check (renewal_mode in ('manual', 'none'));

update public.memberships
set
  plan_label = coalesce(plan_label, case when current_plan = 'PRO' then 'Premium All Access' else 'Acces Gratuit' end),
  started_at = coalesce(started_at, now()),
  renewal_mode = coalesce(renewal_mode, 'manual');

alter table public.payment_requests
  add column if not exists plan_label text not null default 'Premium All Access',
  add column if not exists duration_days integer not null default 30
    check (duration_days in (30, 90));

update public.payment_requests
set
  plan_label = coalesce(plan_label, 'Premium All Access'),
  duration_days = coalesce(duration_days, 30);

alter table public.analysis_requests
  alter column user_id drop not null;

alter table public.payment_requests enable row level security;

drop policy if exists "payment requests self read" on public.payment_requests;
create policy "payment requests self read" on public.payment_requests
for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_admin = true)
  )
);

drop policy if exists "payment requests self insert" on public.payment_requests;
create policy "payment requests self insert" on public.payment_requests
for insert with check (
  auth.uid() = user_id
);

drop policy if exists "payment requests admin update" on public.payment_requests;
create policy "payment requests admin update" on public.payment_requests
for update using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_admin = true)
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_admin = true)
  )
);

drop policy if exists "requests requester email read" on public.analysis_requests;
create policy "requests requester email read" on public.analysis_requests
for select using (
  lower(coalesce(requester_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "requests guest insert" on public.analysis_requests;
create policy "requests guest insert" on public.analysis_requests
for insert with check (
  user_id is null
  and requester_email is not null
  and length(trim(requester_email)) > 4
  and length(trim(asset_input)) > 1
);
