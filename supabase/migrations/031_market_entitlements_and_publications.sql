-- Extend the base 030 Premium grants migration with Journal sync and publication fields.
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
create index if not exists premium_grants_active_idx on public.premium_grants(market_user_id, status, expires_at);
alter table public.premium_grants enable row level security;
revoke all on public.premium_grants from anon, authenticated;
grant all on public.premium_grants to service_role;

create or replace function public.my_premium_grants()
returns table(source text, status text, starts_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select grant_row.source, grant_row.status, grant_row.starts_at, grant_row.expires_at
  from public.premium_grants grant_row where grant_row.market_user_id = auth.uid();
$$;
revoke all on function public.my_premium_grants() from public;
grant execute on function public.my_premium_grants() to authenticated;

-- Preserve the existing Market plan as its own source. Expired legacy rows remain
-- visible for auditing but cannot authorize access.
insert into public.premium_grants (market_user_id, source, source_ref, status, starts_at, expires_at)
select user_id, 'market_manual', 'legacy-membership:' || user_id::text, 'active',
       coalesce(started_at, now()), expires_at
from public.memberships where current_plan = 'PRO'
on conflict (market_user_id, source, source_ref) do nothing;

create or replace function public.sync_market_manual_grant()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.current_plan = 'PRO' then
    insert into public.premium_grants (market_user_id, source, source_ref, status, starts_at, expires_at, updated_at)
    values (new.user_id, 'market_manual', 'legacy-membership:' || new.user_id::text, 'active', coalesce(new.started_at, now()), new.expires_at, now())
    on conflict (market_user_id, source, source_ref) do update
      set status = 'active', starts_at = excluded.starts_at, expires_at = excluded.expires_at, updated_at = now();
  else
    update public.premium_grants set status = 'revoked', updated_at = now()
    where market_user_id = new.user_id and source = 'market_manual'
      and source_ref = 'legacy-membership:' || new.user_id::text;
  end if;
  return new;
end;
$$;
drop trigger if exists sync_market_manual_grant on public.memberships;
create trigger sync_market_manual_grant after insert or update of current_plan, expires_at on public.memberships
for each row execute function public.sync_market_manual_grant();

create or replace function public.has_market_premium(check_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select (check_user_id = auth.uid() or auth.role() = 'service_role')
    and (
      public.is_admin_user(check_user_id)
      or exists (
        select 1 from public.premium_grants grant_row
        where grant_row.market_user_id = check_user_id
          and grant_row.status = 'active'
          and grant_row.starts_at <= now()
          and (grant_row.expires_at is null or grant_row.expires_at > now())
      )
    );
$$;
revoke all on function public.has_market_premium(uuid) from public;
grant execute on function public.has_market_premium(uuid) to authenticated, service_role;

drop policy if exists "premium users can read premium analyses" on public.daily_analyses;
create policy "premium users can read premium analyses" on public.daily_analyses
for select using (is_premium = false or public.has_market_premium(auth.uid()));
alter table public.altcoin_posts add column if not exists is_visible boolean not null default true;
drop policy if exists "altcoin posts public read" on public.altcoin_posts;
drop policy if exists "altcoin posts premium read" on public.altcoin_posts;
create policy "altcoin posts public read" on public.altcoin_posts
for select using ((is_premium = false or public.has_market_premium(auth.uid())) and coalesce(is_visible, true));

alter table public.daily_biases add column if not exists trading_date date;
alter table public.daily_biases add column if not exists liquidity_target text;
alter table public.daily_biases add column if not exists tradingview_url text;
alter table public.daily_biases add column if not exists thumbnail_url text;
alter table public.daily_biases add column if not exists external_source_id uuid unique;
alter table public.daily_biases add column if not exists is_visible boolean not null default true;

alter table public.after_action_reviews add column if not exists tradingview_url text;
alter table public.after_action_reviews add column if not exists thumbnail_url text;
alter table public.after_action_reviews add column if not exists external_source_id uuid unique;
alter table public.after_action_reviews add column if not exists is_visible boolean not null default true;
alter table public.after_action_reviews add column if not exists updated_at timestamptz not null default now();

alter table public.altcoin_posts add column if not exists tradingview_url text;
alter table public.altcoin_posts add column if not exists thumbnail_url text;
alter table public.altcoin_posts add column if not exists external_source_id uuid unique;
alter table public.altcoin_posts add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_content_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists daily_biases_updated_at on public.daily_biases;
create trigger daily_biases_updated_at before update on public.daily_biases for each row execute function public.set_content_updated_at();
drop trigger if exists after_action_reviews_updated_at on public.after_action_reviews;
create trigger after_action_reviews_updated_at before update on public.after_action_reviews for each row execute function public.set_content_updated_at();
drop trigger if exists altcoin_posts_updated_at on public.altcoin_posts;
create trigger altcoin_posts_updated_at before update on public.altcoin_posts for each row execute function public.set_content_updated_at();

drop policy if exists "daily biases public read" on public.daily_biases;
create policy "daily biases public read" on public.daily_biases for select using (is_visible or public.is_admin_user());
drop policy if exists "free reviews public read" on public.after_action_reviews;
create policy "free reviews public read" on public.after_action_reviews for select using (is_visible or public.is_admin_user());
