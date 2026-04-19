create table if not exists public.content_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null check (content_type in ('analysis', 'review', 'altcoin')),
  content_id text not null,
  title text not null,
  subtitle text,
  market_label text,
  created_at timestamptz not null default now(),
  unique (user_id, content_type, content_id)
);

alter table public.content_favorites enable row level security;

drop policy if exists "favorites self read" on public.content_favorites;
create policy "favorites self read" on public.content_favorites
for select using (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "favorites self insert" on public.content_favorites;
create policy "favorites self insert" on public.content_favorites
for insert with check (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "favorites self delete" on public.content_favorites;
create policy "favorites self delete" on public.content_favorites
for delete using (auth.uid() = user_id or public.is_admin_user());

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "contact messages self insert" on public.contact_messages;
create policy "contact messages self insert" on public.contact_messages
for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "contact messages self read" on public.contact_messages;
create policy "contact messages self read" on public.contact_messages
for select using (auth.uid() = user_id or public.is_admin_user());

drop policy if exists "contact messages admin update" on public.contact_messages;
create policy "contact messages admin update" on public.contact_messages
for update using (public.is_admin_user())
with check (public.is_admin_user());

alter table public.after_action_reviews
  add column if not exists body_text text,
  add column if not exists video_url text;

update public.after_action_reviews
set body_text = coalesce(body_text, short_text, summary)
where body_text is null;

create index if not exists content_favorites_user_id_idx on public.content_favorites (user_id, created_at desc);
create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

drop policy if exists "payment proofs authenticated upload" on storage.objects;
create policy "payment proofs authenticated upload" on storage.objects
for insert to authenticated
with check (bucket_id = 'payment-proofs');

drop policy if exists "payment proofs authenticated read" on storage.objects;
create policy "payment proofs authenticated read" on storage.objects
for select to authenticated
using (bucket_id = 'payment-proofs');

drop policy if exists "payment proofs authenticated update" on storage.objects;
create policy "payment proofs authenticated update" on storage.objects
for update to authenticated
using (bucket_id = 'payment-proofs')
with check (bucket_id = 'payment-proofs');

drop policy if exists "payment proofs authenticated delete" on storage.objects;
create policy "payment proofs authenticated delete" on storage.objects
for delete to authenticated
using (bucket_id = 'payment-proofs');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(coalesce(new.email, ''));
  assigned_role text := case
    when normalized_email = 'hello@marketmechanism.xyz' then 'admin'
    else coalesce(new.raw_user_meta_data ->> 'role', 'user')
  end;
  assigned_plan public.user_plan := case
    when normalized_email = 'hello@marketmechanism.xyz' then 'PRO'::public.user_plan
    when coalesce(new.raw_user_meta_data ->> 'plan', 'free') = 'premium' then 'PRO'::public.user_plan
    else 'FREE'::public.user_plan
  end;
begin
  insert into public.profiles (id, email, display_name, is_admin, role, saved_markets, subscription_tier)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    assigned_role = 'admin',
    assigned_role,
    '{}',
    case when assigned_plan = 'PRO'::public.user_plan then 'premium' else 'free' end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    is_admin = excluded.is_admin,
    role = excluded.role,
    subscription_tier = excluded.subscription_tier;

  insert into public.memberships (
    user_id,
    current_plan,
    current_rank,
    plan_label,
    started_at,
    expires_at,
    renewal_mode,
    login_streak,
    total_views,
    premium_views,
    total_requests,
    engagement_actions,
    score
  )
  values (
    new.id,
    assigned_plan,
    'Recruit',
    case when assigned_plan = 'PRO'::public.user_plan then 'Premium All Access' else 'Acces Gratuit' end,
    now(),
    case when assigned_plan = 'PRO'::public.user_plan then now() + interval '90 days' else null end,
    'manual',
    0,
    0,
    0,
    0,
    0,
    0
  )
  on conflict (user_id) do update
  set
    current_plan = excluded.current_plan,
    plan_label = excluded.plan_label,
    renewal_mode = excluded.renewal_mode,
    expires_at = coalesce(public.memberships.expires_at, excluded.expires_at),
    updated_at = now();

  return new;
end;
$$;

update public.profiles
set
  role = case when lower(email) = 'hello@marketmechanism.xyz' then 'admin' else 'user' end,
  is_admin = case when lower(email) = 'hello@marketmechanism.xyz' then true else false end,
  subscription_tier = case when lower(email) = 'hello@marketmechanism.xyz' then 'premium' else subscription_tier end
where lower(email) in ('hello@marketmechanism.xyz', 'c.eugenbroker@gmail.com');

update public.memberships
set
  current_plan = case
    when user_id in (select id from public.profiles where lower(email) = 'hello@marketmechanism.xyz') then 'PRO'
    else current_plan
  end,
  plan_label = case
    when user_id in (select id from public.profiles where lower(email) = 'hello@marketmechanism.xyz') then 'Premium All Access'
    else plan_label
  end,
  started_at = coalesce(started_at, now()),
  expires_at = case
    when user_id in (select id from public.profiles where lower(email) = 'hello@marketmechanism.xyz')
      then coalesce(expires_at, now() + interval '90 days')
    else expires_at
  end,
  renewal_mode = 'manual',
  updated_at = now()
where user_id in (
  select id
  from public.profiles
  where lower(email) in ('hello@marketmechanism.xyz', 'c.eugenbroker@gmail.com')
);
