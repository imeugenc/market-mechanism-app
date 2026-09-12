alter table public.daily_biases
  add column if not exists chart_image text,
  add column if not exists video_url text,
  add column if not exists related_review_id uuid references public.after_action_reviews (id) on delete set null;

create index if not exists daily_biases_related_review_id_idx
  on public.daily_biases (related_review_id);
