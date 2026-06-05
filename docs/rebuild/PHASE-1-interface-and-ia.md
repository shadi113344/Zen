# Phase 1 — Interface & Information Architecture

**Duration estimate:** 1–2 weeks (solo)  
**Goal:** Lock every screen, route, and interaction before writing production code.  
**Deliverable:** Route map + wireframes + design tokens + component list + copy deck.

---

## Outcomes (definition of done)

- [x] Every primary route named and described (mobile + desktop behavior)
- [x] Category pages fully specified (not only grouped lists on Log)
- [x] Goals UI specified (even if built in Phase 3)
- [x] Navigation model chosen (bottom tabs vs sidebar vs hybrid)
- [x] Design tokens documented (colors, type, spacing, dark/light)
- [ ] Empty, loading, error, and offline states per route
- [x] Accessibility baseline (touch targets, contrast, focus)

---

## One-time milestones (Phase 1)

| ID | Milestone | Done |
|----|-----------|------|
| M1.1 | Write product principles (3–5 bullets) | ☑ |
| M1.2 | Approve route map (Section 2) | ☑ |
| M1.3 | Wireframe all P0 screens (low-fi OK) | ☑ |
| M1.4 | Define design tokens (Section 5) | ☑ |
| M1.5 | Category page spec signed off (Section 4) | ☑ |
| M1.6 | Goals UX spec signed off (Section 6) | ☑ |
| M1.7 | Notification coach IA signed off (Section 8) | ☑ |
| M1.8 | Copy deck for auth, empty states, toasts | ☑ |

---

## 1. Product principles

Use these to resolve design arguments:

1. **Log first** — Opening the app should make today’s logging possible in under 10 seconds.
2. **Honest math** — Scores and streaks use one domain ruleset; UI never invents its own percentages.
3. **Coach, not alarm** — Notifications support, motivate, and recover; never shame.
4. **Depth on demand** — Summary at top level; habit detail, category detail, and goal detail on drill-down.
5. **Calm premium** — Dark-first, generous whitespace, minimal chrome; no gamification clutter.

---

## 2. Route map (canonical)

### Mobile (< 1024px): primary navigation

Use a **4-tab bottom bar** (thumb-friendly):

| Tab | Route | Label |
|-----|-------|-------|
| Today | `/` or `/log` | Today |
| Insights | `/insights` | Insights |
| Goals | `/goals` | Goals |
| You | `/profile` | You |

**Category drill-down** is not a tab — it lives under Today and Insights as push routes.

### Desktop (≥ 1024px): persistent layout

```
┌──────────────────────────────────────────────────────────────┐
│ Top bar: brand · date picker · streak summary · profile      │
├────────────────────┬─────────────────────────────────────────┤
│ Sidebar (240px)    │ Main content (route outlet)            │
│ · Today            │                                        │
│ · Insights         │                                        │
│ · Goals            │                                        │
│ · Categories ▾     │  ← expandable list of category names   │
│   · Health         │                                        │
│   · Mind           │                                        │
│ · Profile          │                                        │
└────────────────────┴────────────────────────────────────────┘
```

On desktop, **Insights** can show a two-column layout: charts left, selected category mini-panel right (optional).

### Full route table

| Route | Screen name | Priority |
|-------|-------------|----------|
| `/auth` | Sign in / sign up | P0 |
| `/log` | Today (default) | P0 |
| `/log/:date` | Today (historical date) | P1 |
| `/habit/:id` | Habit detail (analysis for one habit) | P0 |
| `/categories` | Category index (all categories overview) | P0 |
| `/categories/:slug` | **Category detail** (hero progress page) | P0 |
| `/insights` | Insights hub (overview, heatmap, balance) | P0 |
| `/insights/heatmap` | Full heatmap (optional sub-route) | P2 |
| `/goals` | Goals list | P1 |
| `/goals/new` | Create goal | P1 |
| `/goals/:id` | Goal detail + weighted habits editor | P1 |
| `/profile` | Profile & settings hub | P0 |
| `/profile/notifications` | Notification coach (full page) | P0 |
| `/profile/data` | Import / export | P1 |
| `/profile/display` | Compact view, edit mode, theme | P1 |

