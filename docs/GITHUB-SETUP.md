# Connect Zen to GitHub

**Repo:** [github.com/shadi113344/Zen](https://github.com/shadi113344/Zen)

## Push succeeded?

If `git push` printed `main -> main`, you are connected — even if Windows showed a **Bonjour / mdnsNSP.dll** popup. That warning is from Apple Bonjour (old iTunes networking), not Git. Click **Cancel** and ignore it.

---

## GitHub Actions secrets (required for auto-deploy)

1. Open **[Settings → Secrets and variables → Actions](https://github.com/shadi113344/Zen/settings/secrets/actions)**
2. Click **New repository secret** for each row below

| Name | Value | Where to get it |
|------|--------|-----------------|
| `VITE_SUPABASE_URL` | `https://gzkwemcxxizzhcnotelt.supabase.co` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | your anon public key | Supabase → Settings → API → anon |
| `CLOUDFLARE_API_TOKEN` | API token | Cloudflare → [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token** → template **Edit Cloudflare Workers** |
| `CLOUDFLARE_ACCOUNT_ID` | `de2e8ee2273398b5ce5e912dba28d300` | Cloudflare dashboard URL or Workers overview |

Optional:

| Name | Value |
|------|--------|
| `VITE_VAPID_PUBLIC_KEY` | Web push public key (skip if not using push) |
| `CRON_SECRET` | Same random string as Supabase `CRON_SECRET` — powers `.github/workflows/cron-reminders.yml` |

The cron workflow also uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (already required for deploy). If cron returns **401**, re-check that `CRON_SECRET` matches Supabase exactly and that both URL/anon secrets are set.

### You cannot “view” secrets after saving

GitHub only shows secret **names**, not values. That is normal. To verify:

1. **[Actions](https://github.com/shadi113344/Zen/actions)** tab
2. Open the failed **Deploy** run → **Re-run all jobs**  
   Or push any commit to `main`
3. Green check = deploy worked → **https://zen.mottazen.com** updated

### If Deploy still fails

| Error | Fix |
|-------|-----|
| `Unrecognized named-value: 'secrets'` in workflow file | Pull latest `main` (workflow was fixed) |
| `CLOUDFLARE_API_TOKEN` not set | Add token secret; use **Edit Cloudflare Workers** template |
| Build shows demo mode on site | `VITE_SUPABASE_*` secrets missing or wrong on build step |
| Authentication error 10000 | Regenerate Cloudflare token with Workers Scripts **Edit** |

---

## Manual deploy (no GitHub)

```bash
npm run deploy
```

Uses your local `apps/web/.env.local` — never commit that file.

---

## First-time push (already done)

```bash
git remote add origin https://github.com/shadi113344/Zen.git
git push -u origin main
```
