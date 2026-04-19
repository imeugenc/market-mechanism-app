create or replace function public.is_admin_user(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'hello@marketmechanism.xyz'
    or exists (
      select 1
      from public.profiles
      where id = check_user_id
        and (role = 'admin' or is_admin = true)
    );
$$;

revoke all on function public.is_admin_user(uuid) from public;
grant execute on function public.is_admin_user(uuid) to anon, authenticated, service_role;

drop policy if exists "requests authenticated insert" on public.analysis_requests;
create policy "requests authenticated insert" on public.analysis_requests
for insert to authenticated
with check (
  auth.uid() is not null
  and length(trim(coalesce(asset_input, ''))) > 1
  and (
    user_id is null
    or user_id = auth.uid()
  )
);

drop policy if exists "admin can update memberships" on public.memberships;
drop policy if exists "memberships admin update via helper" on public.memberships;
create policy "memberships admin update via helper" on public.memberships
for update
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "memberships admin insert via helper" on public.memberships;
create policy "memberships admin insert via helper" on public.memberships
for insert to authenticated
with check (public.is_admin_user());

update public.profiles
set
  role = case when lower(email) = 'hello@marketmechanism.xyz' then 'admin' else role end,
  is_admin = case when lower(email) = 'hello@marketmechanism.xyz' then true else is_admin end
where lower(email) = 'hello@marketmechanism.xyz';

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
select
  p.id,
  case when p.subscription_tier = 'premium' then 'PRO'::public.user_plan else 'FREE'::public.user_plan end,
  'Recruit',
  case when p.subscription_tier = 'premium' then 'Premium All Access' else 'Acces Gratuit' end,
  coalesce(p.created_at, now()),
  null,
  'manual',
  0,
  0,
  0,
  0,
  0,
  0
from public.profiles p
left join public.memberships m on m.user_id = p.id
where m.user_id is null
on conflict (user_id) do nothing;
