# Supabase Setup

## 1. Create the project

1. Create a new Supabase project.
2. Copy the project URL and anon key into `.env`.
3. Enable Email OTP or Magic Link in Auth providers.

## 2. Apply the schema

Run the SQL inside `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor or with the Supabase CLI.

## 3. Create storage buckets

- `analysis-videos`
- `chart-images`
- `teaser-videos`

## 4. Recommended next integrations

- RevenueCat for native subscriptions
- Stripe Checkout for web-based request payments
- Expo push token registration into `notification_tokens`
- Edge Functions for payment webhook handling and post-publish notifications
