create table if not exists public.daily_biases (
  id uuid primary key default gen_random_uuid(),
  market text not null check (market in ('BTC', 'ETH', 'NQ', 'ES')),
  forecasted_bias text not null check (forecasted_bias in ('Bullish', 'Bearish', 'Neutral', 'Range')),
  confidence text not null check (confidence in ('Low', 'Medium', 'High')),
  outcome text not null check (outcome in ('Correct', 'Partially correct', 'Wrong', 'Pending')),
  notes text not null default '',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  unique (market, published_at)
);

alter table public.daily_biases enable row level security;

create policy "daily biases public read" on public.daily_biases
for select using (true);

create policy "daily biases admin manage" on public.daily_biases
for all using (public.is_admin_user())
with check (public.is_admin_user());

insert into public.daily_biases (market, forecasted_bias, confidence, outcome, notes, published_at)
values
  ('NQ', 'Neutral', 'Low', 'Partially correct', 'Zone de interes, SMT și divergență înaintea oricărui scenariu bearish. Rezervă ridicată în contextul știrilor.', '2026-09-11T12:00:00.000Z'),
  ('ES', 'Neutral', 'Low', 'Partially correct', 'Zone de interes, SMT și divergență înaintea oricărui scenariu bearish. Rezervă ridicată în contextul știrilor.', '2026-09-11T12:00:00.000Z'),
  ('NQ', 'Neutral', 'Low', 'Correct', 'Context neutru, cu posibilă tentă bearish.', '2026-09-10T12:00:00.000Z'),
  ('ES', 'Neutral', 'Low', 'Correct', 'Context neutru, cu posibilă tentă bearish.', '2026-09-10T12:00:00.000Z'),
  ('NQ', 'Bearish', 'Medium', 'Correct', 'Slăbiciune în preț și lower low pe 1H înaintea atacării BOS-ului daily. IFVG daily și închiderea sub PML susțin scenariul.', '2026-09-09T12:00:00.000Z'),
  ('ES', 'Bearish', 'Medium', 'Correct', 'Slăbiciune în preț și lower low pe 1H înaintea atacării BOS-ului daily. IFVG daily și închiderea sub PML susțin scenariul.', '2026-09-09T12:00:00.000Z'),
  ('NQ', 'Neutral', 'Low', 'Correct', 'NQ avea o tentă bullish, dar necorelarea față de ES păstra scenariul de range relevant.', '2026-09-08T12:00:00.000Z'),
  ('NQ', 'Bullish', 'Low', 'Partially correct', 'Reacumulare și long din zona de interes, condiționate de confirmarea structurii.', '2026-09-07T12:00:00.000Z'),
  ('ES', 'Bullish', 'Low', 'Partially correct', 'MSS pe 1H și long din zona de interes, condiționate de confirmarea CRT pe 6H.', '2026-09-07T12:00:00.000Z')
on conflict (market, published_at) do nothing;
