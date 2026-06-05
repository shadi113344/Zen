# Phase 2 — Foundation (Repo, Core, Database, Shell)

**Duration estimate:** 2–3 weeks (solo)  
**Prerequisite:** Phase 1 milestones M1.2, M1.5 checked  
**Goal:** A runnable app with auth, routing, design system, and Supabase — screens can be empty placeholders.

---

## Outcomes (definition of done)

- [ ] Monorepo boots with `npm run dev` (Vite, port **8787** to match current habit)
- [ ] All Phase 1 routes exist (placeholder pages OK)
- [ ] `@mottazen/core` exports scoring, streaks, category aggregates (unit tested)
- [ ] Supabase schema migrated; RLS verified with two test users
- [ ] Auth flow: email + Google; session persists on refresh
- [ ] Read/write habits + logs + settings from React (no feature polish yet)

---

## One-time milestones (Phase 2)

| ID | Milestone | Done |
|----|-----------|------|
| M2.1 | Create repo + folder structure (Section 2) | ☐ |
| M2.2 | `packages/core` with first unit tests passing | ☐ |
| M2.3 | Supabase project linked; base tables + RLS live | ☐ |
| M2.4 | Auth screens wired; protected routes redirect | ☐ |
| M2.5 | AppShell + design tokens in CSS | ☐ |
| M2.6 | Route stubs for every Phase 1 path | ☐ |
| M2.7 | Data layer: habits CRUD + daily logs sync | ☐ |
| M2.8 | Category slug map stored (name ↔ slug) | ☐ |

---

## 1. Repository structure

Create a **pnpm or npm workspaces** monorepo:

```
mottazen-habits/
├── apps/
│   └── web/                 # Vite + React + TS
│       ├── src/
│       │   ├── app/         # providers, router
│       │   ├── routes/      # one file per route group
│       │   ├── components/  # UI from Phase 1 inventory
│       │   ├── hooks/
│       │   ├── lib/         # supabase client, date helpers
│       │   └── styles/      # tokens.css
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
├── packages/
│   └── core/                # pure domain logic
│       ├── src/
│       │   ├── scoring.ts
│       │   ├── streaks.ts
│       │   ├── categories.ts
│       │   ├── goals.ts
│       │   └── types.ts
│       └── package.json
├── supabase/
│   ├── migrations/
│   └── functions/           # copy from current repo when ready
├── docs/rebuild/
├── .wranglerignore
├── wrangler.toml
└── package.json
```

### Root `package.json` scripts

```json
{
  "scripts": {
    "dev": "npm run dev -w apps/web",
    "build": "npm run build -w apps/web",
    "test": "npm run test -w packages/core",
    "db:push": "supabase db push"
  }
}
```

### Vite config highlights

- Port **8787**
- Alias `@` → `src/`
- Alias `@mottazen/core` → `packages/core/src`
- Build output: `apps/web/dist` (Cloudflare deploys this folder in Phase 4)

---

## 2. Technology versions (pin early)

| Package | Version guidance |
|---------|------------------|
| react / react-dom | 19.x |
| react-router-dom | 7.x |
| typescript | 5.x |
| vite | 6.x |
| @supabase/supabase-js | 2.x |
| vitest | 2.x (core package tests) |
| @tanstack/react-query | 5.x (optional but recommended) |

---

## 3. Supabase schema (full v1)

Assume existing production project (`evvlrdvoynocriyjkbek`) or a **new** project for greenfield. Run migrations in order.

### 3.1 `profiles` (extends auth.users)

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);
```

### 3.2 `habits`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | client-generated OK |
| user_id | uuid FK | |
| name | text | |
| category | text | display name; slug derived in app |
| type | text | `check` \| `numeric` |
| min / max / step | numeric | for numeric |
| color | text | hex |
| order_index | int | |
| paused | boolean | default false |
| remind_at | time | optional; push |
| notify | jsonb | per-habit coach prefs (Phase 3) |
| meta | jsonb | icons, notes flags |
| created_at | timestamptz | |

### 3.3 `habit_logs`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | |
| habit_id | uuid FK habits | |
| log_date | date | user's calendar day |
| value | numeric | 0 = unchecked; null = not logged; -1 or flag for rest |
| note | text | optional |
| unique | (habit_id, log_date) | |

Use **one row per habit per day**. Rest day: store sentinel (e.g. `value = -1` or `is_rest boolean`).

### 3.4 `user_settings`

| Column | Type |
|--------|------|
| id | uuid (= user_id) |
| compact_view | boolean |
| show_edit_buttons | boolean |
| theme | text `dark` \| `light` \| `system` |
| notification_prefs | jsonb |
| timezone | text |
| daily_notes | jsonb | map `YYYY-MM-DD` → string (or separate table if you prefer) |

### 3.5 `goals` (Phase 3 UI, migrate now)

```sql
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  period text not null check (period in ('daily','weekly')),
  target_percent numeric not null default 80,
  created_at timestamptz default now()
);

