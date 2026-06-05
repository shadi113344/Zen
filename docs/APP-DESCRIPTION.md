# Zen — App Description

**Last updated:** June 2026  
**Product name:** **Zen** (PWA `manifest.json`, install name)  
**Codebase:** `c:\cody\zen` (Vite + React 19 monorepo)  
**Rebuild plan:** [`docs/rebuild/`](./rebuild/README.md) (4 phases)

---

## What this app is

Zen is a personal habit coach: log daily actions in seconds, see honest scoring, drill into **categories** and **goals** with weighted contributions, and receive supportive notifications — without shame or spam.

The app replaces the legacy single-file `index.html` tracker with a scalable architecture: React routes for every screen, domain logic in `@mottazen/core`, and Supabase for auth + cloud sync.

**Run locally:** `npm run dev` → `http://localhost:8787` (LAN/Tailscale-friendly). Without Supabase keys it runs in **demo mode** with sample data.

---

## Phase status (rebuild vs current code)

This is a code audit against [`PHASE-1`](./rebuild/PHASE-1-interface-and-ia.md) through [`PHASE-4`](./rebuild/PHASE-4-launch.md). Phase doc checkboxes were never updated in-repo; the table below reflects **actual implementation**.

| Phase | Focus | Status | Notes |
|-------|--------|--------|-------|
| **1 — Interface & IA** | UX spec, routes, design system | **~98%** | Goal chips, pull-to-refresh, goal routes added; 5-tab nav intentional |
| **2 — Foundation** | Monorepo, core, DB, auth shell | **~98%** | Goals v2 migration + cloud sync; IndexedDB still deferred |
| **3 — Features** | Full product on localhost | **~98%** | Feature-complete on localhost; dogfood/Lighthouse manual |
| **4 — Launch** | PWA, Cloudflare, push, prod QA | **~65%** | Code ready; ops checklist in [`PHASE-4-OPS.md`](./PHASE-4-OPS.md) |

### Phase 1 — implemented vs spec

| Spec item | Status |
|-----------|--------|
| `/log`, `/log/:date` Today screen | ✅ |
| Hero score ring + coach copy | ✅ (enhanced: two-line copy, gold at 100%) |
| Category chips → `/categories/:slug` | ✅ |
| Habit cards (check, numeric, swipe, menu) | ✅ (+ milestone/onetime types) |
| Day notes | ✅ (+ day mood emoji) |
| `/insights`, `/habit/:id` | ✅ |
| `/categories`, `/categories/:slug` | ✅ |
| `/goals`, `/goals/new`, `/goals/:id` | ✅ |
| `/profile`, `/profile/notifications`, `/profile/data`, `/profile/theme` | ✅ |
| **Today goal chips** (`GoalChipsRow`) | ✅ |
| **5-tab mobile nav** (Today, Insights, Goals, Categories, You) | ✅ intentional |
| Pull-to-refresh on Today | ✅ |

### Phase 2 — implemented vs spec

| Spec item | Status |
|-----------|--------|
| `packages/core` (scoring, streaks, categories, goals, insights, notifications) | ✅ + Vitest tests |
| Supabase: habits, habit_logs, user_settings, RLS | ✅ |
| Auth (email + Google) | ✅ |
| All Phase 1 routes | ✅ |
| Category weights + colors in `user_settings` | ✅ |
| Habit types `milestone`, `onetime` | ✅ (`0005_habit_types.sql`) |
| Goals tables in Postgres | ✅ `0006_goals_v2.sql` (kind, dates, cumulative fields, color) |
| **Goals cloud sync** | ✅ `useData` fetch/upsert goals + goal_habits |
| IndexedDB offline cache | ❌ deferred — `localStorage` snapshot |

### Phase 3 — acceptance criteria

