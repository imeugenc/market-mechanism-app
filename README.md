# Execution Edge

Execution Edge is a premium mobile app for daily trading analysis across BTC, ETH, NQ, and ES. This scaffold is optimized for a solo founder using Expo + React Native + TypeScript with a Supabase backend and subscription-ready architecture.

## Short Build Plan

1. Ship a premium mobile shell with strong navigation, seeded data, and polished dark military styling.
2. Prepare backend-first models for daily analyses, after-action reviews, subscriptions, requests, ranks, and admin publishing.
3. Implement auth, free/pro gating, request monetization flow, and gamified rank progression in a solo-founder-friendly way.
4. Keep all creator workflows manual-first so daily posting is easy before automation.

## Default Product Decisions

- Mobile stack: Expo Router + React Native + TypeScript
- Backend: Supabase Auth, Postgres, Storage, Row Level Security
- Payments: Stripe for web request checkout, RevenueCat or native store subscriptions prepared next
- Push notifications: Expo Notifications first, Firebase/APNs underneath later
- Admin tools: in-app admin screens for MVP, with Supabase role checks
- Content delivery: manual daily uploads with market tagging and premium gating

## Technical Plan

### 1. Architecture

- `app/`: route files using Expo Router
- `src/theme`: tokens, color system, spacing, shadows, and typography
- `src/components`: reusable premium UI blocks
- `src/features`: feature logic split by auth, content, requests, profile, membership, admin
- `src/providers`: app-level state, auth session, seeded demo content, rank updates
- `supabase/migrations`: SQL schema and policies

### 2. Core User Flows

- Free member opens dashboard, sees teasers, after-action reviews, featured markets, and upgrade CTAs.
- Pro member opens a market and unlocks full bias, levels, invalidation, targets, and premium video.
- User requests an altcoin analysis, picks tier, pays, and tracks request status.
- Creator publishes a daily analysis or after-action review directly from the admin screen.
- Member rank updates based on streak, content views, premium views, requests, and engagement score.

### 3. Data Strategy

- Use Supabase Postgres tables for `profiles`, `memberships`, `daily_analyses`, `after_action_reviews`, `analysis_requests`, `request_payments`, `saved_markets`, `view_events`, and `notification_tokens`.
- Store videos and chart images in Supabase Storage buckets.
- Use RLS to keep premium content protected and admin actions restricted.
- Maintain a derived `rank_score` on memberships for fast profile rendering.

### 4. Monetization Strategy

- Free tier keeps value through chart images, reviews, and teaser media.
- Pro subscription unlocks premium analyses and push alerts.
- Request analysis flow monetizes extra demand through three clear tiers:
  - Quick Look: `$2`
  - Full Written Analysis: `$5`
  - Full Video Analysis: `$10`

### 5. MVP Delivery Order

1. App shell and premium design system
2. Navigation and seeded content
3. Auth and profile state
4. Free/pro gating
5. Request creation and tracking
6. Rank engine and activity stats
7. Admin publishing flow
8. Supabase wiring and deployment polish

## Run Instructions

Detailed local run instructions are included after implementation is complete. If dependencies are not installed yet, run `npm install` and then `npm run start`.