create table public.goal_habits (
  goal_id uuid references public.goals(id) on delete cascade,
  habit_id uuid references public.habits(id) on delete cascade,
  weight numeric not null default 1,
  required boolean not null default false,
  primary key (goal_id, habit_id)
);
```

### 3.6 Push tables (from existing migration)

Copy `supabase/migrations/20260527000000_push_subscriptions.sql` from the current repo:

- `push_subscriptions`
- `push_notify_log`
- extend `user_settings.notification_prefs`

### 3.7 RLS pattern (every table)

```sql
alter table public.habits enable row level security;

create policy "habits_own"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Repeat for `habit_logs`, `goals`, `goal_habits`, `user_settings`, `push_subscriptions`.

**Task:** Run RLS test — User A cannot `select` User B's habits.

---

## 4. `@mottazen/core` — implement first

All UI must call these functions; **no duplicate score math in components**.

### 4.1 Types (`types.ts`)

```typescript
export type HabitType = "check" | "numeric";
export type LogValue = number | null; // null = not logged

export interface Habit {
  id: string;
  name: string;
  category: string;
  type: HabitType;
  min?: number;
  max?: number;
  step?: number;
}

export interface DayLog {
  habitId: string;
  date: string; // YYYY-MM-DD
  value: LogValue;
  isRest?: boolean;
}
```

### 4.2 `habitScore(habit, value)` → 0–100

| Type | Rule |
|------|------|
| check | 100 if value > 0, else 0 |
| numeric | linear map min→0%, max→100% (clamp) |
| rest | exclude from aggregates |
| not logged | 0% for day score, or exclude per product rule (document: **exclude** from category average) |

### 4.3 `dayScore(habits, logsForDay)` → 0–100

Average of habit scores for habits not on rest and not paused.

### 4.4 `categoryScore(category, habits, logs, date)` → 0–100

Filter habits by `category`; same average as `dayScore` scoped.

### 4.5 `categorySeries(category, habits, logs, dates[])` → number[]

Map each date through `categoryScore`.

### 4.6 `streak(habitId, logs)` → current, best

Match existing app: consecutive days meeting threshold (define in tests).

### 4.7 `goalProgress(goal, links, logs, periodStart, periodEnd)` → 0–100

Weighted sum: `sum(weight * habitScore) / sum(weight)` for linked habits.

### 4.8 Unit tests (required before Phase 3)

| Test case | Expected |
|-----------|----------|
| check completed | 100 |
| check empty | 0 |
| numeric mid range | ~50 |
| one rest habit | excluded from category avg |
| goal 50/50 two habits | correct blend |
| empty category | 0 or null (document) |

**One-time task:** Port 3–5 real days from your current `index.html` localStorage export into fixture JSON; assert scores match old app within 1%.

---

## 5. Category slugs

Centralize in `packages/core` or `apps/web/src/lib/categories.ts`:

```typescript
export function categoryToSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function slugToCategory(slug: string, known: string[]): string | null {
  return known.find((c) => categoryToSlug(c) === slug) ?? null;
}
```

Store **display name** in DB; derive slug at runtime. Sidebar lists unique categories from user's habits.

---

## 6. React Router map (stub pages)

Implement **empty** pages with correct titles and back links:

| Path | Component file |
|------|----------------|
| `/auth` | `AuthPage.tsx` |
| `/log` | `LogPage.tsx` |
| `/log/:date` | same |
| `/habit/:id` | `HabitDetailPage.tsx` |
| `/categories` | `CategoriesIndexPage.tsx` |
| `/categories/:slug` | `CategoryDetailPage.tsx` |
| `/insights` | `InsightsPage.tsx` |
| `/goals` | `GoalsListPage.tsx` |
| `/goals/new` | `GoalWizardPage.tsx` |
| `/goals/:id` | `GoalDetailPage.tsx` |
| `/profile` | `ProfilePage.tsx` |
| `/profile/notifications` | `NotificationsPage.tsx` |

