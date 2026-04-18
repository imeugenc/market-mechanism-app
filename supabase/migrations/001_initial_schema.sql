create extension if not exists "pgcrypto";

create type public.user_plan as enum ('FREE', 'PRO');
create type public.request_status as enum ('pending', 'accepted', 'delivered', 'cancelled');
create type public.request_payment_status as enum ('pending', 'paid', 'refunded');
create type public.delivery_type as enum ('text', 'video');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  display_name text,
  is_admin boolean not null default false,
  saved_markets text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.memberships (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current_plan public.user_plan not null default 'FREE',
  current_rank text not null default 'Recruit',
  login_streak integer not null default 0,
  total_views integer not null default 0,
  premium_views integer not null default 0,
  total_requests integer not null default 0,
  engagement_actions integer not null default 0,
  score integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.daily_analyses (
  id uuid primary key default gen_random_uuid(),
  market text not null check (market in ('BTC', 'ETH', 'NQ', 'ES')),
  title text not null,
  summary text not null,
  full_analysis_text text not null,
  bias text not null,
  levels text[] not null default '{}',
  invalidation text not null,
  targets text[] not null default '{}',
  chart_images text[] not null default '{}',
  video_url text,
  is_premium boolean not null default true,
  status text not null default 'Plan',
  tags text[] not null default '{}',
  published_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create table public.after_action_reviews (
  id uuid primary key default gen_random_uuid(),
  market text not null check (market in ('BTC', 'ETH', 'NQ', 'ES')),
  title text not null,
  short_review text not null,
  chart_images text[] not null default '{}',
  teaser_video_url text,
  published_at timestamptz not null default now(),
  is_free boolean not null default true,
  created_by uuid references public.profiles (id)
);

create table public.analysis_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  asset_input text not null,
  coin_symbol text not null,
  tier integer not null check (tier in (2, 5, 10)),
  notes text not null default '',
  status public.request_status not null default 'pending',
  delivery_type public.delivery_type not null default 'text',
  payment_status public.request_payment_status not null default 'pending',
  delivery_notes text,
  delivery_video_url text,
  stripe_checkout_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.daily_analyses enable row level security;
alter table public.after_action_reviews enable row level security;
alter table public.analysis_requests enable row level security;
alter table public.notification_tokens enable row level security;

create policy "profiles self read" on public.profiles
for select using (auth.uid() = id);

create policy "profiles self update" on public.profiles
for update using (auth.uid() = id);

create policy "memberships self read" on public.memberships
for select using (auth.uid() = user_id);

create policy "requests self read" on public.analysis_requests
for select using (auth.uid() = user_id);

create policy "requests self insert" on public.analysis_requests
for insert with check (auth.uid() = user_id);

create policy "free reviews public read" on public.after_action_reviews
for select using (true);

create policy "free analyses public teaser read" on public.daily_analyses
for select using (is_premium = false);

create policy "admin full content control" on public.daily_analyses
for all using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create policy "admin reviews control" on public.after_action_reviews
for all using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create policy "admin requests manage" on public.analysis_requests
for update using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create policy "notification tokens self manage" on public.notification_tokens
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);
