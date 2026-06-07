# Activity Model Plan for future implementation

> **Status:** Planning — not yet implemented
> **Origin:** Analysis of a pen-and-paper goals list vs. what Zen models today.
> **Principle (carried from Viral-Plan):** keep the private daily ledger intact; add new object types around it rather than overloading habits.
> **Decisions locked:** scope triage + product naming — see [Scope decision](#scope-decision-triage) and [Naming / vocabulary](#naming--vocabulary-decided) below.

---

## Why this doc

A handwritten "Goals & Priorities" sheet was compared against Zen's real data model. The paper naturally mixes several **object types** and **time horizons** that the app currently collapses into a single daily-habit ledger. This doc records the gaps and sketches how the product could accommodate them.

The headline finding: **what the user calls a "goal list" is actually four different object types** — Habits, Tasks, Outcomes/Projects, and Wishlist — spread across multiple time horizons (daily → weekly → monthly → event → someday). Zen models the first robustly and the rest awkwardly or not at all.

---

## Today's model (ground truth)

- **Activities (habits)** — input type is one of `check` | `numeric` | `milestone` | `onetime` (`packages/core/src/types.ts`). Each has **exactly one `category`**, optional `why`, reminder, `paused`, and for numeric/milestone: `min`/`max`/`step` + `progressScoring` (`"scale"` vs `"any"`).
- **Daily ledger** — every activity is a per-date `DayLog`. Streaks, day score, and rest days (`value = -1`, unlimited/manual) all assume a daily rhythm.
- **Goals** — two kinds only (`GoalFormModal.tsx`): **consistency** (`daysPerWeek` 1–7, Mon–Sun, over `startDate`→`endDate`) and **cumulative** (`targetTotal` + `unit` by a deadline). Goals link to habits (`GoalHabitLink`, weight + required) and roll into a category-group score.
- **Not modeled:** task list separate from habits, sub-tasks/projects, dependencies, scheduled future activation, multi-category membership, monthly cadence, exception/allowance budgets, money/price/wishlist, abstinence framing, "someday/backlog."

---

## The four object types the planning actually uses

| Object | User intent | Wants a streak? | Wants a score? | Today in Zen |
|---|---|---|---|---|
| **Habit** | recurring behavior | yes | yes | first-class ✅ |
| **Task** | do once, tick off | no | no | shoehorned into `onetime` ⚠️ |
| **Outcome / Project** | reach a result by a date, maybe via sub-steps | no (the process does) | progress %, not daily | partial via milestone / cumulative goal ⚠️ |
| **Wishlist / Savings** | acquire a thing | no | progress to price | not modeled ❌ |

---

## Gap analysis (paper item → true nature → fit)

| Paper item | Underlying nature | Fits today? | Friction |
|---|---|---|---|
| Gym 5d/wk, Supps 5d/wk, Meditate | cadence habit | ✅ check + consistency goal | none |
| Pray 5×/day | daily numeric count | ✅ numeric (max 5) | minor |
| Running weekly, Therapy | low-frequency cadence | ⚠️ consistency `daysPerWeek=1` | no biweekly/monthly cadence |
| Quit porn / Quit smoking | **abstinence streak** | ⚠️ check "stayed clean" | inverted framing; a slip = harsh break |
| Diet — 2 cheat days/month | **allowance/tolerance budget** | ❌ | rest days unlimited, not a budget; monthly window |
| Dr checkup, venous-leak check, unread emails, check timeschedule, book visa, packing | **one-off tasks** | ⚠️ `onetime` habit | task gets streak/score/daily framing it doesn't want |
| Finish NGC, PMP course | **outcome with deadline** | ⚠️ milestone / cumulative goal | no home for a pure outcome that isn't a daily habit |
| Finish Zen → deploy → launch; Explore YT/Amazon → "explore or kill" | **project w/ sub-steps + decision gate** | ❌ | no sub-tasks, ordering, or kill/decision state |
| Boxing after 6 months of gym | **conditional/sequenced unlock** | ❌ | no dependency or scheduled activation |
| Laptop (RTX 5070 Ti), DJI drone, DJI Osmo | **purchase / wishlist / savings** | ❌ | no price/savings/wishlist concept |
| Meet new people, explore new places, drift event, hiking | **aspiration / event / "do sometimes"** | ⚠️ check | daily-streak frame punishes irregular intent |

---

## Cross-cutting structural mismatches

1. **Everything is daily-centric.** The paper spans daily, weekly, **monthly**, event-based, one-off, and someday. Zen compresses all of it into a daily ledger, so non-daily items feel forced.
2. **Four object types collapsed into two.** Tasks get shoehorned into `onetime`; wishlist has no home.
3. **One activity, multiple categories.** Gym = *Health* **and** *Physical Care*; Running = *Mental Health* **and** *Physical Care*. A habit has a single `category`.
4. **No "someday/backlog" horizon.** `paused` + goal date ranges exist, but there's no first-class not-started/backlog state for "after 6 months" or "explore or kill."
5. **Outcome vs process is latent.** "Finish PMP" (outcome) sits beside "study X/wk" (process). Zen's goal←linked-habits is exactly this pattern but isn't framed that way, so users don't reach for it.

---

## Proposal A — Tasks lane (highest leverage by count)

A large share of the paper is **do-once tasks**. They don't want streaks, daily reminders, or category-score contribution. `onetime` habits technically hold them but pollute the activity grid and score.

**Proposed model (new, lightweight, outside the daily ledger):**

```ts
interface Task {
  id: string;
  title: string;
  category?: string;     // optional — reuse existing categories
  done: boolean;
  dueDate?: string;      // optional deadline
  note?: string;
  createdAt: string;
  completedAt?: string;
}
```

**UX options:**

| Option | Surface | Pros | Cons |
|---|---|---|---|
| **A1** | A "Tasks" sub-tab on Today (peer to the habit list) | clear separation; tasks never touch score | new surface to build |
| **A2** | A collapsible "Tasks" section per category card | keeps life-area grouping from the paper | more layout in already-dense cards |
| **A3** | A global checklist screen (own tab) | scales to many tasks; good for "inbox" | further from the daily habit loop |

**Recommendation:** A1 + optional category tag. Tasks stay visible in the daily flow (so they get done) but are explicitly **excluded from streaks and score**. Completed tasks can feed the "year in habits" recap as a count ("87 tasks done") without ever exposing titles.

**Key invariant:** tasks must **not** enter `dayScore`/category score — otherwise ticking a one-off task inflates the daily number.

---

## Proposal B — Expanded activity-type system

Three additive habit "flavors" the paper demands. All can sit on the existing daily `DayLog` with small additions.

### B1. Abstinence ("quit X")

An inverted habit: success = *did not do it today*; a slip should be **comeback-framed**, not a red broken streak (ties directly to `docs/Viral-Plan.md` → comeback design).

```ts
// extends Habit
goalDirection?: "do" | "avoid";   // default "do"
// "avoid": a logged day = "stayed clean"; streak = days since last slip
```

Cheap path today: a `check` habit + `progressScoring: "any"` + new copy. The honest version adds `goalDirection: "avoid"` and a "days since" display.

### B2. Allowance / tolerance budget

"2 cheat days/month" = a **budget of N exceptions per period**, distinct from unlimited rest days.

```ts
// extends Habit or its goal
allowance?: { count: number; period: "week" | "month" };
// streak/score tolerate up to `count` misses per period before penalty
```

### B3. Conditional / scheduled activation

"Boxing after 6 months of gym."

```ts
// extends Habit
activatesOn?: string;                 // ISO date — hidden/inactive until then
activatesAfter?: { habitId: string; streakDays: number }; // prerequisite
```

Cheap interim: `paused: true` + a `why` note. First-class version surfaces it in a backlog and auto-activates.

---

## Proposal C — Projects (outcome + sub-steps + decision gate)

For "Finish Zen → deploy → launch" and "Explore YT/Amazon → explore or kill."

```ts
interface Project {
  id: string;
  title: string;
  category?: string;
  status: "active" | "someday" | "done" | "killed";  // "killed" = decision gate
  steps: { id: string; title: string; done: boolean }[];
  linkedHabitIds?: string[];   // the process habits that drive it
  targetDate?: string;
}
```

This is the **outcome←process** structure made explicit: a Project is the outcome; linked habits are the daily process; sub-steps capture ordered work; `killed` honors "explore or kill."

---

## Proposal D — Wishlist / savings goals

Laptop, drone, Osmo aren't habits — they're **acquisition targets**, optionally with saved progress (reuses cumulative-goal math).

```ts
interface WishlistItem {
  id: string;
  title: string;
  price?: number;
  currency?: string;
  saved?: number;        // optional running total
  priority?: "low" | "med" | "high";
  url?: string;
  acquired?: boolean;
}
```

Privacy note: amounts stay in the private snapshot; any "I hit a savings goal" share is an aggregate artefact, never the item list (consistent with Viral-Plan's "share the output, not the content").

---

## Proposal E — Time-horizon redesign

The deepest mismatch. Two incremental moves before any big redesign:

1. **Monthly cadence** for consistency goals: extend `daysPerWeek` to a `cadence` of `{ count; period: "week" | "month" }`. Covers "running weekly," "2×/month," and the period side of allowances.
2. **Multi-category (tags)**: let an activity belong to >1 category, or add a `tags: string[]` field, so Gym counts in both *Health* and *Physical Care* without duplication.

Larger redesign (separate effort): a **horizon field** (`now` / `scheduled` / `someday`) shared by Habits, Tasks, Projects, and Wishlist, giving a single "backlog vs active" axis that matches how the paper mixes now-vs-later.

---

## Proposal F — Identity framing (tie-in)

The paper's category headers — Health, Work, Side Hustle, Mental/Physical health, Spiritual — read like **identities** ("a fit person," "a calm person," "a builder"). This independently validates the **Identity mode** idea in `docs/Viral-Plan.md`. Categories could optionally carry an identity label, and progress could be phrased as *"You showed up as a builder 4/5 days."*

---

## Phasing (leverage vs effort)

| Phase | Item | Leverage | Effort |
|---|---|---|---|
| 1 | Abstinence framing (B1, cheap path) + comeback | high | low |
| 1 | Outcome preset (surface milestone/cumulative as "Target") | medium | low |
| 2 | **Tasks lane (A)** | high | medium |
| 2 | Monthly cadence (E1) | medium | low–medium |
| 2 | Allowance budget (B2) | medium | medium |
| 2 | Multi-category / tags (E2) | medium | medium |
| 3 | Projects (C) | high | high |
| 3 | Wishlist / savings (D) | medium | high |
| 3 | Conditional activation (B3) | low | medium |
| 3 | Horizon field + backlog (E) | high | high |

---

## Scope decision (triage)

> Decided after reviewing the phasing table. **Guiding principle:** every new object type taxes the daily loop and the mental model. Zen's edge is *"open it, log today, feel your identity"* + the privacy moat — not becoming Notion / Todoist / a budgeting app.

**Essential — build (the spine):**
- **Task lane (A)** — tightly scoped: a checklist that never touches streaks or score. The #1 gap by count on the paper (checkups, emails, visa, packing).
- **Abstinence + comeback (B1)** — today's streak model punishes a slip with a red broken streak (shame → churn). Reframe to "days clean" + comeback. Highest emotional payoff on the sheet, low cost.

**Do soon — cheap, high ROI:**
- **Monthly cadence (E1)** — small change; unlocks "running weekly" / "2×/month"; prerequisite for allowance.
- **Outcome preset** — surface existing `milestone`/cumulative as a "Target"; near-zero cost, removes "where do I put 'finish PMP'?".

**Trim / defer — nice, not now:**
- **Allowance budget (B2)** — fake with rest days for now; revisit after monthly cadence, keep dead simple.
- **Multi-category / tags (E2)** — pain (Gym in two areas) is mild; complicates scoring; low urgency.
- **Project (C)** — only the *tiny* version (outcome + flat checklist + "kill" state). No dependencies / ordering / Gantt.

**Cut — off-mission ("too much"):**
- **Wishlist / savings (D)** — drags Zen toward shopping/finance (prices, currencies); dilutes the moat. Belongs in Notes / a wishlist app.
- **Conditional activation (B3)** — low leverage; just add the activity later or keep it `paused`.
- **Horizon / backlog redesign (E, full)** — a big rewrite of the spine; `paused` + Task + Project cover ~90% of "someday." Don't redesign speculatively.

**Net spine to protect:** Activities (daily) + a light Task lane (one-offs) + Targets (time-bound), plus the cheap abstinence / monthly / outcome wins.

---

## Naming / vocabulary (decided)

Locked to the **safe & clear** set. These are the canonical product terms going forward; the analysis sections above use legacy terms (habit / category / goal) and should be read with this mapping.

| Concept (internal / today) | Product term (decided) |
|---|---|
| Habit | **Activity** |
| Category | **Life Area** |
| Goal | **Target** |
| Task *(new)* | **Task** |
| Project *(new)* | **Project** |
| Wishlist | *(cut — see Scope decision)* |

Notes:
- "Activity" is already the in-app label (`Add Activity` modal), so this is mostly a formalization, not a rename.
- "Life Area" replaces the generic "Category" — reads warmer and matches the life-domain grouping on the paper.
- "Target" replaces "Goal" to shed OKR / corporate baggage and pair naturally with the Outcome preset.
- Identity phrasing ("show up as a fit person") stays a **motivational lens** layered over Life Areas, not a renamed concept (see `docs/Viral-Plan.md`).

---

## Design invariants (hold the line)

- **Don't break the daily ledger.** New object types (Tasks, Projects, Wishlist) live alongside `DayLog`, not inside it.
- **Protect the score.** Only true habits feed `dayScore`/category score. Tasks, project sub-steps, and wishlist progress must not inflate it.
- **Local-first & private.** Everything stays in the private snapshot; sharing is always a derived aggregate (see `docs/Viral-Plan.md`).
- **Additive, opt-in.** Existing habit-first users see no disruption; new types are introduced as presets/modes.

---

## Open questions / decisions

1. Should **Tasks** be global (own tab) or per-category (in the daily flow)?
2. Is **abstinence** a new `goalDirection` field, or just a preset over `check` + `progressScoring: "any"`?
3. Do **Projects** need ordered/dependent steps, or is a flat checklist enough for v1?
4. Should **Wishlist** track saved money, or just be a prioritized list (no finance features)?
5. Is **multi-category** done via true multi-membership or a separate `tags` field (less disruptive to scoring)?
6. Is the **horizon** redesign worth it, or do `paused` + Tasks + Projects cover "someday" well enough?
