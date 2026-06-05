# Phase 4 — Operations checklist (Zen)

Run once before calling Phase 4 complete. Code scaffolding is in the repo; these steps require dashboard/CLI access.

## Prerequisites

- Phase 3 features working locally with Supabase connected
- Production domain (or Cloudflare `*.pages.dev` URL) for smoke tests

## 1. Database migrations (production Supabase)

Apply all migrations in order in **SQL Editor** or via `npm run db:push`:

1. `0001_base.sql` … `0005_habit_types.sql`
2. **`0006_goals_v2.sql`** — goals cloud sync (consistency / cumulative model)
3. `20260527000000_push_subscriptions.sql`

## 2. Environment variables

### Local (`apps/web/.env.local`)

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_VAPID_PUBLIC_KEY=BEl...   # optional, for background push
```

### Cloudflare Pages / Workers (Production)

Same `VITE_*` values. Never put `VAPID_PRIVATE_KEY` or `service_role` in the frontend.

### Supabase Edge Function secrets

```bash
supabase secrets set VAPID_PUBLIC_KEY="..."
supabase secrets set VAPID_PRIVATE_KEY="..."
supabase secrets set VAPID_SUBJECT="mailto:you@example.com"
supabase secrets set CRON_SECRET="long_random_string"
supabase functions deploy send-test-push
supabase functions deploy send-reminders
```

## 3. Auth redirects

Supabase → **Authentication → URL configuration**:

- `http://localhost:8787/**`
- `https://YOUR_PRODUCTION_DOMAIN/**`

Google OAuth: authorized origins + redirect URIs for both URLs.

## 4. Cron (background reminders)

POST every **5 minutes** to:

`https://YOUR_PROJECT.supabase.co/functions/v1/send-reminders`

Headers: `x-cron-secret: YOUR_CRON_SECRET`

**Included in repo:** `.github/workflows/cron-reminders.yml` (every 5 min). Add GitHub secret `CRON_SECRET` matching Supabase.

Alternatives: [cron-job.org](https://cron-job.org) or Supabase scheduled functions if on your plan.

## 5. Post-deploy smoke tests

Run [SMOKE-TESTS.md](./rebuild/SMOKE-TESTS.md) within 15 minutes of each deploy.

## 6. Release hygiene

- Bump `CACHE_NAME` in `apps/web/public/sw.js` on each production release
- Rollback: Cloudflare → Deployments → previous version; bump SW cache after rollback
- Monitor: Supabase logs, Edge Function logs, Cloudflare analytics

## 7. Phase 4 milestone sign-off

| ID | Milestone | Done |
|----|-----------|------|
| M4.1 | Production Supabase env verified | ☐ |
| M4.2 | Cloudflare project connected | ☐ |
| M4.3 | Custom domain + HTTPS | ☐ |
| M4.4 | PWA manifest + SW in production | ☐ |
| M4.5 | VAPID + Edge Functions deployed | ☐ |
| M4.6 | Cron reminder job scheduled | ☐ |
| M4.7 | Smoke tests S1–S14 pass | ☐ |
| M4.8 | Monitoring + backup routine | ☐ |
