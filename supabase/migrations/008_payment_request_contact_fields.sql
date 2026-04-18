alter table public.payment_requests
  add column if not exists full_name text,
  add column if not exists contact_email text;

update public.payment_requests pr
set
  full_name = coalesce(pr.full_name, p.display_name, split_part(p.email, '@', 1), 'Utilizator'),
  contact_email = coalesce(pr.contact_email, p.email)
from public.profiles p
where p.id = pr.user_id
  and (pr.full_name is null or pr.contact_email is null);
