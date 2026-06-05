# Web Push setup (Zen)

Background reminders when the app is **fully closed** require one-time Supabase + VAPID setup. The app code is already scaffolded; follow these steps to turn it on.

## What was added

| File | Purpose |
|------|---------|
| `sw.js` | Service worker — shows notifications when push arrives |
| `manifest.json` | PWA manifest (helps iOS “Add to Home Screen”) |
| `icon.svg` | App icon for notifications |
| `supabase/migrations/…sql` | DB tables + RLS |
| `supabase/functions/send-test-push` | Manual test (from app “Test push” button) |
| `supabase/functions/send-reminders` | Cron job — sends daily + per-habit reminders |

## 1. Run the database migration

In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**, paste and run:

`supabase/migrations/20260527000000_push_subscriptions.sql`

This adds:

- `push_subscriptions` — device push endpoints
- `push_notify_log` — dedupe so you aren’t spammed
- `user_settings.notification_prefs` + `timezone`
- `habits.remind_at` — synced from the habit form

## 2. Generate VAPID keys

From any machine with Node.js:

```bash
npx web-push generate-vapid-keys
```

You’ll get a **public** and **private** key. Keep the private key secret.

## 3. Put the public key in the app

In `apps/web/.env.local` (and Cloudflare **Production** env vars for deploy):

```env
VITE_VAPID_PUBLIC_KEY=your_public_key_here
```

Rebuild or redeploy after changing this value.

## 4. Deploy static files (Cloudflare)

Production build output is `apps/web/dist`. The workflow deploys via Wrangler. These must be served from the site root (`https://your-domain/sw.js`, etc.):

- `index.html`
- `sw.js`
- `manifest.json`
- `icon.png`

## 5. Deploy Supabase Edge Functions

Install [Supabase CLI](https://supabase.com/docs/guides/cli), log in, and link the project:

```bash
cd mottazen-habits
supabase login
supabase link --project-ref gzkwemcxxizzhcnotelt
```

Set secrets (use your real keys):

```bash
supabase secrets set VAPID_PUBLIC_KEY="your_public_key"
supabase secrets set VAPID_PRIVATE_KEY="your_private_key"
supabase secrets set VAPID_SUBJECT="mailto:you@example.com"
supabase secrets set CRON_SECRET="pick_a_long_random_string"
```

Deploy functions:

```bash
supabase functions deploy send-test-push
supabase functions deploy send-reminders
```

Supabase auto-injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for Edge Functions.

## 6. Test from the app

1. Open https://zen.mottazen.com (after deploy)
2. Sign in → menu → **Daily reminders…**
3. Enable reminders, allow notifications, **Save**
4. Click **Test push** — you should get a notification even if you switch tabs

If test works but scheduled reminders don’t, set up cron (step 7).

## 7. Schedule reminder checks (every 5 minutes)

The `send-reminders` function must be called on a schedule.

**Option A — free external cron** ([cron-job.org](https://cron-job.org) or similar):

- URL: `https://gzkwemcxxizzhcnotelt.supabase.co/functions/v1/send-reminders`
- Method: `POST`
- Header: `x-cron-secret: YOUR_CRON_SECRET` (same value as in step 5)
- Interval: every **5 minutes**

**Option B — GitHub Actions** (included in repo): workflow `.github/workflows/cron-reminders.yml` runs every 5 minutes. Requires GitHub secrets `CRON_SECRET` (same as Supabase), `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`.

**Option C — Supabase cron** (if enabled on your plan): schedule a pg_cron job or Dashboard scheduled function that POSTs to the same URL with the secret header.

## 8. iPhone notes

- Web Push on iOS only works if the user **Add to Home Screen** (Safari share menu).
- iOS 16.4+ required.
- Without install, in-tab reminders still work when Safari is open in background.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “Background push: add VAPID public key” | Step 3 — set `VITE_VAPID_PUBLIC_KEY` in `.env.local` / Cloudflare |
| Test push 404 | Migration not run, or reminders not saved / no subscription |
| Test push 401 | Not signed in, or function not deployed |
| No scheduled reminders | Cron not set up (step 7), or timezone wrong in Reminders modal |
| Subscription save error | Run migration; check RLS policies |
| 410 errors on send | Stale subscription — re-save reminders in the app |

## How reminders are decided (server)

Every cron run, for each user with a push subscription:

1. Compute local time from `user_settings.timezone`
2. **Per-habit**: if `habits.remind_at` matches now and habit not logged today → push
3. **Daily**: if `notification_prefs.enabled` and `dailyTime` matches and any habits still due → push
4. Each event is deduped via `push_notify_log` (once per day per habit / daily summary)

Local in-app reminders (30s scheduler) still run as a fallback when the tab is open.
