create table if not exists public.premium_grants (
  id uuid primary key default gen_random_uuid(),
  market_user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('journal_stripe', 'journal_manual_full_access', 'market_manual', 'market_paid')),
  source_ref text not null,
  journal_user_id uuid,
  status text not null check (status in ('active', 'revoked', 'expired')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (market_user_id, source, source_ref)
);
alter table public.premium_grants enable row level security;
revoke all on public.premium_grants from anon, authenticated;

insert into public.premium_grants (market_user_id, source, source_ref, status, starts_at, expires_at)
select user_id, 'market_manual', 'legacy-membership:' || user_id,
       case when expires_at is null or expires_at > now() then 'active' else 'expired' end,
       coalesce(started_at, now()), expires_at
from public.memberships where current_plan = 'PRO'
on conflict (market_user_id, source, source_ref) do nothing;

create or replace function public.has_market_premium(check_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select (check_user_id = auth.uid() or auth.role() = 'service_role') and (
    public.is_admin_user(check_user_id) or exists (
      select 1 from public.premium_grants
      where market_user_id = check_user_id and status = 'active'
        and starts_at <= now() and (expires_at is null or expires_at > now())
    )
  );
$$;
revoke all on function public.has_market_premium(uuid) from public;
grant execute on function public.has_market_premium(uuid) to anon, authenticated;

do $create_grants_rpc$ begin
  if not exists (select 1 from pg_proc where pronamespace = 'public'::regnamespace and proname = 'my_premium_grants') then
    execute $rpc$create function public.my_premium_grants()
      returns table(source text, status text, starts_at timestamptz, expires_at timestamptz)
      language sql stable security definer set search_path = public as $body$
        select source, status, starts_at, expires_at from public.premium_grants
        where market_user_id = (select auth.uid()) order by created_at desc;
      $body$;$rpc$;
  end if;
end $create_grants_rpc$;
grant execute on function public.my_premium_grants() to authenticated;

drop policy if exists "premium users can read premium analyses" on public.daily_analyses;
create policy "premium users can read premium analyses" on public.daily_analyses
for select using (is_premium = false or public.has_market_premium(auth.uid()));

drop policy if exists "altcoin posts public read" on public.altcoin_posts;
drop policy if exists "altcoin posts premium read" on public.altcoin_posts;
create policy "altcoin posts public read" on public.altcoin_posts
for select using (is_premium = false or public.has_market_premium(auth.uid()));
