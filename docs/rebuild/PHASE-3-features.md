# Phase 3 — Features (Full Product on Localhost)

**Duration estimate:** 4–6 weeks (solo)  
**Prerequisite:** Phase 2 acceptance criteria AC1–AC7  
**Goal:** Feature-complete Mottazen Habits locally — parity with current `index.html` plus **category pages** and **goals**.

---

## Outcomes (definition of done)

- [ ] Today view: hero score, category chips, habit cards, notes, calendar, FAB
- [ ] Category index + **category detail** with range charts and habit breakdown
- [ ] Habit detail with streaks, activity calendar, range tabs
- [ ] Insights: overview radar, heatmap, habits list
- [ ] Goals: create, weight habits, progress on Today chips
- [ ] Notifications coach page + client scheduler (foreground)
- [ ] Profile: display settings, export/import
- [ ] Tap habit name → `/habit/:id` (never broken by inline handlers)
- [ ] Offline-friendly read; sync on reconnect

---

## One-time milestones (Phase 3)

| ID | Milestone | Done |
|----|-----------|------|
| M3.1 | Today / Log screen matches Phase 1 wireframe | ☐ |
| M3.2 | Category detail page live (all blocks A–D) | ☐ |
| M3.3 | Habit detail + navigation from cards | ☐ |
| M3.4 | Insights parity (overview + heatmap) | ☐ |
| M3.5 | Goals CRUD + weighted progress | ☐ |
| M3.6 | Notifications coach + prefs sync | ☐ |
| M3.7 | Legacy JSON import script tested | ☐ |
| M3.8 | Mobile + desktop layouts QA'd | ☐ |

---

## Build order (recommended sprints)

### Sprint 1 — Today (P0)

### Sprint 2 — Categories (P0) ← differentiator

### Sprint 3 — Habit detail + Insights (P0)

### Sprint 4 — Goals (P1)

### Sprint 5 — Notifications coach (P0)

### Sprint 6 — Polish, import/export, edge cases (P1)

---

## 1. Today page (`/log`)

### 1.1 Components to build

| Component | Spec reference |
|-----------|----------------|
| `LogHeader` | date picker, profile shortcut |
| `HeroScore` | `dayScore` from core |
| `GoalChipsRow` | Sprint 4 — hide if no goals |
| `CategoryChipsRow` | tap → `/categories/:slug` |
| `HabitListGrouped` | group by category |
| `HabitCard` | Phase 1 §3 |
| `DayNotes` | textarea, debounced save |
| `AddHabitFAB` | opens modal |

### 1.2 Habit card interactions

```tsx
// Title MUST be a router Link — not div+onClick only
<Link to={`/habit/${habit.id}`} className="habit-title-tap">
  {habit.name}
</Link>
```

| Action | Implementation |
|--------|----------------|
| Toggle check | optimistic `useLogs.setValue` |
| Numeric +/- | step by `habit.step` |
| Rest | `isRest` on log row |
| Long press (mobile) | rest toggle |
| Drag reorder | `@dnd-kit/core` when edit mode on |

### 1.3 Hero copy

Map `dayScore` to strings from Phase 1 copy deck.

### 1.4 Date navigation

- Header shows selected date
- Changing date loads logs for that day
- Optional URL `/log/2026-05-27`

### 1.5 Tasks

- [ ] Implement `HabitCard` variants (check, numeric, rest, skipped)
- [ ] Wire `CategoryChipsRow` with live `categoryScore` for today
- [ ] Calendar modal (month grid, logged dots)
- [ ] Undo toast on delete habit (5s)

---

## 2. Category index (`/categories`)

### 2.1 Data

```typescript
const categories = unique(habits.map(h => h.category));
const rows = categories.map(cat => ({
  slug: categoryToSlug(cat),
  name: cat,
  todayPercent: categoryScore(cat, habits, logs, today),
  avg7: average(categorySeries(cat, habits, logs, last7Days)),
  habitCount: habits.filter(h => h.category === cat && !h.paused).length,
}));
```

### 2.2 UI

- Sort by lowest 7-day avg first (surface weak areas)
- Mini sparkline: SVG polyline from `categorySeries` last 7 days
- Coach hint at bottom: lowest category name

### 2.3 Tasks

- [ ] `CategoryRow` component
- [ ] Empty state: no habits at all
- [ ] Desktop: two-column grid of rows

---

## 3. Category detail (`/categories/:slug`) — full build

This sprint implements Phase 1 Section 5 completely.

### 3.1 Page state

```typescript
const [range, setRange] = useState<"day"|"week"|"month"|"all">("week");
const [sort, setSort] = useState<"consistency"|"streak"|"name">("consistency");
```

