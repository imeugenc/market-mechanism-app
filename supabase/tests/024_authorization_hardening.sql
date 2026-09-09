\set ON_ERROR_STOP on

begin;
set local role postgres;

\o /dev/null
select set_config(
  'request.jwt.claims',
  (
    select jsonb_build_object(
      'sub', id,
      'email', email,
      'role', 'authenticated'
    )::text
    from public.profiles
    where lower(email) <> 'hello@marketmechanism.xyz'
    order by created_at asc
    limit 1
  ),
  true
);
\o

set local role authenticated;

do $test$
declare
  actual_email text;
  returned_email text;
  role_update_blocked boolean := false;
  plan_update_blocked boolean := false;
begin
  if auth.uid() is null then
    raise exception 'No ordinary member is available for the authorization test.';
  end if;

  if public.is_admin_user() or public.is_admin_user(gen_random_uuid()) then
    raise exception 'An ordinary member was identified as an administrator.';
  end if;

  select email into actual_email
  from public.profiles
  where id = auth.uid();

  select email into returned_email
  from public.ensure_profile_membership(
    auth.uid(),
    'hello@marketmechanism.xyz'
  );

  if returned_email is distinct from actual_email then
    raise exception 'The membership RPC trusted a client-supplied email.';
  end if;

  begin
    update public.profiles
    set role = 'admin', is_admin = true
    where id = auth.uid();
  exception
    when insufficient_privilege then
      role_update_blocked := true;
  end;

  begin
    update public.profiles
    set subscription_tier = case
      when subscription_tier = 'premium' then 'free'
      else 'premium'
    end
    where id = auth.uid();
  exception
    when insufficient_privilege then
      plan_update_blocked := true;
  end;

  if not role_update_blocked or not plan_update_blocked then
    raise exception 'Protected field result: role_blocked=%, plan_blocked=%',
      role_update_blocked,
      plan_update_blocked;
  end if;

  update public.profiles
  set display_name = display_name
  where id = auth.uid();
end;
$test$;

reset role;
rollback;

\echo 'PASS: ordinary-member authorization checks'