| # | Criterion | Likely status |
|---|-----------|---------------|
| AC1 | 3-day dogfood without old app | Subjective — app is feature-rich enough |
| AC2 | Category % matches spreadsheet | ✅ logic in core; manual verify recommended |
| AC3 | Habit streak matches old app | ✅ same rules in `@mottazen/core` |
| AC4 | Export → import empty DB | ✅ includes goals → Supabase on import |
| AC5 | Foreground notifications | ✅ `useNotificationScheduler` + coach settings |
| AC6 | Lighthouse PWA ≥ 80 | Not verified in this audit |
| AC7 | No `console.error` on happy path | ✅ none found in app source |

### Phase 4 — launch readiness

| Item | Status |
|------|--------|
| Vite production build | ✅ |
| `manifest.json` + `sw.js` + prod SW registration | ✅ scaffold |
| Cloudflare `wrangler.toml` + GitHub deploy workflow | ✅ |
| Web Push Edge Functions (`send-reminders`, `send-test-push`) | ✅ code exists |
| VAPID + cron + production smoke tests | ⚠️ Ops — see [`PUSH_SETUP.md`](../PUSH_SETUP.md), [`SMOKE-TESTS.md`](./rebuild/SMOKE-TESTS.md) |
| Custom domain / monitoring | ⚠️ External — not verifiable from code |

---

## Feature inventory (by area)

### Today (`/log`)

- Week date strip; URL sync via `/log/:date`
- **Hero score** — animated ring, status + suggestion copy, confetti + gold styling at 100%
- Category filter chips (hidden in activity-only density)
- Grouped habit list with drag reorder, swipe skip/rest, radial action menu
- Habit types: check, numeric, milestone, onetime
- Per-habit goal indicator dots on cards
- Day notes + **mood emoji** picker (viewport-clamped menu)
- Display density: normal / compact / activity-only
- Offline banner when network drops
- FAB add habit

### Categories (`/categories`, `/categories/:slug`)

- Index: 7-day sparklines, averages, best/weakest activity
- Detail: hero score, linked goals %, activity calendar, habit breakdown, daily bars, weight editor
- Add category; per-category accent colors

### Goals (`/goals`)

- Consistency goals (days/week) and cumulative goals (target units)
- Weighted habit links, progress per habit, optional **goal color** picker
- Category goals section on category detail pages
- **Not on Today:** horizontal goal chips (Phase 3 spec)

### Insights (`/insights`)

- Activities vs Categories scope; period: today / week / month / year / all
- Reorderable cards: radar, metrics, heatmap, habit lists, bar charts
- Full heatmap lives here (not on Today)

### Habit detail (`/habit/:id`)

- Streak pills, 30-day calendar, score line chart, history table, range tabs

### Notifications (`/profile/notifications`)

- Coach settings: quiet hours, daily check-in, smart missed, motivation, recovery, low score, reflection
- Per-category rules and per-habit reminders
- Foreground scheduler (60s tick); web push subscription scaffold
- Refactored settings layout (shared `SettingsSection` / toggle rows)

### Settings (`/profile`)

- **Today:** layout density, edit buttons on cards, link to Goals
- **Haptic feedback:** master toggle, progress steps, milestones, test buzzes (Android/desktop)
- **Appearance:** theme mode, colors & background (accent, tints, glass)
- **Notifications** link
- **Data:** export JSON/CSV, import (new + legacy), sample data, clear all
- Sign out (when authenticated)

### Auth & data

- Supabase email/password + Google OAuth
- Cloud sync: habits, logs, user_settings (notes, mood blob, weights, colors, notification prefs, timezone)
- localStorage snapshot for fast reload and offline read
- Demo mode without credentials
- Legacy `index.html` export converter (`npm run legacy:convert`)

### PWA & deploy

- Service worker in production builds
- Cloudflare SPA deploy from `apps/web/dist`
- CI: test + build on PR; deploy on `main`

---

## Extra features (beyond rebuild phase docs)