Resolve category name from slug; 404 if unknown.

### 3.2 Block A — Hero

- `ScoreRing` with `categoryScore` for **selected end date** (usually today)
- Delta vs 7-day avg: `today - avg7`
- Stat tiles: 7-day avg, best day in range, active habits, log count

### 3.3 Block B — Activity calendar

Reuse `ActivityCalendar` component with prop `scope: { type: 'category', name }`.

**Day strength rules:**

| Level | Condition |
|-------|-----------|
| 0 | no logs in category |
| 1 | avg < 40% |
| 2 | 40–79% |
| 3 | ≥ 80% |
| rest | all active habits in category rest |

### 3.4 Block C — Habit breakdown

For each habit in category:

```typescript
const consistency = average(habitScoresOverRange(habit, logs, dates));
const { current } = streak(habit.id, logs);
```

Progress bar + link to `/habit/:id`.

Sort:

- consistency → desc %
- streak → desc current
- name → localeCompare

### 3.5 Block D — Daily bars

`BarChart7` / `BarChart30` from `categorySeries`.

### 3.6 Block E — Linked goals (Sprint 4)

Filter goals where any `goal_habits.habit_id` belongs to this category.

### 3.7 Block F — Quick actions

| Action | Phase |
|--------|-------|
| Add habit (category pre-filled) | P0 |
| Focus habit | P2 |
| Batch log | P2 |

### 3.8 Tasks

- [ ] `CategoryHero` + stat grid
- [ ] Range segmented control drives all blocks
- [ ] `ActivityCalendar` category scope
- [ ] `HabitBreakdownList` with sort
- [ ] `CategoryBarChart`
- [ ] Mobile back → `/categories` or `/log`

### 3.9 Acceptance

| Test | Pass |
|------|------|
| Change range updates bars and stats | ☐ |
| Tap habit row opens detail | ☐ |
| Category with 1 habit works | ☐ |
| All habits rest shows "Rest day" hero | ☐ |

---

## 4. Habit detail (`/habit/:id`)

### Sections

1. Back button (`useNavigate(-1)`)
2. Title + `Link` to `/categories/:slug`
3. Streak pills (current / best / 30d %)
4. `ActivityCalendar` scope habit
5. Range tabs → table or chart of last N days
6. Edit button → modal (same fields as add)
7. Delete → confirm → remove from DB + redirect `/log`

### Tasks

- [ ] Port streak logic from core only
- [ ] Show numeric history as values + %
- [ ] Flash highlight optional when navigated from Today

---

## 5. Insights (`/insights`)

### 5.1 Overview tab

- **Radar chart:** one axis per category (avg score last 7 days)
- **7-day bars:** overall `dayScore` per day
- **Best habit:** highest consistency 30d

### 5.2 Heatmap tab

- Global activity grid (all habits)
- Click day → jump `/log/:date`

### 5.3 Habits tab

- Sorted list with consistency %; tap → habit detail

### 5.4 Tasks

- [ ] `RadarChart` (SVG or lightweight lib)
- [ ] Link "Browse by category" → `/categories`
- [ ] Match colors to category dots on habits

---

## 6. Goals (`/goals`)

### 6.1 Goals list

Card: name, ring `goalProgress`, period badge, habit count.

### 6.2 Create wizard

1. Name, period (`daily` | `weekly`), target %
2. Habit picker with weight sliders (normalize to 100% button)
3. Optional: enable goal reminder in coach settings

### 6.3 Goal detail

- Edit weights inline
- Toggle `required` per habit (must hit 100% for that habit to count fully — optional rule, document in core)
- History: last 7 periods met/missed

### 6.4 Today integration

`GoalChipsRow` under hero — horizontal scroll, tap → `/goals/:id`.

### 6.5 Core function

```typescript
goalProgress(goal, links, logs, periodStart, periodEnd): number
```

### 6.6 Tasks

- [ ] CRUD Supabase `goals` + `goal_habits`
- [ ] Weight editor UI
- [ ] Today chips
- [ ] Category detail Block E

---

## 7. Notifications coach (`/profile/notifications`)

Port behavior from current `index.html` notifications panel.

### 7.1 Settings model

```typescript
interface NotificationSettings {
  enabled: boolean;
  quietHours: { start: string; end: string };
  maxPerDay: number;
  tone: "gentle" | "direct";
  vacationMode: boolean;
  dailyCheckIn: { enabled: boolean; time: string };
  smartMissed: { enabled: boolean; delayMinutes: number };
  motivation: { enabled: boolean };
  recovery: { enabled: boolean };
  lowScore: { enabled: boolean; threshold: number };
  reflection: { enabled: boolean; time: string };
  categoryRules: Array<{ category: string; enabled: boolean; time?: string }>;
}
```

