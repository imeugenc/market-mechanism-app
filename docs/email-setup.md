# Email Setup

## 1. What this setup covers

- Transactional app emails are still inserted into `public.email_notification_queue`
- A Supabase Edge Function named `send-email-queue` reads pending queue rows and sends them through Resend
- Supabase Auth emails use Resend SMTP directly for:
  - account confirmation
  - password reset

## 2. Resend setup

1. Create a Resend account: [https://resend.com](https://resend.com)
2. Add a domain in Resend. Prefer a transactional subdomain such as `send.marketmechanism.xyz`
3. In Namecheap:
   - open the domain
   - go to `Advanced DNS`
   - add the exact DNS records Resend shows for that domain/subdomain
4. For Namecheap, Resend documents the mapping here:
   - [https://resend.com/docs/knowledge-base/namecheap](https://resend.com/docs/knowledge-base/namecheap)
5. Create an API key in Resend after the domain is verified

Recommended sender:

- From email: `noreply@marketmechanism.xyz`
- Reply-To: `hello@marketmechanism.xyz`

If you want the best sender reputation split, verify and use:

- `noreply@send.marketmechanism.xyz`

## 3. Supabase secrets for the Edge Function

Set these secrets in Supabase:

```bash
supabase secrets set \
  RESEND_API_KEY=re_xxxxxxxxx \
  EMAIL_QUEUE_CRON_SECRET=replace-with-a-long-random-secret \
  EMAIL_FROM=noreply@marketmechanism.xyz \
  EMAIL_FROM_NAME="Market Mechanism" \
  EMAIL_REPLY_TO=hello@marketmechanism.xyz \
  OWNER_EMAIL=hello@marketmechanism.xyz
```

For local function testing, copy:

- `supabase/functions/.env.example`

to:

- `supabase/functions/.env`

and fill the real values there.

## 4. Deploy the migration and function

Run the migration that adds delivery tracking and helper RPCs:

```bash
supabase db push
```

Deploy the Edge Function:

```bash
supabase functions deploy send-email-queue
```

## 5. Process the queue manually

You can trigger the queue manually with:

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email-queue" \
  -H "Content-Type: application/json" \
  -H "x-email-queue-secret: YOUR_EMAIL_QUEUE_CRON_SECRET" \
  -d '{"batchSize":20}'
```

## 6. Automate queue processing with Supabase Cron

If `select cron.schedule(...)` fails with `schema "cron" does not exist`, enable these extensions first:

```sql
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
```

Or from the Supabase Dashboard:

- `Database` -> `Extensions` -> enable `pg_net`
- `Integrations` -> `Cron` -> enable `pg_cron`

Store the function URL and cron secret in Vault:

```sql
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email-queue', 'email_queue_url');
select vault.create_secret('YOUR_EMAIL_QUEUE_CRON_SECRET', 'email_queue_secret');
```

Schedule the function every minute:

```sql
select cron.schedule(
  'process-email-queue-every-minute',
  '* * * * *',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'email_queue_url'),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-email-queue-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'email_queue_secret')
      ),
      body := '{"batchSize":20}'::jsonb
    );
  $$
);
```

## 7. Configure Supabase Auth custom SMTP with Resend

In Supabase Dashboard:

1. Open `Authentication` -> `Settings` -> `SMTP Settings`
2. Enable custom SMTP
3. Fill:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: your Resend API key
   - Sender name: `Market Mechanism`
   - Sender email: `noreply@marketmechanism.xyz`
4. Save
5. Send a test email from the Supabase dashboard

Supabase documentation:

- [https://supabase.com/docs/guides/auth/auth-smtp](https://supabase.com/docs/guides/auth/auth-smtp)

Resend SMTP documentation:

- [https://resend.com/docs/send-with-smtp](https://resend.com/docs/send-with-smtp)

## 8. What happens after setup

### App emails

These events are already queued by the app and will be delivered by the function:

- `premium_nou_admin`
- `premium_validat`
- `premium_trimisa`
- `mesaj_admin`
- `cerere_primită`
- `cerere_acceptată`
- `cerere_livrată`
- `continut_nou`
- `contact_nou`

### Auth emails

These are sent directly by Supabase Auth over Resend SMTP:

- signup confirmation
- password reset

## 9. Delivery troubleshooting

Inspect queue rows:

```sql
select
  id,
  event_name,
  status,
  attempt_count,
  provider_message_id,
  error_message,
  created_at,
  sent_at,
  failed_at
from public.email_notification_queue
order by created_at desc;
```

If rows stay `pending`, the function is not being invoked yet.

If rows become `failed`, inspect `error_message` and the Edge Function logs.
