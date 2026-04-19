drop policy if exists "requests self insert" on public.analysis_requests;
drop policy if exists "requests guest insert" on public.analysis_requests;

create policy "requests authenticated insert" on public.analysis_requests
for insert with check (
  auth.uid() is not null
  and (
    auth.uid() = user_id
    or (
      user_id is null
      and lower(coalesce(requester_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  and length(trim(asset_input)) > 1
);

create policy "requests guest insert" on public.analysis_requests
for insert with check (
  auth.uid() is null
  and user_id is null
  and requester_email is not null
  and length(trim(requester_email)) > 4
  and length(trim(asset_input)) > 1
);
