drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "memberships self insert" on public.memberships;
create policy "memberships self insert" on public.memberships
for insert with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(coalesce(new.email, ''));
  assigned_role text := case
    when normalized_email = 'c.eugenbroker@gmail.com' then 'admin'
    else coalesce(new.raw_user_meta_data ->> 'role', 'user')
  end;
  assigned_plan public.user_plan := case
    when normalized_email = 'c.eugenbroker@gmail.com' then 'PRO'::public.user_plan
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
  role = 'admin',
  is_admin = true,
  subscription_tier = 'premium'
where lower(email) = 'c.eugenbroker@gmail.com';

update public.memberships
set
  current_plan = 'PRO',
  plan_label = 'Premium All Access',
  started_at = coalesce(started_at, now()),
  expires_at = coalesce(expires_at, now() + interval '90 days'),
  renewal_mode = 'manual',
  updated_at = now()
where user_id in (
  select id
  from public.profiles
  where lower(email) = 'c.eugenbroker@gmail.com'
);
