drop policy if exists "requests authenticated insert" on public.analysis_requests;
drop policy if exists "requests guest insert" on public.analysis_requests;
drop policy if exists "requests requester email read" on public.analysis_requests;
drop policy if exists "admin can read requests" on public.analysis_requests;
drop policy if exists "admin requests manage" on public.analysis_requests;

create policy "requests authenticated insert" on public.analysis_requests
for insert to authenticated
with check (
  length(trim(coalesce(asset_input, ''))) > 1
  and (
    (user_id is not null and auth.uid() = user_id)
    or lower(coalesce(requester_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

create policy "requests guest insert" on public.analysis_requests
for insert to anon
with check (
  user_id is null
  and requester_email is not null
  and length(trim(requester_email)) > 4
  and length(trim(asset_input)) > 1
);

create policy "requests self or admin read" on public.analysis_requests
for select
using (
  auth.uid() = user_id
  or lower(coalesce(requester_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  or public.is_admin_user()
);

create policy "requests admin manage" on public.analysis_requests
for update
using (public.is_admin_user())
with check (public.is_admin_user());

create policy "requests admin insert" on public.analysis_requests
for insert to authenticated
with check (public.is_admin_user());

update public.profiles
set
  role = case when lower(email) = 'hello@marketmechanism.xyz' then 'admin' else 'user' end,
  is_admin = case when lower(email) = 'hello@marketmechanism.xyz' then true else false end
where lower(email) in ('hello@marketmechanism.xyz', 'c.eugenbroker@gmail.com');

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
