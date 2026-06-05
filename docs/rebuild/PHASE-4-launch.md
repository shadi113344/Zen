# Phase 4 — Launch (PWA, Cloudflare, Push, Production)

**Duration estimate:** 1–2 weeks (solo)  
**Prerequisite:** Phase 3 acceptance criteria AC1–AC7  
**Goal:** App live on your domain, installable, with optional background push and safe deploy pipeline.

---

## Outcomes (definition of done)

- [ ] `https://zen.mottazen.com` (or your domain) serves the Vite build
- [ ] PWA installable; `sw.js` registered; manifest valid
- [ ] Supabase production keys only in CI secrets
- [ ] Web Push working when app closed (Android/desktop; iOS A2HS)
- [ ] Cloudflare deploy excludes `node_modules` (no asset size failure)
- [ ] Smoke test script run post-deploy
- [ ] Rollback procedure documented

---

## One-time milestones (Phase 4)

| ID | Milestone | Done |
|----|-----------|------|
| M4.1 | Production Supabase env verified | ☐ |
| M4.2 | Cloudflare Pages/Workers project connected | ☐ |
| M4.3 | Custom domain + HTTPS | ☐ |
| M4.4 | PWA manifest + SW in production | ☐ |
| M4.5 | VAPID + Edge Functions deployed | ☐ |
| M4.6 | Cron reminder job scheduled | ☐ |
| M4.7 | Post-deploy smoke tests pass | ☐ |
| M4.8 | Monitoring + backup routine | ☐ |

---

## 1. Pre-launch checklist (blockers)

Complete before first production deploy:

| Item | Action |
|------|--------|
| Secrets | No `.env` in git; rotate anon key if leaked |
| RLS | Re-audit all tables |
| CORS | Supabase auth redirect URLs include production domain |
| OAuth | Google console authorized origins + redirect URIs |
| Build | `npm run build` → inspect `dist/` size (< 5 MB typical) |
| SPA routing | 404 → `index.html` (Cloudflare `not_found_handling`) |
| robots | Optional `robots.txt` disallow if private app |

---

## 2. Environment variables

### Local (`.env.local`)

```
VITE_SUPABASE_URL=https://evvlrdvoynocriyjkbek.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_VAPID_PUBLIC_KEY=BEl...
```

### Cloudflare Pages (dashboard → Settings → Environment variables)

Same `VITE_*` vars for **Production** (and Preview if you want staging).

**Never** put `VAPID_PRIVATE_KEY` or `service_role` in the frontend.

### Supabase Edge Function secrets

```bash
supabase secrets set VAPID_PUBLIC_KEY="..."
supabase secrets set VAPID_PRIVATE_KEY="..."
supabase secrets set VAPID_SUBJECT="mailto:you@mottazen.com"
supabase secrets set CRON_SECRET="long_random_string"
```

---

## 3. Cloudflare deploy

### 3.1 Build command

```bash
npm ci
npm run build -w apps/web
```

**Publish directory:** `apps/web/dist`

(If you keep a flat static root like the current repo, adjust paths — prefer `dist` for Vite.)

### 3.2 `wrangler.toml` (static assets)

```toml
name = "mottazen-habits"
compatibility_date = "2024-08-01"

[assets]
directory = "apps/web/dist"
not_found_handling = "single-page-application"
```

### 3.3 `.wranglerignore` (critical — learned from production incident)

```
node_modules/
.git/
supabase/
docs/
scripts/
*.md
.env*
playwright-report/
test-results/
```

**One-time task:** Confirm deploy bundle < 25 MiB in Cloudflare dashboard.

### 3.4 Git hygiene

```bash
git rm -r --cached node_modules   # if ever committed
```

Ensure `.gitignore` includes `node_modules/`, `dist/`, `.env*`.

### 3.5 Deploy paths

| Method | When |
|--------|------|
| Cloudflare Pages Git integration | auto on `main` |
| `npx wrangler deploy` | manual / Workers Assets |

---

## 4. PWA files

Place in `apps/web/public/` (copied to dist root):

| File | Purpose |
|------|---------|
| `manifest.json` | name, icons, `display: standalone`, `start_url: /log` |
| `sw.js` | push + cache strategy |
| `icon.svg` / PNG icons | 192, 512 for manifest |

### 4.1 `manifest.json` essentials

```json
{
  "name": "Mottazen Habits",
  "short_name": "Habits",
  "start_url": "/log",
  "display": "standalone",
  "background_color": "#0a0f1a",
  "theme_color": "#3b82f6",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 4.2 Register service worker (Vite app)

```typescript
// main.tsx — production only
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("/sw.js");
}
```

### 4.3 `sw.js` responsibilities

1. `push` event → `showNotification` with habit/coach copy
2. `notificationclick` → `clients.openWindow('/log')`
3. Optional: cache `index.html` + assets (stale-while-revalidate)

Copy and adapt from current repo `sw.js`.

### 4.4 Cache busting

Bump `CACHE_NAME` in `sw.js` on each release.

**One-time task:** Document release step: bump cache version in `sw.js` every deploy.

---

## 5. Web Push (background)

Follow `PUSH_SETUP.md` in repo root; summary for rebuild:

### 5.1 Database

Run migration:

`supabase/migrations/20260527000000_push_subscriptions.sql`

Tables: `push_subscriptions`, `push_notify_log`.

### 5.2 Client subscription flow

After user enables notifications on coach page:

```typescript
const reg = await navigator.serviceWorker.ready;
const sub = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
});
await supabase.from("push_subscriptions").upsert({ ...sub keys, user_id });
```

### 5.3 Edge Functions

| Function | Role |
|----------|------|
| `send-test-push` | Manual test button |
| `send-reminders` | Cron: daily check-in + per-habit `remind_at` |

Deploy:

```bash
supabase functions deploy send-test-push
supabase functions deploy send-reminders
```

### 5.4 Cron

Schedule HTTP call to `send-reminders` every 15 minutes with header:

`Authorization: Bearer ${CRON_SECRET}`

Options: Supabase cron, GitHub Actions, cron-job.org.

**Dedupe:** `push_notify_log` with `notify_key` per user/slot.

### 5.5 iOS limitations

Document in app UI:

- Install via **Share → Add to Home Screen**
- Push only works for installed PWA on iOS 16.4+
- Foreground coach still works in Safari tab

---

## 6. Domain & HTTPS

| Step | Detail |
|------|--------|
| DNS | CNAME `zen` → Cloudflare Worker custom domain |
| SSL | Full (strict) |
| Redirect | apex → www or reverse (pick one) |
| Supabase Auth | Site URL = `https://zen.mottazen.com` |

