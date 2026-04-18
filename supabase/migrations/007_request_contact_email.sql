alter table public.analysis_requests
  add column if not exists requester_email text;

update public.analysis_requests
set requester_email = coalesce(requester_email, (
  select profiles.email
  from public.profiles
  where profiles.id = analysis_requests.user_id
))
where requester_email is null;