### Layout components

- `MobileTabLayout` — bottom 4 tabs
- `DesktopSidebarLayout` — sidebar + outlet
- `useMediaQuery('(min-width: 1024px)')` to switch

### Protected route wrapper

```typescript
// if !session → Navigate to /auth
```

---

## 7. Supabase client (`lib/supabase.ts`)

```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

`.env.local` (never commit):

```
VITE_SUPABASE_URL=https://evvlrdvoynocriyjkbek.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

---

## 8. Data hooks (minimal)

| Hook | Responsibility |
|------|----------------|
| `useSession` | auth state |
| `useHabits` | fetch + optimistic update |
| `useLogs(range)` | fetch logs for date range |
| `useSettings` | user_settings row |
| `useSync` | debounced upsert on change |

**Sync strategy (match current app):**

1. Load cloud on login; merge with local IndexedDB cache (optional in Phase 2, required Phase 3)
2. On edit: update local state → debounce 800ms → upsert Supabase
3. Conflict: **last-write-wins** per habit id (document)

---

## 9. Design system implementation

Create `styles/tokens.css` from Phase 1 Section 13.

Build primitives:

- `Button`, `IconButton`, `Card`, `ScoreRing`, `SegmentedControl`, `Switch`, `Modal` (portal)

Storybook optional; at minimum one `DevStyleguide` route behind flag.

---

## 10. IndexedDB (optional in Phase 2)

Schema suggestion:

- `habits`, `logs`, `settings`, `pending_writes`

Enables offline read in Phase 3. If skipped, use React Query cache only.

---

## 11. Tasks checklist (ordered)

### Week 1

1. ☐ Init monorepo + Vite React TS
2. ☐ Add `packages/core` + vitest + first scoring tests
3. ☐ Create Supabase tables migration `0001_base.sql`
4. ☐ Apply RLS policies migration `0002_rls.sql`
5. ☐ Auth UI + Google provider in Supabase dashboard

### Week 2

6. ☐ Implement `AppShell` + tokens
7. ☐ Router + all stub routes
8. ☐ `useHabits` load/save
9. ☐ `useLogs` load/save
10. ☐ Placeholder `LogPage` showing raw habit list + scores from core

### Week 3

11. ☐ Category slug helpers + `/categories` stub listing categories
12. ☐ `/categories/:slug` stub showing `categoryScore` for today only
13. ☐ Export/import types from core to web
14. ☐ CI: `npm run test && npm run build`

---

## 12. Acceptance criteria (gate to Phase 3)

| # | Criterion |
|---|-----------|
| AC1 | `npm run dev` opens app at localhost:8787 |
| AC2 | Sign up → see empty Today with FAB |
| AC3 | Add habit via API/hook → appears in Supabase dashboard |
| AC4 | Log one check habit → `habit_logs` row created |
| AC5 | `/categories/health` shows numeric score (even if UI plain) |
| AC6 | `npm run test` — core package ≥ 15 tests green |
| AC7 | No habit score calculated inside React components (grep check) |

---

## 13. Migration from monolithic `index.html`

When rebuilding, you will **not** port line-by-line. Use this mapping:

| Old concept | New home |
|-------------|----------|
| `state.habits` | `useHabits` + Supabase |
| `state.logs` / day values | `habit_logs` table |
| `render()` mega function | per-route components + React state |
| `renderAnalysis()` | `InsightsPage` + `HabitDetailPage` |
| `notificationSettings` | `user_settings.notification_prefs` |
| `openHabitAnalysis` | `navigate(/habit/:id)` |

**One-time task:** Export one real user's data from old app (Profile → Export) and write a script `scripts/import-legacy-json.ts` to seed new DB (Phase 3).

---

## 14. Phase 2 → Phase 3 handoff

Deliver:

1. Green CI (test + build)
2. ERD diagram or linked migration files
3. `packages/core` API doc (JSDoc on exports)
4. List of intentional gaps (charts, notifications UI, goals UI)

**Do not implement notification scheduler or Cloudflare deploy until Phase 4.**
