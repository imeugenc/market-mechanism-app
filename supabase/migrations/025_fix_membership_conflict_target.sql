-- Correct the conflict target in the hardened membership function.
-- Migration 024 was already applied before this PostgreSQL ambiguity was found.
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
