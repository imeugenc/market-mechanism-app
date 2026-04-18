alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('admin', 'user'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, is_admin, role, saved_markets)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    false,
    coalesce(new.raw_user_meta_data ->> 'role', 'user'),
    '{}'
  )
  on conflict (id) do nothing;

  insert into public.memberships (
    user_id,
    current_plan,
    current_rank,
    login_streak,
    total_views,
    premium_views,
    total_requests,
    engagement_actions,
    score
  )
  values (
    new.id,
    case
      when coalesce(new.raw_user_meta_data ->> 'plan', 'free') = 'premium' then 'PRO'::public.user_plan
      else 'FREE'::public.user_plan
    end,
    'Recruit',
    0,
    0,
    0,
    0,
    0,
    0
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
