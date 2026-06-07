# Life-OS Direction — Long-Run Considerations

> **Status:** Planning / foresight — not implementing anything here.
> **Origin:** Zen is the local-first restart of an earlier, more ambitious "Mottazen / Life Operating System" build (same `@mottazen/core` lineage). This doc records what to keep *reachable* if Zen ever walks back toward that vision — and the cheap hedges that keep those doors open without building them now.
> **See also:** `docs/Viral-Plan.md` (private vs published layer) · `docs/Activity-Model-Plan.md` (object types + naming).

---

## Context — where Zen came from, where the target points

The prior build (the "Life OS" guide + playbook + the `lifep` prototype) aimed at a **multi-dimensional life operating system**:

- A 4-level **hierarchy**: Domains → Goals → Activities → Daily Tasks.
- A **graph of relationships**: impact edges (gym → physical health 1.0, → mental health 0.2) and dependency edges (critical path), with multi-hop propagation + decay.
- **ROI / leverage prioritization** and a priority engine.
- **Multi-view over one model**: Dashboard, Timeline/Roadmap, Tactical Hierarchy, Mind Map, Daily, Analytics.
- A **transparent computation engine** — "tap any number to see why."
- **Self-discovery assessments** and a later **AI insights** layer.
- A server-authoritative **modular monolith** (Next + Supabase + Cloudflare, event bus, feature flags, registries).

Zen deliberately started from the *other* end: the **calm daily loop** + a **local-first, owner-only privacy moat**, kept simple. That was the right call — the old build got architecturally correct but felt rough and stalled. This doc is about not boxing ourselves out of the ambitious direction while staying simple.

---

## What the simpler start already got right

These are the exact places the old build hurt, where Zen is structurally ahead:

1. **Local-first SPA = the prototype's "feel" for free.** The old `lifep` post-mortem blamed route fragmentation, per-view server fetches, and "empty scaffold" onboarding. Zen is already the instant, in-memory, one-model app that *felt* better.
2. **`@mottazen/core` is the right home for the future compute engine.** The old guide's trust core — "never compute in the UI; keep math central; tap any number to see why" — is something Zen already does: core returns *breakdowns* (`goalConsistencyMeta`, `habitGoalProgressMeta`, …), not just totals.
3. **A many-to-many is already modeled as edges.** `GoalHabitLink { goalId, habitId, weight, required }` is the same shape the old build used for impact/dependency edges. The muscle exists.

---

## Tier 1 — cheap now, very expensive later (decide soon)

### 1. Version the local snapshot + add a migration hook  ← top priority

Today the live snapshot has only `savedAt`, no `schemaVersion`:

```13:25:apps/web/src/lib/local-data-store.ts
export interface LocalDataSnapshot {
  habits: Habit[];
  logs: DayLog[];
  ...
  savedAt: string;
}
```

`parseSnapshot` defensively defaults *added* fields, so additive growth is safe — but there is **no version field and no transform hook**, so any future *reshape* (e.g. `category` → `lifeAreaId`, splitting habits into Activities/Tasks, introducing nesting) has nowhere to live, and old snapshots already on users' devices will silently mis-parse. The `ExportBundle` / `legacy-import` paths are already `version: 1`; the **live snapshot should be too**, with a `migrate(old) → current` step run on read. This single field protects every future change proposed in both other docs.

### 2. Prefer edges over single-parent fields for anything that may go many-to-many

