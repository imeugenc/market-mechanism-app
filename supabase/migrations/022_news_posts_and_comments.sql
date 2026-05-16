create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('macro', 'crypto')),
  title text not null,
  short_description text not null default '',
  long_note text,
  tags text[] not null default '{}'::text[],
  importance text check (importance in ('low', 'medium', 'high')),
  source_url text,
  published_at timestamptz not null default now(),
  is_pinned boolean not null default false,
  author_id uuid references auth.users(id) on delete set null,
  author_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_posts enable row level security;

drop policy if exists "news posts public read" on public.news_posts;
create policy "news posts public read" on public.news_posts
for select using (true);

drop policy if exists "news posts admin insert" on public.news_posts;
create policy "news posts admin insert" on public.news_posts
for insert to authenticated
with check (public.is_admin_user());

drop policy if exists "news posts admin update" on public.news_posts;
create policy "news posts admin update" on public.news_posts
for update to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "news posts admin delete" on public.news_posts;
create policy "news posts admin delete" on public.news_posts
for delete to authenticated
using (public.is_admin_user());

alter table public.content_comments
  drop constraint if exists content_comments_content_type_check;

alter table public.content_comments
  add constraint content_comments_content_type_check
  check (content_type in ('review', 'analysis', 'altcoin', 'news'));
