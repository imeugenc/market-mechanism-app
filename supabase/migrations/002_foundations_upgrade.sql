alter table public.daily_analyses
  alter column video_url set not null;

alter table public.daily_analyses
  drop column if exists full_analysis_text,
  drop column if exists bias,
  drop column if exists levels,
  drop column if exists invalidation,
  drop column if exists targets;

alter table public.after_action_reviews
  drop column if exists short_review,
  drop column if exists chart_images,
  drop column if exists teaser_video_url,
  add column if not exists short_text text not null default '',
  add column if not exists chart_image text not null default '';

alter table public.analysis_requests
  add column if not exists delivered_at timestamptz;

create table if not exists public.request_status_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.analysis_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.request_status not null,
  created_at timestamptz not null default now()
);

create table if not exists public.email_notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_name text not null,
  subject text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.request_status_events enable row level security;
alter table public.email_notification_queue enable row level security;

create policy "premium users can read premium analyses" on public.daily_analyses
for select using (
  is_premium = false
  or exists (
    select 1 from public.memberships
    where memberships.user_id = auth.uid()
      and memberships.current_plan = 'PRO'
  )
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create policy "admin can update memberships" on public.memberships
for update using (
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

create policy "admin can read profiles" on public.profiles
for select using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create policy "admin can read memberships" on public.memberships
for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create policy "admin can read requests" on public.analysis_requests
for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create policy "request owners and admin can read request events" on public.request_status_events
for select using (
  auth.uid() = user_id
  or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create policy "admin can write request events" on public.request_status_events
for insert with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

create policy "admin can manage email queue" on public.email_notification_queue
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