**Slug:** URL-safe category name (`health`, `mind`, `movement`) mapped to display name.

---

## 3. Screen: Today (`/log`)

### Purpose
Fast daily logging; see today’s score and category snapshot.

### Layout (mobile)

```
┌─────────────────────────────────────┐
│ User · Theme · Profile              │
│ Today · Wed 28 May        [Today ▾] │  ← opens calendar
├─────────────────────────────────────┤
│ ┌─────────┐  Hero score ring 72%    │
│ │  ring   │  "Solid momentum."     │
│ └─────────┘                         │
├─────────────────────────────────────┤
│ Today’s goals (horizontal chips)    │  ← Phase 3; hide if none
│ [Morning stack 68%] [Health 80%]    │
├─────────────────────────────────────┤
│ Categories (horizontal scroll)      │
│ [Health 80%] [Mind 40%] [Work —]    │  ← tap → /categories/:slug
├─────────────────────────────────────┤
│ Habit cards (grouped by category)     │
│ ▼ Health                            │
│   [card] [card]                       │
│ ▼ Mind                              │
├─────────────────────────────────────┤
│ Notes for today                     │
├─────────────────────────────────────┤
│ [Today][Insights][Goals][You]       │
│                            [+] FAB  │
└─────────────────────────────────────┘
```

### Habit card (exact)

Each card is an `<article>` with:

| Zone | Content | Interaction |
|------|---------|-------------|
| Left | Drag handle (edit mode only) | Reorder |
| Center | **Tappable title block** (name + sub + meta) | → `/habit/:id` |
| Right | Rest button, checkbox or numeric stepper | Log value |

**Title block** must include: colored dot, name (underline = link), optional icons (reminder, streak pill, rest pill).

**Types:**

- **Checkbox:** subtext = "Completed" / "Not logged yet" / "Rest"
- **Numeric:** subtext = range info; value panel + minus/plus

### States

- Empty habits: CTA "Add your first habit" + FAB
- All rest day: muted hero copy
- 100% day: brief celebration (confetti optional, 1.5s)

### Desktop differences

- Habit grid: 2 columns `minmax(280px, 1fr)`
- Notes card below habits
- No bottom tab bar; sidebar active

---

## 4. Screen: Category index (`/categories`)

### Purpose
Bird’s-eye view of all categories — compare balance, find weak areas.

### Layout

```
┌─────────────────────────────────────┐
│ ← Today          Categories         │
├─────────────────────────────────────┤
│ This week · avg 64%                   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ● Health          82%    ›      │ │
│ │ 5 habits · 12-day avg           │ │
│ │ [mini 7-day sparkline]          │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ● Mind            41%    ›      │ │
│ │ 3 habits · streak risk          │ │
│ └─────────────────────────────────┘ │
│ ...                                 │
├─────────────────────────────────────┤
│ Suggest: "Movement is lowest —     │
│ tap to plan one win today."        │
└─────────────────────────────────────┘
```

### Row metrics (per category)

| Metric | Description |
|--------|-------------|
| Today % | Average habit score today (rest days excluded) |
| 7-day avg | Rolling |
| Habit count | Active / paused breakdown |
| Best habit | Highest consistency in category (30d) |
| Weakest habit | Lowest (for coach hint) |

Tap row → `/categories/:slug`.

---

## 5. Screen: Category detail (`/categories/:slug`) — **hero spec**

This is the page you asked for: **overall category progress from its habits and activities**.

### Purpose
Answer: "How am I doing in **Health** this week/month?" with habit-level breakdown and activity calendar **scoped to this category only**.

### Header

```
┌─────────────────────────────────────┐
│ ← Categories    Health        [···]  │  ··· = collapse habits, export
├─────────────────────────────────────┤
│ ● Health                            │
│ Category score today: 78%           │
│ ▲ +12% vs 7-day avg                 │
├─────────────────────────────────────┤
│ [Day][Week][Month][All]  range seg  │
├─────────────────────────────────────┤
```