Store in `user_settings.notification_prefs.settings`.

Per-habit: `habits.notify` jsonb — times, days, messages, missed alerts.

### 7.2 Client scheduler (foreground)

`useNotificationScheduler` hook:

- `setInterval` every 60s while app open
- `checkNotificationReminders()` — mirror current logic
- Respect quiet hours, vacation, max/day
- `coachNotify(title, body, tag)` → Web Notifications API if permission granted

### 7.3 Motivation on log

After `setValue`, if enabled call `checkMotivationOnLog(habit, newValue)`.

### 7.4 Tasks

- [ ] Full page layout with sticky Save
- [ ] Per-habit expandable rows
- [ ] Sync to Supabase on Save
- [ ] Deep link from profile row
- [ ] iOS note in UI: Add to Home Screen

**Background push** is Phase 4 (Edge Functions).

---

## 8. Profile & data

| Feature | Notes |
|---------|-------|
| Compact view | smaller cards |
| Show edit buttons | drag handles |
| Theme | dark / light / system |
| Export JSON | all habits + logs + settings |
| Export CSV | flat log table |
| Import | validate schema, merge by id |
| Sign out | clear local cache |

### Tasks

- [ ] Export downloadable blob
- [ ] Import with preview + confirm
- [ ] `scripts/import-legacy-json.ts` for old app format

---

## 9. Add / Edit habit modal

Fields:

- Name, category (autocomplete existing), type, color
- Numeric: min, max, step
- Reminder subsection → writes `habit.notify` + `remind_at`
- Delete habit (edit only)

Category autocomplete should suggest existing categories; allow new.

---

## 10. Edit mode & FAB

- Profile toggle "Show edit buttons"
- Edit mode: drag handles, delete on card (optional — prefer delete only in modal per your preference)
- FAB bottom-right; safe-area padding for iPhone

---

## 11. Charts & performance

| Concern | Approach |
|---------|----------|
| Re-renders | memo `HabitCard`, split context |
| Large log history | fetch logs by range per page |
| Charts | pure SVG components, no heavy chart lib unless needed |

Precompute series in `useMemo` calling `@mottazen/core`.

---

## 12. Testing checklist (manual)

### Navigation

- [ ] Habit name → detail (10 taps in a row)
- [ ] Category chip → category detail
- [ ] Back from detail returns to prior scroll position (optional)

### Logging

- [ ] Check habit toggles score ring
- [ ] Numeric respects min/max
- [ ] Rest day excludes from category %
- [ ] Undo delete works

### Categories

- [ ] Two categories with different scores
- [ ] Week range matches manual calculation
- [ ] Sort by streak works

### Goals

- [ ] 50/50 weights between two habits
- [ ] Required habit fails goal when missed

### Notifications

- [ ] Quiet hours suppress
- [ ] Vacation mode suppress
- [ ] Max per day cap

### Responsive

- [ ] iPhone SE width
- [ ] Desktop 1440px sidebar

---

## 13. Parity matrix (old app → new)

| Feature | Old | New route |
|---------|-----|-----------|
| Log | `activeTab=log` | `/log` |
| Analysis overview | analysis tab | `/insights` |
| Analysis habits | habits tab | `/insights` + `/habit/:id` |
| Heatmap | analysis | `/insights` heatmap |
| Profile | profile panel | `/profile` |
| Notifications | `#notificationsPanel` | `/profile/notifications` |
| Category progress | **missing** | `/categories/:slug` |
| Goals | partial / future | `/goals` |

---

## 14. Acceptance criteria (gate to Phase 4)

| # | Criterion |
|---|-----------|
| AC1 | You can use the app daily for 3 days without switching back to old `index.html` |
| AC2 | Category page shows correct % vs hand-calculated spreadsheet |
| AC3 | Habit detail streak matches old app for 3 habits |
| AC4 | Export from new app → import into empty DB works |
| AC5 | Notifications fire in foreground with permission granted |
| AC6 | Lighthouse PWA audit ≥ 80 (local build) |
| AC7 | No `console.error` on happy path navigation |

---

## 15. Phase 3 → Phase 4 handoff

Deliver:

1. Production build `npm run build` artifact
2. List of env vars needed
3. Known P2 deferrals (batch log, focus habit)
4. Screenshots for marketing / TestFlight-style PWA instructions

**Phase 4 starts only after AC1 (3-day dogfood) is true.**
