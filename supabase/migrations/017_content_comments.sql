create table if not exists public.content_comments (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('review', 'analysis', 'altcoin')),
  content_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.content_comments enable row level security;

drop policy if exists "content comments public read" on public.content_comments;
create policy "content comments public read" on public.content_comments
for select using (true);

drop policy if exists "content comments authenticated insert" on public.content_comments;
create policy "content comments authenticated insert" on public.content_comments
for insert to authenticated
with check (
  auth.uid() = user_id
  and length(trim(body)) > 1
);

drop policy if exists "content comments admin delete" on public.content_comments;
create policy "content comments admin delete" on public.content_comments
for delete using (public.is_admin_user());