### Block A — Category score ring + stats

Same visual language as app hero, but label = category name.

| Stat tile | Example |
|-----------|---------|
| 7-day avg | 71% |
| Best day (range) | Tue 94% |
| Active habits | 5 of 6 |
| Total logs (range) | 23 |

### Block B — Category activity calendar

- GitHub-style grid OR dot strip (match Insights style)
- **Only days where at least one habit in this category was logged**
- Legend: empty / partial / strong / rest-heavy day

### Block C — Habit breakdown (ranked list)

```
Habits in Health
────────────────────────────────
Creatine        ████████░░  80%   streak 12  ›
Morning sun     ██████░░░░  60%   streak 4   ›
Stretch         ███░░░░░░░  30%   at risk    ›
```

Each row: progress bar = consistency in selected range; tap → `/habit/:id`.

Sort options (segment): **Consistency** | **Streak** | **A–Z**

### Block D — Daily bars (7/30 days)

Bar chart: category score per day (computed from habit logs in category only).

### Block E — Linked goals (Phase 3)

If any goal includes habits from this category:

```
Linked goals
────────────────────────────────
Morning stack     68% toward target  ›
```

### Block F — Quick actions

| Action | Behavior |
|--------|----------|
| Log all unchecked | Batch UI to mark simple checks (optional P2) |
| Focus habit | Pin one habit to top of Today view (local pref) |
| Add habit in category | Opens add modal with category pre-filled |

### Empty category

"No habits in Health yet" + button Add habit.

### Category score formula (for designers; implemented in Phase 2)

Document for devs:

```
categoryScore(day, category) =
  average( habitScore(h, value(h, day)) for h in habits where h.category = category and not rest )
  → 0–100%
```

Rest days: excluded from numerator and denominator unless all habits rest → show "Rest day".

---

## 6. Screen: Habit detail (`/habit/:id`)

### Purpose
Deep dive for one habit (replaces old "tap name → analysis panel only").

### Sections

1. Back → previous route
2. Name, category chip (tap → category detail), type badge
3. Streak: current, best, 30-day consistency
4. Activity calendar (habit-only)
5. Range: Day / Week / Month / All
6. Notes mention count (optional P2)
7. Edit habit (pencil) · Delete (profile edit mode or here)

---

## 7. Screen: Insights hub (`/insights`)

### Sub-views (tabs inside page)

| Tab | Content |
|-----|---------|
| Overview | Radar chart (habit balance by category), 7-day window bars, best habit |
| Heatmap | Overall daily activity grid |
| Habits | List like old analysis habits tab → drill `/habit/:id` |

### Category entry from Insights

Card: "Browse by category" → `/categories`.

---

## 8. Screen: Goals (`/goals`, `/goals/:id`)

### Goals list

- Card per goal: name, progress ring, period (Daily/Weekly), habit count
- FAB: New goal

### Goal detail

| Section | Content |
|---------|---------|
| Header | Name, progress %, period |
| Weighted habits | Table: habit · weight · contribution today · required toggle |
| Add habit to goal | Search picker |
| History | Last 7 periods met / missed |

### Create goal wizard (3 steps)

1. Name + period (daily/weekly) + target (e.g. 80%)
2. Pick habits + assign weights (must sum to 100 or use points mode)
3. Notification preferences for this goal (optional)

---

## 9. Screen: Profile (`/profile`)

### Rows

| Group | Items |
|-------|-------|
| Account | Avatar, name, email |
| Display | Compact view, show edit buttons, dark mode |
| Coach | **Notifications** → `/profile/notifications` |
| Data | Export JSON/CSV, import |
| Sign out | |

---

## 10. Screen: Notifications (`/profile/notifications`)

Full-page coach (you already prototyped). Keep sections:

1. General (master, quiet hours, max/day, tone, vacation)
2. Habit reminders (expandable per habit)
3. Smart missed
4. Advanced: Motivation, Recovery, Low score, Reflection, Category rules

