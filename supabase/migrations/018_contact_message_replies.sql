create table if not exists public.contact_message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.contact_messages(id) on delete cascade,
  sender_role text not null check (sender_role in ('admin', 'member')),
  sender_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_message_replies enable row level security;

drop policy if exists "contact replies self read" on public.contact_message_replies;
create policy "contact replies self read" on public.contact_message_replies
for select using (
  exists (
    select 1
    from public.contact_messages
    where contact_messages.id = contact_message_replies.message_id
      and (
        auth.uid() = contact_messages.user_id
        or public.is_admin_user()
      )
  )
);

drop policy if exists "contact replies admin insert" on public.contact_message_replies;
create policy "contact replies admin insert" on public.contact_message_replies
for insert to authenticated
with check (
  public.is_admin_user()
  and sender_role = 'admin'
  and length(trim(body)) > 1
);
