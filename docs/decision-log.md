# Decision log

One paragraph per decision. Add a line when the Execution Roadmap says to defer, cut, or choose between options.

---

## 2026-06-07 — Activity model naming (Prime Directive)

**Decision:** User-facing vocabulary is Activity · Life area · Target · Task · Project. Internal types stay `Habit`, `Goal`, `category` to avoid a noisy refactor.

**Why:** `Activity-Model-Plan.md` locks the mental model for users while keeping sync/export/DB field names stable.

**Status:** Shipped (M5 UI pass). Routes remain `/habit`, `/goals`, `/categories`.

---

## 2026-06-07 — Snapshot `schemaVersion` (T1 / Prime Directive)

**Decision:** Every snapshot shape change bumps `CURRENT_SCHEMA_VERSION` in `local-data-store.ts` and adds a step in `runSchemaMigrations()`.

**Why:** Local-first means old exports and IndexedDB blobs must upgrade on read, not silently mis-parse.

**Status:** Shipped at version 1 (tasks + goal cadence fields).

---

## 2026-06-07 — Task lane placement (D-a)

**Decision:** Tasks live on Today (A1) in a dedicated lane, not a separate screen or per–life-area tab.

**Why:** Lowest friction for one-offs; keeps the daily ledger focused on activities.

**Status:** Shipped (T2).

---

## 2026-06-07 — Abstinence / quit activities (D-b)

**Decision:** Ship `goalDirection: "avoid"` on `Habit` plus abstinence preset copy and comeback framing.

**Why:** Quit-tracking needs inverted semantics without polluting the score model.

**Status:** Shipped (T3 + G1).

---

## 2026-06-07 — Score isolation for Tasks (Prime Directive)

**Decision:** `Task` lives in `snapshot.tasks[]`, never in `DayLog`. Scoring APIs accept only `Habit[]` + `DayLog[]`.

**Why:** Protect the daily ledger and prevent task check-offs from inflating day / life-area scores.

**Status:** Enforced in types + `prime-directives.test.ts`.

---

## 2026-06-07 — Score decomposability guard (M6)

**Decision:** Expose `dayScoreBreakdown`, `categoryScoreBreakdown`, `reconstructDayScore`, `reconstructCategoryScore`, and `habitGoalProgressPct` in `@mottazen/core`. UI must not compute progress percentages inline.

**Why:** Keeps scores derivable from parts for future cross–life-area channels.

**Status:** Shipped with guard tests.

---

## 2026-06-07 — Scope triage (cheap hedges)

**Decisions locked in:**

- **Local-first boundary** — private snapshot is source of truth; social/AI are opt-in derived projections.
- **Social output-only** — sharing publishes aggregates/images, never mutates the snapshot with social fields.
- **Edges over single-parent** — `GoalHabitLink` precedent for many-to-many.
- **Wellbeing guardrails** — no shaming copy; streaks freeze/comeback, never punish-reset.

**POSTPONE:** G6 pods, G7 co-check-ins, full Project (P2), Life-OS heavy set (P6).

**CUT:** C1 wishlist/finance, C2 ROI engine as core, C3 addiction mechanics, C4 server-authoritative migration, C5 premature platform machinery.