Mobile: sticky Save at bottom.  
Desktop: max-width 640px centered.

---

## 11. Auth (`/auth`)

- Email/password + Google OAuth
- iOS note: Add to Home Screen for reliable notifications
- Minimal branding, match app card style

---

## 12. Component inventory (build in Phase 2–3)

| Component | Variants |
|-----------|----------|
| `AppShell` | mobile tabs / desktop sidebar |
| `ScoreRing` | sm / md / lg; with label |
| `HabitCard` | check / numeric / skipped / has-progress |
| `CategoryChip` | scrollable row |
| `CategoryRow` | index list item |
| `CategoryHero` | detail header + stats grid |
| `ActivityCalendar` | habit / category / global scope |
| `BarChart7` | insights |
| `RadarChart` | overview |
| `GoalCard` | list |
| `WeightEditor` | sliders summing to 100 |
| `SegmentedControl` | range, analysis tab |
| `ProfileToggle` | switch |
| `Modal` | add/edit habit, confirm, calendar |
| `Toast` / `UndoToast` | |
| `EmptyState` | per route |
| `FAB` | add habit |

---

## 13. Design tokens (starting point)

### Color (dark mode default)

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#0a0f1a` | Page |
| `--bg-grad-top` | `#111827` | Gradient top |
| `--card` | `#151b28` | Cards |
| `--card-raised` | `#1a2234` | Inputs |
| `--line` | `#2a3548` | Borders |
| `--text` | `#eaf3ff` | Primary |
| `--muted` | `#8ea6c8` | Secondary |
| `--accent` | `#3b82f6` | Actions |
| `--green` | `#22c55e` | Success / progress |
| `--orange` | `#f97316` | Streak / warn |

Light mode: invert backgrounds; keep green/orange hue.

### Typography

- Font: system UI (`-apple-system`, `Segoe UI`, sans-serif)
- H1 (Today): 32–40px, weight 800
- Card title: 17px, weight 850
- Sub: 12px, weight 750, muted

### Spacing & touch

- Min tap target: 44×44px
- Card radius: 22px (16px compact)
- Page padding: 16px mobile, 32px desktop

---

## 14. Interaction rules (exact)

| Action | Rule |
|--------|------|
| Tap habit name | Navigate `/habit/:id` |
| Tap category chip on Today | Navigate `/categories/:slug` |
| Long-press habit card | Toggle rest day (mobile) |
| Drag handle | Reorder (edit mode on) |
| Date change | Updates log view + notes; URL `/log/:date` optional |
| Pull to refresh | Re-sync Supabase (P1) |

---

## 15. Copy deck (starter)

| Context | Copy |
|---------|------|
| Hero 0% | Clean start. |
| Hero low | Building momentum. |
| Hero mid | Solid day. |
| Hero high | Strong day. |
| Hero 100% | Perfect day. |
| Rest | Rest day |
| Notification tone gentle | "When you're ready…" |
| Recovery | "No stress. One small action today is enough." |

---

## 16. Wireframe checklist (one-time)

Export PNG or Figma for each:

- [x] `/log` — empty, partial, full
- [x] `/categories` — 3+ categories
- [x] `/categories/health` — full spec (Section 5)
- [x] `/habit/:id`
- [x] `/insights` — overview + heatmap
- [x] `/goals` + `/goals/:id`
- [x] `/profile/notifications`
- [x] Desktop sidebar layout

---

## 17. Phase 1 → Phase 2 handoff

Deliver to Phase 2:

1. Final route map (Section 2)
2. Category score definition (Section 5)
3. Token CSS variables (Section 13)
4. Component list (Section 12)
5. Priority tags (P0/P1/P2) per route

**Do not start Supabase migrations until M1.2 and M1.5 are checked.**

---

## Appendix: Why category pages matter

Today, categories are **group headers** on the log screen only. That hides:

- Which category drives a bad week
- Category-level streaks and calendars
- Comparison across categories

A dedicated `/categories/:slug` page makes the product scalable for **goals** (weighted subsets of habits) because goals often map to one or more categories — the same aggregate math powers both.
