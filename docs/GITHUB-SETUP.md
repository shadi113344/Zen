# Connect Zen to GitHub

## 1. Create the repo on GitHub

1. Go to [github.com/new](https://github.com/new)
2. **Repository name:** `zen`
3. **Visibility:** Private (recommended — habit data app)
4. Do **not** add README, .gitignore, or license (this project already has them)
5. Click **Create repository**

## 2. Push local code (first time)

From `c:\cody\zen` (after the initial commit exists):

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zen.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## 3. GitHub Actions secrets (auto-deploy)

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | [Cloudflare API token](https://dash.cloudflare.com/profile/api-tokens) with **Workers Scripts: Edit** |
| `VITE_SUPABASE_URL` | `https://gzkwemcxxizzhcnotelt.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `VITE_VAPID_PUBLIC_KEY` | optional, for background push |

After secrets are set, every push to `main` runs tests, builds, and `wrangler deploy` to the **zen** Worker.

## 4. Verify

1. Push a small change to `main`
2. **Actions** tab → **Deploy** workflow should pass
3. **https://zen.mottazen.com** serves the new build

## 5. What is never committed

`.gitignore` excludes:

- `apps/web/.env.local` (Supabase keys)
- `node_modules/`, `dist/`, `.wrangler/`

Never commit anon key to a public repo without understanding it's designed for client-side use — still prefer private repo.

## Manual deploy (without GitHub)

```bash
npm run deploy
```
