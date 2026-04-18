alter table public.analysis_requests
  add column if not exists admin_notes text,
  add column if not exists delivery_url text,
  add column if not exists requested_at timestamptz not null default now(),
  add column if not exists fulfilled_at timestamptz;

update public.analysis_requests
set requested_at = coalesce(requested_at, created_at)
where requested_at is null;

alter table public.daily_analyses
  alter column summary drop not null;