These were added during iterative UI/UX work and are **not** called out in the original Phase 1–4 specs:

| Feature | Description |
|---------|-------------|
| **Gold hero at 100%** | Ring stroke + number use gold gradient; dark mode uses deep gold (not yellow) |
| **Synced ring animation** | Score ring fill animates in lockstep with the counting number |
| **Two-line hero copy** | `heroCopy()` returns separate status + suggestion lines |
| **Progress greens** | Stronger green for in-progress / completed activity names and category % |
| **Skipped strikethrough** | Skipped habits show struck activity name |
| **Goal colors** | User-pickable accent per goal + stable hash fallback |
| **Unified tab headers** | Today / Insights / Categories / Goals share `tab-screen-header` spacing |
| **Habit menu styling** | Dotted ring menu button with center dot |
| **Haptic system** | Progress bump + triple-pulse milestone; settings section; iOS uses native switch taps on controls |
| **Day mood** | Emoji mood stored alongside daily notes in `daily_notes` blob |
| **Activity-only density** | Third display mode focused on logging |
| **Tailscale dev** | Vite `host: true`, port **8787** for phone testing |
| **Confetti** | Subtle celebration when day score crosses into 100% |

---

## Product principles (unchanged)

From Phase 1:

1. **Log first** — under 10 seconds to log
2. **Honest math** — one domain ruleset in `@mottazen/core`
3. **Coach, not alarm** — supportive notification tone
4. **Depth on demand** — summary → drill-down routes
5. **Calm premium** — dark-first, minimal chrome, glass cards

---

## What is NOT in v1 (deferred by design)

- Social / sharing
- Multi-user households
- Native iOS/Android apps (PWA first)
- AI coaching
- Habit template marketplace
- Batch log / focus habit (Phase 3 P2 deferrals)

---

## Gaps & known issues

### Remaining gaps

1. **Background push ops** — VAPID, Edge deploy, cron — see [`PHASE-4-OPS.md`](./PHASE-4-OPS.md)
2. **IndexedDB offline cache** — optional Phase 2 deferral; still uses `localStorage`
3. **Lighthouse PWA ≥ 80** — manual verify before launch
4. **Phase doc milestone checkboxes** — still `☐` in `PHASE-*.md` (doc drift only)

### Platform limitations (not bugs)

| Platform | Behavior |
|----------|----------|
| **iOS Safari / PWA** | No `navigator.vibrate`; programmatic milestone haptics blocked (iOS 26.5+). Native Taptic only on direct taps of real `<input switch>` controls. |
| **iOS Web Push** | Requires Add to Home Screen |

### Low-priority notes

| Issue | Detail |
|-------|--------|
| `compactView` deprecated alias | Still used in `HabitCard`; works via `displayDensity === "compact"` |
| Clear site data without cloud | Goals recoverable from Supabase after re-login if migration `0006` applied |

No `TODO` / `FIXME` markers were found in `apps/web/src` or `packages/core/src`.

---

## Tech stack (locked)

| Layer | Choice |
|-------|--------|
| Frontend | React 19, TypeScript, Vite, React Router 7 |
| Server state | TanStack Query (shell); primary store is `useData` |
| Backend | Supabase (Auth, Postgres, RLS, Edge Functions) |
| Domain | `packages/core` — pure TypeScript |
| Deploy | Cloudflare (SPA from `apps/web/dist`) |
| Tests | Vitest on `@mottazen/core` |

---

## Related docs

- [APP-LOGIC.md](./APP-LOGIC.md) — scoring, data flow, sync, architecture
- [rebuild/README.md](./rebuild/README.md) — original 4-phase plan
- [SMOKE-TESTS.md](./rebuild/SMOKE-TESTS.md) — post-deploy checklist
- [PHASE-4-OPS.md](./PHASE-4-OPS.md) — production launch checklist
- [PUSH_SETUP.md](../PUSH_SETUP.md) — web push operations
