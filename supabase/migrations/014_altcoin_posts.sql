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

alter table public.altcoin_posts enable row level security;

create policy "altcoin posts public read" on public.altcoin_posts
for select using (not is_premium or public.is_admin_user());

create policy "altcoin posts premium read" on public.altcoin_posts
for select using (
  is_premium = false
  or exists (
    select 1 from public.memberships
    where memberships.user_id = auth.uid()
      and memberships.current_plan = 'PRO'
  )
  or public.is_admin_user()
);

create policy "altcoin posts admin manage" on public.altcoin_posts
for all using (public.is_admin_user())
with check (public.is_admin_user());