`Habit.category: string` is single-parent — fine today, but it's the exact fork behind the deferred multi-category decision. The Life-OS target adds a **tree** (Domains→Goals→sub-goals→Activities) **plus** a **graph** (impact/dependency edges) — all of which are just "more `GoalHabitLink`-style join rows." Don't bake single-parent assumptions into IDs or storage; when a relationship might become many-to-many, a link table is the future-proof default. *(Leave room — don't build the graph now.)*

### 3. Keep all scoring math inside core, returning decomposable breakdowns

Zen's trust surface is `scoring.ts` / `goals.ts` / `streaks.ts`, and it already returns metas, not just numbers. Protect that boundary. The moment a component computes a percentage inline, we've recreated the scattered-client-math bug that the entire old rebuild was reacting to.

### 4. Lock the local-first boundary explicitly

The moat is private-local + owner-only. Several Life-OS features assume a server (collaboration / shared goals, server-side AI on full history, very large mind maps). The risk is a future feature **quietly dragging the private snapshot server-side** and killing the moat. Extend `Viral-Plan.md`'s "published layer" thesis to **AI and collaboration too**: the snapshot stays the private source of truth; anything heavy / social / AI is an opt-in **derived projection**, never a relocation of the private data.

---

## Tier 2 — design hedges (leave room, don't build)

### 5. Don't collapse the score so hard it can't be decomposed later

Today a category/habit score is one number. The old build's hardest-won lesson was keeping **direct vs received (propagated) progress as separate channels**, so a "gym → mental health 20%" ripple never corrupts the base number. Impact edges aren't needed now — but keep the score *derivable from parts* so a "received" channel could be added without re-architecting.

### 6. Plan for snapshot growth before it bites

Local-first means the whole dataset is in memory and selectors are O(all logs). Years of daily logs × activities × (future) tasks/sub-goals will bloat it. Cheap now: design history selectors that *can* window/page, and earmark a log-archival / compaction strategy. Expensive later: retrofitting paging once everything assumes "it's all in RAM."

### 7. A tiny `meta?: Record<string, unknown>` bag on core entities

Lets us prototype new fields (a `targetDate`, an identity label, a project's "kill" state) **without** a snapshot migration each time. This is the *good* part of the old guide's "JSON metadata" flexibility — without building its full registry / measurement-type engine.

---

## Tier 3 — product / philosophy guardrails

### 8. ROI / optimization clashes with Zen's calm-identity brand

The old vision is heavy on ROI, leverage, and priority algorithms ("optimize your life"). Zen's register is calm, identity, anti-shame, comeback — almost the opposite — and the old engagement doc *itself* warned against the optimization/addiction trap. If prioritization ever ships, make it an **opt-in lens, never the daily spine** — the same instinct that cut Wishlist in `Activity-Model-Plan.md`.

### 9. Watch the vocabulary collision

Old build: Domain → Goal → **Activity** → Daily Task, where "Activity" is a *goal's work-item*. Zen (decided): **Activity = the habit**, Life Area = domain, Target = goal, Task = one-off, Project = multi-step. If old-Mottazen concepts get imported, "Activity" means two different things. The naming table in `Activity-Model-Plan.md` is canonical — treat it as the glossary.

---

## Tier 4 — process (from the old playbook, kept lightweight)

- **Decision log.** Keep a one-line-per-decision record so we (and AI tools) don't relitigate. The three `docs/*-Plan*.md` files are the start.
- **Owner-only RLS cross-user test in CI.** The playbook states that disabling RLS "killed the prior attempt." If Zen syncs to Supabase, a "second user sees zero rows" test is non-negotiable.
- **Near-total coverage on the scoring core** (already have `scoring` / `goals` / `streaks` / `insights` tests). A silent math bug here is the worst bug class for this app.
- **Lean AI-instruction files.** Keep `.cursor/rules` + graphify tight; detail lives in `/docs`.
- **Stack footguns are not ours yet.** The playbook's Windows/WSL + OpenNext + Worker-size warnings are *Next-on-Cloudflare* specific. Zen is a Vite PWA, so they don't apply today — resurface only if Zen ever migrates to Next/Workers.

---

## The four cheap hedges (TL;DR)

Everything above reduces to four nearly-free moves today that are brutal to retrofit later:

1. **Version the snapshot** (`schemaVersion` + `migrate()` on read).
2. **Prefer edges** over single-parent fields for anything that may go many-to-many.
3. **Keep math decomposable in `@mottazen/core`** (breakdowns, not just totals; never in components).
4. **Hold the local-first boundary** (heavy / social / AI = derived projections, not a data relocation).

These keep every Life-OS door open without building any of it now.

---

## Explicitly NOT now (anti-over-engineering)

To stop future-us from importing the old build's heavyweight machinery prematurely, these are deliberately **out of scope** until proven necessary:

- Full **registry / plugin / feature-flag** engine for measurement types and metrics.
- Internal **event bus** + modular-monolith module boundaries (right for a server platform, overkill for a local-first solo app).
- **Microservices** of any kind.
- A **graph/impact-propagation engine** (multi-hop decay, critical path).
- Moving to a **server-authoritative** model.
- **ROI / priority engine** as a core experience.

Adopt any of these only behind a written decision-log entry explaining why the cheap hedge above was no longer enough.

---

## Open questions

1. Do we add `schemaVersion` to the snapshot proactively (recommended) or wait for the first reshape?
2. Multi-category: settle the `tags`-vs-edges question now (Tier 1 #2) since it sets the precedent for all future relationships?
3. Where does the local-first boundary sit for a *future* AI layer — strictly on-device, or opt-in derived-and-minimized export?
4. Is a `meta` bag worth adding to `Activity`/`Target` now, or deferred until the first custom field is needed?
