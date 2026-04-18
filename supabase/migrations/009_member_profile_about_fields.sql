alter table public.profiles
  add column if not exists bio text,
  add column if not exists trading_experience text,
  add column if not exists traded_markets text,
  add column if not exists trading_style text,
  add column if not exists preferred_sessions text,
  add column if not exists focused_setups text,
  add column if not exists current_goal text,
  add column if not exists member_profile_visibility text not null default 'private'
    check (member_profile_visibility in ('members', 'private'));
