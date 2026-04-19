create or replace function public.is_admin_user(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user_id
      and (role = 'admin' or is_admin = true)
  );
$$;

revoke all on function public.is_admin_user(uuid) from public;
grant execute on function public.is_admin_user(uuid) to anon, authenticated, service_role;

drop policy if exists "admin can read profiles" on public.profiles;
drop policy if exists "profiles admin read" on public.profiles;
drop policy if exists "profiles admin update" on public.profiles;

create policy "profiles admin read via helper" on public.profiles
for select using (
  auth.uid() = id
  or public.is_admin_user()
);

create policy "profiles admin update via helper" on public.profiles
for update using (
  auth.uid() = id
  or public.is_admin_user()
)
with check (
  auth.uid() = id
  or public.is_admin_user()
);

drop policy if exists "admin full content control" on public.daily_analyses;
create policy "admin full content control" on public.daily_analyses
for all using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "admin reviews control" on public.after_action_reviews;
create policy "admin reviews control" on public.after_action_reviews
for all using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "admin requests manage" on public.analysis_requests;
create policy "admin requests manage" on public.analysis_requests
for update using (public.is_admin_user());

drop policy if exists "premium users can read premium analyses" on public.daily_analyses;
create policy "premium users can read premium analyses" on public.daily_analyses
for select using (
  is_premium = false
  or exists (
    select 1 from public.memberships
    where memberships.user_id = auth.uid()
      and memberships.current_plan = 'PRO'
  )
  or public.is_admin_user()
);

drop policy if exists "admin can update memberships" on public.memberships;
create policy "admin can update memberships" on public.memberships
for update using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "admin can read memberships" on public.memberships;
drop policy if exists "memberships admin read" on public.memberships;
create policy "memberships admin read via helper" on public.memberships
for select using (
  auth.uid() = user_id
  or public.is_admin_user()
);

drop policy if exists "memberships admin update" on public.memberships;
create policy "memberships admin update via helper" on public.memberships
for update using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "admin can read requests" on public.analysis_requests;
create policy "admin can read requests" on public.analysis_requests
for select using (
  auth.uid() = user_id
  or public.is_admin_user()
);

drop policy if exists "request owners and admin can read request events" on public.request_status_events;
create policy "request owners and admin can read request events" on public.request_status_events
for select using (
  auth.uid() = user_id
  or public.is_admin_user()
);

drop policy if exists "admin can write request events" on public.request_status_events;
create policy "admin can write request events" on public.request_status_events
for insert with check (public.is_admin_user());

drop policy if exists "admin can manage email queue" on public.email_notification_queue;
create policy "admin can manage email queue" on public.email_notification_queue
for all using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "personal requests self read" on public.personal_requests;
create policy "personal requests self read" on public.personal_requests
for select using (
  lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  or public.is_admin_user()
);

drop policy if exists "personal requests admin insert" on public.personal_requests;
create policy "personal requests admin insert" on public.personal_requests
for insert with check (public.is_admin_user());

drop policy if exists "personal requests admin update" on public.personal_requests;
create policy "personal requests admin update" on public.personal_requests
for update using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "payment requests self read" on public.payment_requests;
create policy "payment requests self read" on public.payment_requests
for select using (
  auth.uid() = user_id
  or public.is_admin_user()
);

drop policy if exists "payment requests admin update" on public.payment_requests;
create policy "payment requests admin update" on public.payment_requests
for update using (public.is_admin_user())
with check (public.is_admin_user());
