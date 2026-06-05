# Zen — Phase 4 launch guide

Step-by-step to go live with **Supabase**, **Google Auth**, **Cloudflare**, and **zen.mottazen.com**.

Your project details (from local setup):

| Item | Value |
|------|--------|
| Supabase project | `gzkwemcxxizzhcnotelt` |
| Supabase URL | `https://gzkwemcxxizzhcnotelt.supabase.co` |
| Cloudflare Worker | `zen` |
| Workers.dev URL | `https://zen.shadisherif1347.workers.dev` |
| Custom domain | `https://zen.mottazen.com` |

---

## Checklist overview

| Step | Task | Where |
|------|------|--------|
| 1 | Run database migrations | Supabase SQL Editor |
| 2 | Configure Supabase Auth URLs | Supabase Dashboard |
| 3 | Enable Google OAuth | Google Cloud + Supabase |
| 4 | Deploy frontend | `npm run deploy` |
| 5 | Attach custom domain | Cloudflare (via `wrangler.toml` or Dashboard) |
| 6 | Smoke test | Browser |
| 7 | (Optional) Web Push + cron | Supabase Edge Functions |

---

## 1. Database migrations

**Option A — SQL Editor (recommended first time)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/gzkwemcxxizzhcnotelt/sql/new)
2. Paste the contents of [`supabase/all-migrations.sql`](../supabase/all-migrations.sql) (all migrations in order)
3. Click **Run**

**Already ran base schema before?** Use [`supabase/catch-up-migrations.sql`](../supabase/catch-up-migrations.sql) instead (skips tables + RLS you already have). The full file is also safe to re-run — policies use `DROP POLICY IF EXISTS` first.

**Option B — CLI**

```bash
npx supabase login
npx supabase link --project-ref gzkwemcxxizzhcnotelt
npm run db:push
```

Regenerate combined SQL anytime: `npm run db:migrations > supabase/all-migrations.sql`

---

## 2. Supabase Auth (Site URL + redirects)

[Authentication → URL configuration](https://supabase.com/dashboard/project/gzkwemcxxizzhcnotelt/auth/url-configuration)

| Setting | Value |
|---------|--------|
| **Site URL** | `https://zen.mottazen.com` |
| **Redirect URLs** (add each) | `http://localhost:8787/**` |
| | `https://zen.mottazen.com/**` |
| | `https://zen.shadisherif1347.workers.dev/**` |

Enable **Email** provider (on by default).

---

## 3. Google OAuth

### 3a. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials**
2. **Create OAuth client** → type **Web application**
3. **Authorized JavaScript origins:**
   - `https://zen.mottazen.com`
   - `https://zen.shadisherif1347.workers.dev`
   - `http://localhost:8787`
4. **Authorized redirect URIs:**
   - `https://gzkwemcxxizzhcnotelt.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret**

### 3b. Supabase

[Authentication → Providers → Google](https://supabase.com/dashboard/project/gzkwemcxxizzhcnotelt/auth/providers)

- Enable Google
- Paste Client ID + Client Secret
- Save

### 3c. Test

1. Open `https://zen.mottazen.com/auth` (or workers.dev URL)
2. Click **Continue with Google**
3. After redirect you should land on `/log` signed in

---

## 4. Deploy to Cloudflare

Local one-shot deploy (uses `apps/web/.env.local` for Supabase keys baked into the build):

```bash
npm run deploy
```

This runs `npm run build` then `wrangler deploy`.

**Important:** Vite bakes `VITE_*` env vars at **build time**. Production build must have the correct Supabase URL + anon key before deploy.

### GitHub Actions (auto deploy on push to `main`)

1. Create a GitHub repo and push this project
2. Add repository **Secrets**:
   - `CLOUDFLARE_API_TOKEN` — [Cloudflare API token](https://dash.cloudflare.com/profile/api-tokens) with **Workers Scripts: Edit**
   - `VITE_SUPABASE_URL` — `https://gzkwemcxxizzhcnotelt.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` — from Supabase → Settings → API → anon public
   - `VITE_VAPID_PUBLIC_KEY` — optional, for background push

---

## 5. Custom domain (`zen.mottazen.com`)

`wrangler.toml` already declares:

```toml
[[routes]]
pattern = "zen.mottazen.com"
custom_domain = true
```

**Requirements:**

1. Domain **mottazen.com** must be on your Cloudflare account (same account as Wrangler login)
2. Run `npm run deploy` — Wrangler registers the custom domain on the Worker

**If deploy fails on custom domain:**

1. Cloudflare Dashboard → **Workers & Pages** → `zen` → **Settings** → **Domains & Routes**
2. Add custom domain `zen.mottazen.com` manually
3. Or temporarily comment out the `[[routes]]` block in `wrangler.toml` and use workers.dev only

**DNS:** Cloudflare usually creates the CNAME automatically when you attach a Workers custom domain. If not, add:

| Type | Name | Target |
|------|------|--------|
| CNAME | `zen` | per Cloudflare UI when attaching Worker custom domain |

Wait for SSL (Active) before testing auth.

---

## 6. Smoke tests

After deploy, run [SMOKE-TESTS.md](./rebuild/SMOKE-TESTS.md) on **zen.mottazen.com**:

- [ ] `/log` loads
- [ ] Email sign-up / sign-in works
- [ ] Google sign-in works
- [ ] Log a habit → refresh → persists
- [ ] Add a goal → refresh → persists (needs migration `0006`)
- [ ] `/goals/:id` and Today goal chips work
- [ ] `https://zen.mottazen.com/sw.js` returns 200
- [ ] PWA installable (Chrome → Application → Manifest)

---

## 7. Optional — background push

See [PUSH_SETUP.md](../PUSH_SETUP.md) and [PHASE-4-OPS.md](./PHASE-4-OPS.md):

1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Add `VITE_VAPID_PUBLIC_KEY` to `.env.local` and Cloudflare/GitHub secrets
3. Run push migration if not in `all-migrations.sql`
4. Deploy Edge Functions + set cron for `send-reminders`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Demo mode on production | Rebuild with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set, then redeploy |
| Google redirect error | Redirect URI must be exactly `https://gzkwemcxxizzhcnotelt.supabase.co/auth/v1/callback` |
| Auth redirect loop | Add production URL to Supabase Redirect URLs |
| Goals not syncing | Run `all-migrations.sql` including `0006_goals_v2.sql` |
| Old cached app | Bump `CACHE_NAME` in `sw.js` (currently `zen-v4`) and redeploy |
| 404 on refresh | `not_found_handling = "single-page-application"` in wrangler.toml (already set) |

---

## Quick reference commands

```bash
npm run dev              # local http://localhost:8787
npm run deploy           # build + Cloudflare deploy
npm run db:migrations    # print SQL for Supabase Editor
npx supabase login       # one-time CLI auth
npm run db:push          # apply migrations via CLI
```
