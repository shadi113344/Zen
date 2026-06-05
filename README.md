# Mottazen Habits (rebuild)

Habit tracker rebuilt as a Vite + React monorepo with Supabase backend.

## Quick start (5 minutes)

```bash
npm install
npm run setup          # creates apps/web/.env.local from template
# Edit apps/web/.env.local — paste your Supabase anon key
npm run dev            # http://localhost:8787
```

Without Supabase keys the app runs in **demo mode** with sample data (no sign-in required).

### Test on your phone (Tailscale)

1. PC and phone on the same [Tailscale](https://tailscale.com) account.
2. Run `npm run dev` — note the **Network** URL in the terminal (e.g. `http://100.x.x.x:8787`).
3. On your phone’s browser, open that URL (or `http://<your-pc-tailscale-ip>:8787/log`).
4. Supabase → **Authentication → URL configuration** → add redirect URL:  
   `http://<your-pc-tailscale-ip>:8787/**`  
   (and keep `http://localhost:8787/**` for desktop).

If the page won’t load, allow port **8787** through Windows Firewall for private networks.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local app (port **8787**, listens on LAN/Tailscale) |
| `npm run build` | Production build → `apps/web/dist` |
| `npm run preview` | Build + preview production locally |
| `npm run test` | Core domain tests (scoring, goals, notifications) |
| `npm run db:push` | Apply Supabase migrations (CLI + linked project) |
| `npm run legacy:convert -- path/to/old-export.json` | Convert old app export → new import JSON |

## Connect Supabase

1. Create or use project at [supabase.com](https://supabase.com).
2. Run migrations in SQL Editor (in order):  
   `supabase/migrations/0001_base.sql` → `0002_rls.sql` → `0003_category_weights.sql` → `0004_category_colors.sql` → `0005_habit_types.sql` → `0006_goals_v2.sql` → `20260527000000_push_subscriptions.sql`  
   Or: `npm run db:push` if the Supabase CLI is linked.
3. **Authentication** → enable Email and Google; add redirect URL `http://localhost:8787/log` and your production URL.
4. Copy **Project URL** + **anon key** into `apps/web/.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Optional for background push: `VITE_VAPID_PUBLIC_KEY=` — see [PUSH_SETUP.md](./PUSH_SETUP.md).

## Import from the old `index.html` app

1. Old app → Profile → Export JSON.
2. Run: `npm run legacy:convert -- ./my-export.json`  
   Writes `my-export.mottazen.json` next to the source file.
3. New app → Profile → Import data → choose that file → Confirm.

## Deploy (Cloudflare)

**Quick deploy:** `npm run deploy` (build + `wrangler deploy`)

**Live URLs:**

- Production: **https://zen.mottazen.com**
- Workers.dev: **https://zen.shadisherif1347.workers.dev**

Full launch checklist (Supabase migrations, Google Auth, custom domain): **[docs/LAUNCH.md](./docs/LAUNCH.md)**

### GitHub Actions (optional)

1. Push repo to GitHub
2. Set secrets: `CLOUDFLARE_API_TOKEN`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_VAPID_PUBLIC_KEY`
3. Push to `main` — workflow runs tests, build, and `wrangler deploy`
4. Run [docs/rebuild/SMOKE-TESTS.md](./docs/rebuild/SMOKE-TESTS.md)

## Docs

- **App description** (features, phase status): [`docs/APP-DESCRIPTION.md`](./docs/APP-DESCRIPTION.md)
- **App logic** (scoring, sync, architecture): [`docs/APP-LOGIC.md`](./docs/APP-LOGIC.md)
- **Launch guide** (deploy, Supabase, Google, domain): [`docs/LAUNCH.md`](./docs/LAUNCH.md)
- **GitHub setup** (new repo + CI deploy): [`docs/GITHUB-SETUP.md`](./docs/GITHUB-SETUP.md)
- **Phase 4 ops** (VAPID, cron): [`docs/PHASE-4-OPS.md`](./docs/PHASE-4-OPS.md)
- Rebuild phases: `docs/rebuild/PHASE-*.md`
- Post-deploy checks: `docs/rebuild/SMOKE-TESTS.md`
- Push ops: `PUSH_SETUP.md`
