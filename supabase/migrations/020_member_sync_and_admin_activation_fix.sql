create or replace function public.ensure_profile_membership(target_user_id uuid, target_email text default null)
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
  if target_user_id is null then
    raise exception 'target_user_id is required';
  end if;

  if auth.uid() is not null and auth.uid() <> target_user_id and not public.is_admin_user() then
    raise exception 'not allowed';
  end if;

  select *
  into auth_record
  from auth.users
  where id = target_user_id;

  normalized_email := lower(coalesce(target_email, auth_record.email, ''));

  if normalized_email = '' then
    raise exception 'Email missing for target user %', target_user_id;
  end if;

  normalized_name := coalesce(
    auth_record.raw_user_meta_data ->> 'display_name',
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
    target_user_id,
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
    target_user_id,
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
  on conflict (user_id) do nothing;

  return query
  select p.id, p.email
  from public.profiles p
  where p.id = target_user_id;
end;
$$;

revoke all on function public.ensure_profile_membership(uuid, text) from public;
grant execute on function public.ensure_profile_membership(uuid, text) to authenticated, service_role;

create or replace function public.admin_find_member(target_identifier text)
returns table(
  id uuid,
  email text,
  display_name text,
  role text,
  is_admin boolean,
  subscription_tier text,
  current_plan public.user_plan
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_identifier text := lower(trim(coalesce(target_identifier, '')));
  target_user_id uuid;
  target_email text;
begin
  if not public.is_admin_user() then
    raise exception 'Admin access required';
  end if;

  if normalized_identifier = '' then
    return;
  end if;

  if position('@' in normalized_identifier) > 0 then
    target_email := normalized_identifier;

    select p.id
    into target_user_id
    from public.profiles p
    where lower(p.email) = target_email
    limit 1;

    if target_user_id is null then
      select u.id
      into target_user_id
      from auth.users u
      where lower(u.email) = target_email
      limit 1;
    end if;
  else
    begin
      target_user_id := normalized_identifier::uuid;
    exception
      when others then
        target_user_id := null;
    end;
  end if;

  if target_user_id is null then
    return;
  end if;

  perform public.ensure_profile_membership(target_user_id, target_email);

  return query
  select
    p.id,
    p.email,
    p.display_name,
    p.role,
    p.is_admin,
    p.subscription_tier,
    m.current_plan
  from public.profiles p
  left join public.memberships m on m.user_id = p.id
  where p.id = target_user_id
  limit 1;
end;
$$;

revoke all on function public.admin_find_member(text) from public;
grant execute on function public.admin_find_member(text) to authenticated, service_role;

create or replace function public.admin_activate_member_plan(
  target_identifier text,
  target_plan public.user_plan default 'PRO',
  target_duration_days integer default 30,
  target_plan_label text default 'Premium All Access'
)
returns table(
  user_id uuid,
  email text,
  current_plan public.user_plan,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  member_record record;
  now_ts timestamptz := now();
  effective_expiry timestamptz;
begin
  if not public.is_admin_user() then
    raise exception 'Admin access required';
  end if;

  select *
  into member_record
  from public.admin_find_member(target_identifier)
  limit 1;

  if member_record.id is null then
    raise exception 'Membrul nu a fost găsit.';
  end if;

  select case
    when m.expires_at is not null and m.expires_at > now_ts then m.expires_at
    else now_ts
  end
  into effective_expiry
  from public.memberships m
  where m.user_id = member_record.id;

  if effective_expiry is null then
    effective_expiry := now_ts;
  end if;

  if target_plan = 'PRO'::public.user_plan then
    effective_expiry := effective_expiry + make_interval(days => greatest(coalesce(target_duration_days, 30), 1));
  else
    effective_expiry := null;
  end if;

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
    score,
    updated_at
  )
  values (
    member_record.id,
    target_plan,
    'Recruit',
    coalesce(target_plan_label, case when target_plan = 'PRO'::public.user_plan then 'Premium All Access' else 'Acces Gratuit' end),
    now_ts,
    effective_expiry,
    'manual',
    0,
    0,
    0,
    0,
    0,
    0,
    now_ts
  )
  on conflict (user_id) do update
  set
    current_plan = excluded.current_plan,
    plan_label = excluded.plan_label,
    started_at = coalesce(public.memberships.started_at, excluded.started_at),
    expires_at = excluded.expires_at,
    renewal_mode = excluded.renewal_mode,
    updated_at = now();

  update public.profiles
  set
    subscription_tier = case when target_plan = 'PRO'::public.user_plan then 'premium' else 'free' end,
    is_admin = case when lower(email) = 'hello@marketmechanism.xyz' then true else is_admin end,
    role = case when lower(email) = 'hello@marketmechanism.xyz' then 'admin' else role end
  where id = member_record.id;

  return query
  select
    p.id,
    p.email,
    m.current_plan,
    m.expires_at
  from public.profiles p
  left join public.memberships m on m.user_id = p.id
  where p.id = member_record.id
  limit 1;
end;
$$;

revoke all on function public.admin_activate_member_plan(text, public.user_plan, integer, text) from public;
grant execute on function public.admin_activate_member_plan(text, public.user_plan, integer, text) to authenticated, service_role;

drop policy if exists "requests self insert" on public.analysis_requests;
drop policy if exists "requests authenticated insert" on public.analysis_requests;
create policy "requests authenticated insert" on public.analysis_requests
for insert to authenticated
with check (
  auth.uid() = user_id
  and length(trim(coalesce(asset_input, ''))) > 1
);

drop policy if exists "email queue self insert" on public.email_notification_queue;
create policy "email queue self insert" on public.email_notification_queue
for insert to authenticated
with check (auth.uid() = user_id);

select public.ensure_profile_membership(id, email)
from auth.users;
