# Mottazen Habits — Rebuild Guide (4 Phases)

Use this folder to rebuild the app from scratch with a scalable architecture: **views as routes**, **domain logic in one package**, **goals with weighted habits**, and **dedicated category progress pages**.

## How to use these docs

1. Read phases **in order**. Do not skip Phase 1 — interface decisions drive schema and routes.
2. Check off **milestones** at the end of each phase before moving on.
3. Keep **acceptance criteria** as your definition of done.
4. Phase 3 references domain concepts from Phase 2; Phase 4 assumes a working app locally.

## Phase map

| Phase | Focus | Outcome |
|-------|--------|---------|
| [Phase 1 — Interface & IA](./PHASE-1-interface-and-ia.md) | UX, all screens, navigation, **category pages**, design system | Figma-level spec + route map + component inventory |
| [Phase 2 — Foundation](./PHASE-2-foundation.md) | Repo, TypeScript, Vite, Supabase schema, `@mottazen/core` | Runnable shell: auth, empty routes, DB migrated |
| [Phase 3 — Features](./PHASE-3-features.md) | Log, insights, **category progress**, goals, notifications, sync | Feature-complete app on localhost |
| [Phase 4 — Launch](./PHASE-4-launch.md) | PWA, Cloudflare, push, QA, production | Live at your domain with monitoring |

## Milestones at a glance (one-time gates)

| Phase | Gate before next phase |
|-------|-------------------------|
| **1** | M1.2 route map + M1.5 category page spec approved |
| **2** | AC7 — all scoring in `@mottazen/core`, routes stubbed |
| **3** | AC1 — 3-day dogfood on localhost; category % matches spreadsheet |
| **4** | M4.7 smoke tests ([checklist](./SMOKE-TESTS.md)) |

## New in rebuild vs current `index.html`

- **`/categories`** — compare all categories (7-day sparklines)
- **`/categories/:slug`** — hero score, activity calendar, habit breakdown, daily bars, linked goals
- **`/habit/:id`** — dedicated habit analysis (not a tab switch)
- **`/goals`** — weighted habit targets with Today chips
- **React + `@mottazen/core`** — one source of truth for scores

## Recommended stack (locked for this guide)

- **Frontend:** React 19 + TypeScript + Vite + React Router
- **Data:** Supabase (Auth, Postgres, RLS, Edge Functions)
- **Domain:** `packages/core` — pure TS (scoring, streaks, goals, categories)
- **Deploy:** Cloudflare Pages + static assets + `.wranglerignore`
- **Optional:** TanStack Query for server state

## Product vision (one paragraph)

Mottazen Habits is a personal habit coach: log daily actions quickly, see honest analysis, drill into **categories** and **goals** with weighted contributions, and receive supportive notifications — without shame or spam.

## What you are NOT rebuilding in v1

Defer unless marked optional in a phase:

- Social / sharing
- Multi-user households
- Native iOS/Android apps (PWA first)
- AI coaching
- Marketplace of habit templates

---

*Last updated: aligned with conversation context (zen.mottazen.com, Supabase project, Cloudflare Workers asset limits).*
