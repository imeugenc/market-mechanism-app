alter table public.profiles
  add column if not exists subscription_tier text not null default 'free'
  check (subscription_tier in ('free', 'premium'));

update public.profiles
set subscription_tier = case
  when exists (
    select 1
    from public.memberships
    where memberships.user_id = profiles.id
      and memberships.current_plan = 'PRO'
  ) then 'premium'
  else 'free'
end;

alter table public.after_action_reviews
  add column if not exists summary text,
  add column if not exists chart_url text,
  add column if not exists created_at timestamptz not null default now();

update public.after_action_reviews
set summary = coalesce(summary, short_review),
    chart_url = coalesce(chart_url, chart_image),
    created_at = coalesce(created_at, published_at)
where summary is null
   or chart_url is null;

alter table public.daily_analyses
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists premium_only boolean not null default true;

update public.daily_analyses
set premium_only = coalesce(premium_only, is_premium),
    created_at = coalesce(created_at, published_at);

create table if not exists public.personal_requests (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  title text not null,
  video_url text,
  notes text,
  tier integer check (tier in (2, 5, 10)),
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_requests_user_email_idx on public.personal_requests (user_email);

alter table public.personal_requests enable row level security;

create policy "personal requests self read" on public.personal_requests
for select using (
  lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_admin = true)
  )
);

create policy "personal requests admin insert" on public.personal_requests
for insert with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_admin = true)
  )
);

create policy "personal requests admin update" on public.personal_requests
for update using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_admin = true)
  )
);

create policy "profiles admin read" on public.profiles
for select using (
  exists (
    select 1 from public.profiles as admin_profiles
    where admin_profiles.id = auth.uid()
      and (admin_profiles.role = 'admin' or admin_profiles.is_admin = true)
  )
);

create policy "profiles admin update" on public.profiles
for update using (
  exists (
    select 1 from public.profiles as admin_profiles
    where admin_profiles.id = auth.uid()
      and (admin_profiles.role = 'admin' or admin_profiles.is_admin = true)
  )
);

create policy "memberships admin read" on public.memberships
for select using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_admin = true)
  )
);

create policy "memberships admin update" on public.memberships
for update using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.is_admin = true)
  )
);
