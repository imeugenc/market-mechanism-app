alter table public.email_notification_queue
  add column if not exists attempt_count integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists processing_started_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists provider_message_id text,
  add column if not exists error_message text;

create index if not exists email_notification_queue_status_created_at_idx
  on public.email_notification_queue (status, created_at);

create or replace function public.claim_email_notification_batch(batch_size integer default 20)
returns setof public.email_notification_queue
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select q.id
    from public.email_notification_queue q
    where (
      q.status in ('pending', 'failed')
      or (
        q.status = 'processing'
        and coalesce(q.processing_started_at, q.last_attempt_at, q.created_at) <= now() - interval '15 minutes'
      )
    )
    order by q.created_at asc
    limit greatest(coalesce(batch_size, 20), 1)
    for update skip locked
  ),
  claimed as (
    update public.email_notification_queue q
    set
      status = 'processing',
      attempt_count = coalesce(q.attempt_count, 0) + 1,
      last_attempt_at = now(),
      processing_started_at = now(),
      error_message = null
    from candidates c
    where q.id = c.id
    returning q.*
  )
  select *
  from claimed;
end;
$$;

revoke all on function public.claim_email_notification_batch(integer) from public;
grant execute on function public.claim_email_notification_batch(integer) to service_role;

create or replace function public.complete_email_notification_delivery(
  p_queue_id uuid,
  p_status text,
  p_provider_message_id text default null,
  p_error_message text default null
)
returns public.email_notification_queue
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.email_notification_queue;
  normalized_status text := lower(coalesce(p_status, 'failed'));
begin
  update public.email_notification_queue
  set
    status = case when normalized_status = 'sent' then 'sent' else 'failed' end,
    provider_message_id = case
      when normalized_status = 'sent' then coalesce(p_provider_message_id, provider_message_id)
      else provider_message_id
    end,
    error_message = case
      when normalized_status = 'sent' then null
      else left(coalesce(p_error_message, 'Email delivery failed.'), 2000)
    end,
    sent_at = case when normalized_status = 'sent' then now() else sent_at end,
    failed_at = case when normalized_status = 'sent' then failed_at else now() end,
    processing_started_at = null
  where id = p_queue_id
  returning * into updated_row;

  return updated_row;
end;
$$;

revoke all on function public.complete_email_notification_delivery(uuid, text, text, text) from public;
grant execute on function public.complete_email_notification_delivery(uuid, text, text, text) to service_role;
