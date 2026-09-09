-- Keep administrative authority outside user-editable profile fields.
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;
revoke all on table public.app_admins from anon, authenticated;

insert into public.app_admins (user_id)
select id
from auth.users
where lower(email) = 'hello@marketmechanism.xyz'
on conflict (user_id) do nothing;

create or replace function public.is_admin_user(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    coalesce(auth.role() = 'service_role', false)
    or lower(coalesce(auth.jwt() ->> 'email', '')) = 'hello@marketmechanism.xyz'
    or exists (
      select 1
      from public.app_admins
      where user_id = auth.uid()
    );
$$;

revoke all on function public.is_admin_user(uuid) from public;
grant execute on function public.is_admin_user(uuid) to anon, authenticated, service_role;

-- Legacy profile flags remain for backwards compatibility, but they are no
-- longer an authority source and ordinary users cannot change them.
update public.profiles
set
  role = case when lower(email) = 'hello@marketmechanism.xyz' then 'admin' else 'user' end,
  is_admin = lower(email) = 'hello@marketmechanism.xyz'
where
  role is distinct from case when lower(email) = 'hello@marketmechanism.xyz' then 'admin' else 'user' end
  or is_admin is distinct from (lower(email) = 'hello@marketmechanism.xyz');

create or replace function public.protect_profile_authority_fields()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if (
    new.id is distinct from old.id
    or new.email is distinct from old.email
    or new.role is distinct from old.role
    or new.is_admin is distinct from old.is_admin
    or new.subscription_tier is distinct from old.subscription_tier
  ) and not public.is_admin_user() then
    raise exception 'Profile authority fields cannot be changed by this account.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_authority_fields on public.profiles;
create trigger protect_profile_authority_fields
before update on public.profiles
for each row execute function public.protect_profile_authority_fields();

-- Profile and membership creation is performed by the trusted auth trigger or
-- the hardened RPC below. Client-side self inserts are no longer necessary.
drop policy if exists "profiles self insert" on public.profiles;
drop policy if exists "memberships self insert" on public.memberships;

create or replace function public.ensure_profile_membership(p_target_user_id uuid, p_target_email text default null)
returns table(user_id uuid, email text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  auth_record auth.users%rowtype;
  normalized_email text;
  normalized_name text;
  assigned_role text;
  assigned_plan public.user_plan;
begin
  if p_target_user_id is null then
    raise exception 'p_target_user_id is required';
  end if;

  if auth.uid() is null and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if auth.uid() is not null and auth.uid() <> p_target_user_id and not public.is_admin_user() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  select *
  into auth_record
  from auth.users
  where id = p_target_user_id;

  if auth_record.id is null then
    raise exception 'authenticated user not found' using errcode = '22023';
  end if;

  -- p_target_email is intentionally ignored. It is kept only so existing clients
  -- remain compatible with this function signature.
  normalized_email := lower(coalesce(auth_record.email, ''));

  if normalized_email = '' then
    raise exception 'verified email missing for target user %', p_target_user_id;
  end if;

  normalized_name := coalesce(
    nullif(trim(auth_record.raw_user_meta_data ->> 'display_name'), ''),
    split_part(normalized_email, '@', 1),
    'Utilizator'
  );

  assigned_role := case
    when normalized_email = 'hello@marketmechanism.xyz' then 'admin'
    else 'user'
  end;

  assigned_plan := case
    when normalized_email = 'hello@marketmechanism.xyz' then 'PRO'::public.user_plan
    else 'FREE'::public.user_plan
  end;

  insert into public.profiles (
    id,
    email,
    display_name,
    is_admin,
    role,
    saved_markets,
    subscription_tier
  )
  values (
    p_target_user_id,
    normalized_email,
    normalized_name,
    assigned_role = 'admin',
    assigned_role,
    '{}',
    case when assigned_plan = 'PRO'::public.user_plan then 'premium' else 'free' end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    is_admin = case when excluded.email = 'hello@marketmechanism.xyz' then true else public.profiles.is_admin end,
    role = case when excluded.email = 'hello@marketmechanism.xyz' then 'admin' else public.profiles.role end;

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
    p_target_user_id,
    assigned_plan,
    'Recruit',
    case when assigned_plan = 'PRO'::public.user_plan then 'Premium All Access' else 'Acces Gratuit' end,
    now(),
    null,
    'manual',
    0,
    0,
    0,
    0,
    0,
    0
  )
  on conflict on constraint memberships_pkey do nothing;

  return query
  select p.id, p.email
  from public.profiles p
  where p.id = p_target_user_id;
end;
$$;

revoke all on function public.ensure_profile_membership(uuid, text) from public;
grant execute on function public.ensure_profile_membership(uuid, text) to authenticated, service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(coalesce(new.email, ''));
  is_owner boolean := lower(coalesce(new.email, '')) = 'hello@marketmechanism.xyz';
begin
  insert into public.profiles (
    id,
    email,
    display_name,
    is_admin,
    role,
    saved_markets,
    subscription_tier
  )
  values (
    new.id,
    normalized_email,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(normalized_email, '@', 1),
      'Utilizator'
    ),
    is_owner,
    case when is_owner then 'admin' else 'user' end,
    '{}',
    case when is_owner then 'premium' else 'free' end
  )
  on conflict (id) do nothing;

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
    case when is_owner then 'PRO'::public.user_plan else 'FREE'::public.user_plan end,
    'Recruit',
    case when is_owner then 'Premium All Access' else 'Acces Gratuit' end,
    now(),
    null,
    'manual',
    0,
    0,
    0,
    0,
    0,
    0
  )
  on conflict (user_id) do nothing;

  if is_owner then
    insert into public.app_admins (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;
