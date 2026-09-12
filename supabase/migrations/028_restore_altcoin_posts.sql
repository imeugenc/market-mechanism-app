-- Migration 014 was recorded during history reconciliation, but its table is
-- absent in production. Recreate the expected structure without touching rows
-- when the table already exists in another environment.
create table if not exists public.altcoin_posts (
  id uuid primary key default gen_random_uuid(),
  coin_symbol text not null,
  title text not null,
  summary text,
  body_text text not null default '',
  chart_image text,
  video_url text,
  is_premium boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

alter table public.altcoin_posts
  add column if not exists coin_symbol text,
  add column if not exists title text,
  add column if not exists summary text,
  add column if not exists body_text text default '',
  add column if not exists chart_image text,
  add column if not exists video_url text,
  add column if not exists is_premium boolean default false,
  add column if not exists published_at timestamptz default now(),
  add column if not exists created_at timestamptz default now(),
  add column if not exists created_by uuid references public.profiles (id);

create index if not exists altcoin_posts_published_at_idx
  on public.altcoin_posts (published_at desc);

alter table public.altcoin_posts enable row level security;

drop policy if exists "altcoin posts public read" on public.altcoin_posts;
create policy "altcoin posts public read" on public.altcoin_posts
for select using (
  is_premium = false
  or exists (
    select 1
    from public.memberships
    where memberships.user_id = auth.uid()
      and memberships.current_plan = 'PRO'
  )
  or public.is_admin_user()
);

drop policy if exists "altcoin posts premium read" on public.altcoin_posts;

drop policy if exists "altcoin posts admin manage" on public.altcoin_posts;
create policy "altcoin posts admin manage" on public.altcoin_posts
for all using (public.is_admin_user())
with check (public.is_admin_user());

grant select on public.altcoin_posts to anon, authenticated;
grant insert, update, delete on public.altcoin_posts to authenticated;
grant all on public.altcoin_posts to service_role;