---

## 7. CI/CD pipeline (recommended)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - run: npm ci
      - run: npm run test
      - run: npm run build -w apps/web
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

Store `VITE_*` in GitHub Secrets → injected at build time.

---

## 8. Post-deploy smoke tests

Run within 15 minutes of every deploy:

| # | Test | Expected |
|---|------|----------|
| S1 | Load `/log` | 200, no blank screen |
| S2 | Hard refresh | assets load |
| S3 | Sign in | session works |
| S4 | Log one habit | persists after refresh |
| S5 | Tap habit name | `/habit/:id` loads |
| S6 | Open `/categories` | lists categories |
| S7 | Open `/categories/health` (or your slug) | score visible |
| S8 | `/profile/notifications` | saves settings |
| S9 | `sw.js` | 200, correct MIME |
| S10 | Manifest | valid in Chrome Application tab |
| S11 | Test push (if enabled) | notification received |
| S12 | Mobile Safari A2HS | opens standalone |

**One-time task:** Save this table as `docs/rebuild/SMOKE-TESTS.md` and check boxes per release.

---

## 9. Monitoring & ops

| Area | Tool |
|------|------|
| Frontend errors | Sentry (optional) or Cloudflare Web Analytics |
| Supabase | Dashboard → Database health, API logs |
| Edge Functions | Supabase logs for `send-reminders` |
| Uptime | Better Uptime / CF health check on `/log` |

### Backup

- Weekly: Supabase logical backup (Pro plan) or `pg_dump` script
- User data: export JSON monthly to personal storage

### Rollback

1. Cloudflare → Deployments → Rollback to previous
2. If schema broke: restore DB snapshot (last resort)
3. Bump `sw.js` cache name after rollback

---

## 10. Security hardening

| Item | Action |
|------|--------|
| RLS | No `service_role` in client |
| CSP | `default-src 'self'; connect-src https://*.supabase.co` |
| Auth session | `persistSession: true`, short JWT refresh |
| CRON_SECRET | rotate yearly |
| VAPID | rotate keys if compromised |

---

## 11. Launch day runbook (ordered)

### T-24h

- [ ] Merge release branch to `main`
- [ ] Run full Phase 3 manual test checklist
- [ ] Backup database

### T-1h

- [ ] Set Cloudflare env vars
- [ ] Verify Supabase redirect URLs

### T-0

- [ ] Deploy
- [ ] Run smoke tests S1–S12
- [ ] Send yourself test push
- [ ] Install PWA on phone

### T+1h

- [ ] Monitor error logs
- [ ] Post changelog (personal notes)

### T+1 week

- [ ] Review `push_notify_log` volume
- [ ] Check Cloudflare bandwidth

---

## 12. Staging environment (optional but recommended)

| Piece | Setup |
|-------|-------|
| Branch | `staging` → Cloudflare preview URL |
| Supabase | separate project OR schema prefix |
| Auth | test users only |

Never point staging at production DB with test keys.

---

## 13. Marketing / onboarding (minimal)

- [ ] One screenshot: Today view
- [ ] One screenshot: Category detail (showcase new feature)
- [ ] Install instructions page linked from Profile (iOS + Android)

---

## 14. Future work (post-launch, not blocking)

| Item | Phase |
|------|-------|
| Server-side notification rules only | 4.1 |
| Remove legacy reminders modal | cleanup |
| React Native shell | new project |
| Shared households | schema redesign |
| AI coach | new product |

---

## 15. Acceptance criteria (project complete)

| # | Criterion |
|---|-----------|
| AC1 | Production URL loads in < 3s on 4G |
| AC2 | You completed 7-day dogfood on production only |
| AC3 | Push received with app killed (Android or desktop) |
| AC4 | Category page URL shareable and loads logged-in |
| AC5 | Deploy pipeline green; rollback tested once |
| AC6 | No secrets in GitHub history (scan with `gitleaks` optional) |

---

## 16. Reference: current repo assets to reuse

When launching, port these from `mottazen-habits/` root:

| Asset | Use in rebuild |
|-------|----------------|
| `sw.js` | adapt paths for Vite |
| `manifest.json` | update `start_url` |
| `icon.svg` | generate PNGs |
| `supabase/functions/*` | deploy as-is after review |
| `PUSH_SETUP.md` | ops runbook supplement |
| `.wranglerignore` | keep patterns |

---

## 17. Congratulations checklist

When all Phase 4 milestones are checked:

- [ ] Live URL bookmarked on phone (installed PWA)
- [ ] Coach notifications configured
- [ ] Category weak-area review weekly ritual defined
- [ ] Old `index.html` archived read-only
- [ ] Rebuild docs updated with "shipped" date

You rebuilt Mottazen Habits with **routes, category intelligence, goals, and production push** — ready to iterate in small PRs instead of a 5k-line file.
