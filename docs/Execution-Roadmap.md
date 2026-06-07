# Zen — Execution Roadmap (synthesized)

> **Status:** Active plan. This is the *do-this* file, synthesized from `docs/Activity-Model-Plan.md` (object types + naming), `docs/Life-OS-Direction-Considerations.md` (foundations + foresight), and `docs/Viral-Plan.md` (growth / virality track, G1–G7).
> **Audience:** the coding agent (future me). Written to be picked up cold — each work item is self-contained.
> **Rule:** read **Prime Directives** first; they constrain every item. Then work top-down by bucket. Don't start a bucket until the one above it is clear, unless dependencies say otherwise.

---

## How to use this file

1. Resolve the **Open Decisions** (bottom) — each has a recommended default, so you can proceed autonomously unless flagged `NEEDS USER`.
2. Work **TOP → MEDIUM → LOW**. Skip nothing silently; if you defer an item, add a line to `docs/decision-log.md` (create it — see L1). Growth items (**G1–G7**, from `Viral-Plan.md`) are a parallel track bucketed by priority — **G1** is the recommended early win and can ship anytime.
3. Respect **Prime Directives** and each item's **Done when** as acceptance criteria.
4. One concern per PR. After any code change, run typecheck + build, add tests for any core math, then `graphify update .`.
5. **POSTPONE** = on-mission, build later, don't foreclose. **CUT** = do not build (off-mission or premature); only revive behind a written decision-log entry.

---

## Prime Directives (invariants — apply to every item)

- **Naming (locked, `Activity-Model-Plan.md`):** Activity (habit) · Life Area (category) · Target (goal) · Task (one-off) · Project (multi-step). Rename **UI strings only** — keep internal type names (`Habit`, `Goal`, `category`) to avoid a noisy refactor.
- **Don't break the daily ledger.** New object types (Task, Project) live *alongside* `DayLog`, never inside it.
- **Protect the score.** Only Activities feed `dayScore` / Life-Area score. Tasks, Project steps, etc. must **not** inflate it.
- **Math stays in `@mottazen/core`,** returns decomposable breakdowns (never compute progress in a component).
- **Edges over single-parent** for anything that may go many-to-many (precedent: `GoalHabitLink`).
- **Local-first boundary holds.** The private snapshot is the source of truth; anything heavy/social/AI is an opt-in *derived projection*, never a data relocation.
- **Social = published layer, output-only (`Viral-Plan.md`).** Sharing computes a *derived artefact* (image / aggregate) and publishes only that. The private snapshot never gains *social* fields. Identity mode (G5) is the one allowed snapshot addition because it's **private** personal data, not social; pods/challenges (G6/G7) live in their own member-scoped tables, never in `pushSnapshotToCloud`.
- **Wellbeing guardrails:** no shaming copy, streaks freeze/comeback (never punish-reset), opt-in notifications only.
- **Version before you reshape.** No snapshot shape change ships without a `schemaVersion` bump + migration (see T1).

---

## Order at a glance

```
TOP:    T1 (snapshot versioning)  →  T2 Task lane
                                  →  T3 Abstinence+comeback
        T4 Outcome preset (independent, XS)  ·  T5 Monthly cadence (needs T1)
        G1 Comeback celebration (independent, ~1 day, highest emotional ROI)
MEDIUM: M1 Multi-category tags (needs T1) · M2 Allowance (needs T5) · M3 Tiny Project (needs T1)
        M4 meta bag (needs T1) · M5 UI naming · M6 score-decomposability guard
        G2 Share cards · G3 Wrapped recap (top growth lever) · G5 Identity mode (needs T1)
LOW:    L1 decision log · L2 RLS cross-user test · L3 scoring coverage · G4 Streak gardens
GROWTH (Viral-Plan order): G1 → G2 → G3 → G4 → G5 → [G6 pods · G7 co-check-ins = POSTPONE]
```

---

## TOP PRIORITY

### T1 — Version the local snapshot (`schemaVersion` + `migrate()`)
`foundation · effort S` — origin: Considerations Tier 1 #1
- **Why:** Gates *every* future model change (Tasks, Projects, cadence, tags). Today `LocalDataSnapshot` has only `savedAt`; `parseSnapshot` defaults added fields but cannot *reshape*, and old snapshots on devices will mis-parse on any rename/split.
- **Touches:** `apps/web/src/lib/local-data-store.ts` (snapshot type + `parseSnapshot`/`readLocalSnapshot`), `export-import.ts` / `legacy-import.ts` (already `version: 1` — align), `cloud-sync.ts` (handle version skew between devices).
- **Plan:** add `schemaVersion: number` to the snapshot; write a `migrate(raw)` that upgrades old → current before use; default missing version to the pre-versioning baseline; make sync tolerate a client reading a newer/older snapshot without data loss.
- **Done when:** a synthetic old snapshot (no version) loads through `migrate()` with no loss; a unit test covers at least one version step; sync round-trips a versioned snapshot.
- **Depends on:** nothing. **Do this first.**

### T2 — Task lane (one-off to-dos)
`feature · effort M` — origin: Activity-Model Proposal A (the #1 gap by count)
- **Why:** A large share of real planning is do-once items (checkups, emails, visa, packing). `onetime` Activities pollute the grid and score; Tasks need a home that never touches streaks.
- **Touches:** new `Task` in snapshot + `useData.tsx` CRUD; Today surface (default **A1**: a "Tasks" sub-section/peer to the Activity list); recap counts.
- **Model:** `Task { id, title, category?, done, dueDate?, note?, createdAt, completedAt? }`.
- **Plan:** add `tasks: Task[]` to snapshot (via T1); CRUD + toggle in the data hook; render on Today, visually separate from Activities; **exclude from all scoring**; optional Life-Area tag; completed-count can feed recap (never titles).
- **Done when:** can add/complete/delete a Task from Today; toggling a Task does **not** change `dayScore` or any Life-Area score (assert with a test); survives reload (snapshot) + sync.
- **Depends on:** T1. **Open decision D-a** (placement; default A1).

### T3 — Abstinence + comeback ("quit X")
`feature · effort S–M` — origin: Activity-Model B1 + `Viral-Plan.md` comeback
- **Why:** "Quit porn/smoking" are the most emotionally loaded items; today's streak model punishes a slip with a red break (shame → churn). Highest emotional payoff, low cost.
- **Touches:** `AddHabitModal.tsx` (preset/flavor), `scoring.ts`/`streaks.ts` (interpretation), Today copy.
- **Plan:** **Phase 1 (cheap, ship first):** a "Quit / Avoid" preset = `check` + `progressScoring: "any"` + warm copy ("stayed clean", comeback on slip — never "failed"). **Phase 2 (honest, optional same PR):** add `goalDirection?: "do" | "avoid"` to `Habit`; for `avoid`, a logged day = success and the streak reads as "days since last slip."
- **Done when:** a Quit activity shows supportive framing; a slip triggers comeback copy, not a punitive reset; if Phase 2 shipped, `goalDirection` round-trips through snapshot (via T1) + sync.
- **Depends on:** Phase 1 none; Phase 2 needs T1. **Open decision D-b.**
- **Shares code with G1:** build the `detectComeback` primitive once in `streaks.ts`; both abstinence (here) and the general comeback celebration (G1) consume it.

### T4 — Outcome preset (surface existing Targets as "Outcomes")
`feature · effort XS` — origin: Activity-Model "Do soon"
- **Why:** "Finish PMP/NGC" are outcomes with a deadline. `milestone`/cumulative Targets already express this; users just can't find it. Near-zero cost.
- **Touches:** `GoalFormModal.tsx` copy/preset labelling; maybe a hint linking outcome ← process Activities.
- **Plan:** add an "Outcome / Target" framing in the Target form (cumulative or milestone with a deadline); reword hints so an outcome is an obvious choice. No model change.
- **Done when:** creating "Finish PMP by <date>" is a guided, obvious path in the Target form.
- **Depends on:** nothing. Independent — can ship anytime.

### T5 — Monthly cadence for Targets
`feature · effort S` — origin: Activity-Model E1
- **Why:** Unlocks "running weekly", "2×/month", and is the period primitive Allowance (M2) reuses. Removes a real limitation (consistency is days/week only).
- **Touches:** `Goal` type (`daysPerWeek` → a `cadence { count; period: "week" | "month" }`, keep back-compat), `goals.ts` (`goalPeriodDates`/consistency meta), `GoalFormModal.tsx`.
- **Plan:** generalize consistency cadence to `{ count, period }`; migrate existing `daysPerWeek` → `{ count: daysPerWeek, period: "week" }` (via T1); update meta + form.
- **Done when:** a Target can require "1×/week" or "2×/month"; existing day/week Targets still compute identically; tests cover both periods.
- **Depends on:** T1.

### G1 — Comeback celebration
`growth · effort XS (~1 day)` — origin: `Viral-Plan.md` Phase 1 #1 (its recommended first build, "Option A")
- **Why:** Highest emotional ROI in the whole plan and fully local — turns a broken streak into a "welcome back," which is both kinder (wellbeing) and organically shareable.
- **Touches:** `packages/core/src/streaks.ts` (new pure `detectComeback(logs, habitId)` → `{ isComeback, gapDays, priorBest }`), `HabitCard.tsx` + `StreakFlame.tsx` + `confetti.ts`.
- **Plan:** add `detectComeback` (shared with T3); when today's check-in **restarts a streak after a gap ≥ 2 days**, fire StreakFlame + confetti with a distinct 🌱 "welcome back" treatment and warm copy — never "you lost your streak."
- **Done when:** a check-in after a break shows comeback celebration + copy; `detectComeback` is unit-tested; nothing hits the network.
- **Depends on:** nothing — independent, ship early. Shares `detectComeback` with T3.

---

## MEDIUM

### M1 — Multi-category (Life-Area membership via tags)
`feature · effort M` — origin: Activity-Model E2 + Considerations Tier 1 #2 (sets the relationship precedent)
- **Why:** Gym belongs to *Health* **and** *Physical Care*. Also the first test of "edges/tags over single-parent" — it sets the pattern for all future relationships.
- **Touches:** `Habit` (add `tags: string[]` alongside `category`), scoring/Life-Area attribution, Add/Edit Activity UI, Life-Area pages.
- **Plan:** default to `tags` (less scoring disruption than a true edge table); an Activity contributes to each tagged Life Area; keep `category` as the primary for back-compat/migration.
- **Done when:** one Activity shows under multiple Life Areas without duplication; scoring attributes correctly; migration backfills `tags` from `category`.
- **Depends on:** T1. **Open decision D-c** (tags vs edge table; default tags).

### M2 — Allowance / tolerance budget
`feature · effort M` — origin: Activity-Model B2
- **Why:** "2 cheat days/month" = a budget of N exceptions per period, distinct from unlimited rest days.
- **Touches:** `Habit` or its Target (`allowance { count, period }`), `scoring.ts`/`streaks.ts` (tolerate up to N misses before penalty).
- **Plan:** add `allowance`; streak/score tolerate `count` misses per `period`; UI shows budget remaining. Keep it dead simple.
- **Done when:** an activity with `allowance {2, month}` keeps its streak through 2 misses, breaks on the 3rd; tests cover the boundary.
- **Depends on:** T5 (period primitive).

### M3 — Tiny Project (outcome + flat checklist + kill state)
`feature · effort M` — origin: Activity-Model C (**tiny version only**)
- **Why:** Covers "explore or kill" and "finish → deploy → launch" with the minimum. Full project management is CUT (see C-list).
- **Touches:** new `Project` in snapshot, a simple Project surface, optional link to driving Activities.
- **Model:** `Project { id, title, category?, status: "active"|"someday"|"done"|"killed", steps: {id,title,done}[], linkedHabitIds?, targetDate? }`.
- **Plan:** **flat** checklist only (no ordering/dependencies); `killed` honors decision gates; does not feed score.
- **Done when:** can create a Project, tick steps, mark done/killed; excluded from score; persists + syncs.
- **Depends on:** T1.

### M4 — `meta` JSON bag on Activity / Target
`feature · effort XS–S` — origin: Considerations Tier 2 #7
- **Why:** Lets future fields (identity label, target date, project flags) be prototyped without a migration each time. The *good* part of the old build's flexibility, without a registry engine.
- **Touches:** `Habit`/`Goal` (`meta?: Record<string, unknown>`), snapshot passthrough.
- **Done when:** `meta` round-trips through snapshot + sync untouched; documented as "experimental fields go here first."
- **Depends on:** T1.

### M5 — Vocabulary alignment (UI strings only)
`chore · effort S` — origin: Activity-Model naming decision
- **Why:** Make the product read Activity / Life Area / Target / Task / Project. "Activity" is already the in-app label; "Life Area" and "Target" are the real changes.
- **Touches:** UI copy across forms/pages. **Do not** rename internal types (`Goal`, `Habit`, `category`).
- **Done when:** no user-facing "Category"/"Goal/Habit" strings remain (except internal code); glossary in `Activity-Model-Plan.md` matches the UI.
- **Depends on:** nothing (do alongside related feature PRs to avoid churn).

### M6 — Score-decomposability guard
`safety · effort S` — origin: Considerations Tier 1 #3 / Tier 2 #5
- **Why:** Keep the score derivable from parts so a future "received/propagated" channel (cross-Life-Area impact) is addable without re-architecting. Prevent regressions where components compute progress.
- **Touches:** `scoring.ts`/`goals.ts` (ensure breakdowns exposed), a guard test.
- **Done when:** a test asserts category/Activity scores are reconstructable from their component metas; no component computes a percentage inline.
- **Depends on:** nothing (verification-led).

### G2 — Milestone share cards
`growth · effort S (2–3 days)` — origin: `Viral-Plan.md` Phase 1 #2
- **Why:** Turns existing streak tiers (10 / 30 / 100) into shareable proof of *discipline, not diary*. Output-only, no schema.
- **Touches:** `streaks.ts` tiers, a new `ShareCard`, image export (`html-to-image` / canvas + existing lottie).
- **Plan:** when a tier fires, surface a **Share** action that renders a `ShareCard` to PNG — "100 days of showing up" + an abstract visual; **the habit name is hidden unless the user toggles it on**. Nothing hits the network.
- **Done when:** hitting a tier offers a PNG export that carries no habit title by default.
- **Depends on:** G1 plumbing helpful, not required.

### G3 — Year/Month in Habits ("Wrapped" recap)  ← top growth lever
`growth · effort M (4–6 days)` — origin: `Viral-Plan.md` Phase 1 #3 ("Option B", highest viral upside)
- **Why:** The biggest growth lever once celebration UX exists; screenshot-driven, zero data exposure.
- **Touches:** new `packages/core/src/recap.ts` (`buildRecap(habits, logs, range)` → aggregates), new `/recap/:period` route, lottie + `confetti.ts`.
- **Plan:** aggregate total check-ins, "showed up N days," best streak, biggest comeback, most consistent Life Area, busiest weekday; animated slides, each screenshot-ready; the shareable frame shows **the number, never the list** ("I showed up 247 days").
- **Done when:** `/recap` renders animated, screenshot-ready slides from real data; `buildRecap` is unit-tested; exposes aggregates only.
- **Depends on:** none (reads existing logs). Pairs with T2 (Task counts can feed it).

### G5 — Identity mode
`growth / positioning · effort M (3–5 days)` — origin: `Viral-Plan.md` Phase 1 #5 (**supersedes the old L4**)
- **Why:** Strongest *positioning* differentiator, stays fully private. Independently validated — the paper's Life-Area headers read like identities ("a fit person," "a builder").
- **Touches:** `packages/core/src/types.ts` (`Identity { id, label, color?, habitIds[] }`), `LocalDataSnapshot` + `cloud-sync.ts` + a new **owner-only** `identities` table (same RLS pattern as `goals`), Today/Dashboard reframe.
- **Plan:** add `identities: Identity[]` to the snapshot (via T1); optionally group Today/Dashboard by identity and phrase progress as "You showed up as a runner 4/5 days." Keep it a **mode toggle** so habit-first users aren't disrupted.
- **Done when:** a user can define an identity, group by it, and see identity-framed progress; `identities` round-trips snapshot + sync; default-off.
- **Depends on:** T1. (Interim: store the label cheaply in M4's `meta` before the first-class type.)

---

## LOW

### L1 — Start `docs/decision-log.md`
`chore · effort XS` — origin: Considerations Tier 4. Seed with: naming decision, scope triage, the 4 cheap hedges, snapshot-versioning choice. One paragraph per decision thereafter.

### L2 — Owner-only RLS cross-user test in CI
`safety · effort S` — origin: Considerations Tier 4. A "second user sees zero rows" test against the sync layer. The old playbook says disabling RLS "killed the prior attempt." **Do before any shared/multi-user feature.**

### L3 — Maintain near-total scoring coverage
`ongoing` — origin: Considerations Tier 4. `scoring`/`goals`/`streaks`/`insights` already have tests — keep them comprehensive; a silent math bug is the worst class here.

### G4 — Streak gardens
`growth · effort M (4–7 days)` — origin: `Viral-Plan.md` Phase 1 #4
- **Why:** Pure visual function of streak length / consistency → growth stage; "100-day forest" screenshots drive organic sharing. Output-only.
- **Touches:** new `StreakGarden` (SVG / lottie from `currentStreak` / `longestStreak`), a Dashboard card + a `/garden` view with image export.
- **Done when:** a garden renders per Activity / Life Area and exports an image; nothing hits the network.
- **Depends on:** none.

> **Note:** the earlier *L4 identity-framing* idea is **superseded by G5 (MEDIUM)** — identity is now a first-class private mode, not just a cosmetic label.

---

## POSTPONE (on-mission, build later, don't foreclose)

Each is reachable thanks to the foundations above; revive behind a decision-log entry.

- **P1 — Snapshot history paging/archival.** Trigger: measurable perf degradation as logs accumulate. (Considerations Tier 2 #6.) Hedge already in place: keep selectors windowable.
- **P2 — Full Project** (ordered/dependent steps) beyond the flat M3.
- **P3 — Conditional / scheduled activation** (`activatesOn` / `activatesAfter`, e.g. "boxing after 6 months"). Interim: `paused` + a note. (B3.)
- **P4 — Horizon / backlog redesign** (`now` / `scheduled` / `someday` axis across all object types). (Activity-Model E full.) M3 + `paused` cover ~90% first.
- **P5 — Score channel separation** (direct vs received) — only if cross-Life-Area impact is pursued. M6 keeps the door open.
- **P6 — Life-OS heavy set:** Life-Area→Target→sub-target→Activity hierarchy, impact/dependency **edges + graph**, multi-view (Timeline / Mind Map), self-discovery assessments, AI insights. Each is its own large effort, gated individually.
- **G6 — Anonymous pods** (`Viral-Plan.md` Phase 2) · `growth/social · effort L (1.5–2.5 wk)`. The only social that fits the anonymous-by-default thesis: members exchange *presence*, not data. New `pods` / `pod_members` / `pod_checkins` (**booleans only**) tables + RLS (a member reads only their pods) + edge-function matchmaking by `goal_tag` + Realtime reactions. Never touches the snapshot or export bundle. **Gate on:** Phase-1 growth shipped + real demand; **do L2 (RLS cross-user test) first.**
- **G7 — Invited co-check-ins** (`Viral-Plan.md` Phase 3) · `growth/social · effort L (2–3 wk)`. The one feature that breaks owner-only — **strictly opt-in**. Separate `shared_challenges` / `challenge_members` / `challenge_checkins` model; a projection copies only the agreed metric across — **never route through `habit_logs`**. Heaviest lift (invites, conflicts, realtime, moderation). **Ship last, only if demand is real.**

---

## CUT / DUMP (do not build)

Off-mission for a calm, local-first, identity tracker — or premature platform machinery. Revive only behind an explicit decision-log entry.

- **C1 — Wishlist / savings (finance).** Drags toward shopping/budgeting; dilutes the moat. Belongs in Notes. (Activity-Model D.)
- **C2 — ROI / priority engine as a core experience.** Clashes with the calm/identity brand. If ever added, it's an opt-in *lens*, never the daily spine. (Considerations #8.)
- **C3 — Social-media addiction mechanics** (variable-ratio, FOMO, guilt loops). Wellbeing guardrail; retention through value, not compulsion.
- **C4 — Server-authoritative migration** (moving the private snapshot server-side). Contradicts the moat. (Considerations Tier 1 #4.)
- **C5 — Premature platform machinery:** registry/plugin/feature-flag engine, internal event bus, modular-monolith module boundaries, microservices, or a graph/propagation engine built ahead of need. Right for the old server platform; overkill for local-first solo. (Considerations "Explicitly NOT now.")

---

## Open Decisions (resolve before coding; defaults let you proceed)

| # | Decision | Default | Flag |
|---|---|---|---|
| D-a | Task lane placement (A1 Today sub-tab / A2 per-Life-Area / A3 own screen) | **A1** | NEEDS USER if A1 feels wrong on device |
| D-b | Abstinence: ship preset only, or also add `goalDirection:"avoid"` field | **Preset first; add field if time** | — |
| D-c | Multi-category as `tags: string[]` vs a true edge table | **tags** | NEEDS USER (sets relationship precedent) |
| D-d | Add `schemaVersion` proactively (T1) | **Yes** | — |
| D-e | Rename internal `Goal`/`Habit` types or UI strings only | **UI strings only** | — |
| D-f | Add `meta` bag now (M4) or defer | **Now (cheap, additive)** | — |
| D-g | Growth-track start: comeback (A, lowest-risk) / Wrapped recap (B, highest lever) / pods (C) | **A then B** (`Viral-Plan` rec) | — |

---

## Definition of Done (every item)

- Acceptance criteria above met; typecheck + build green.
- Tests added for any core math; **no Task/Project/score-pollution regressions**.
- Any snapshot shape change has a `migrate()` step + a migration test (T1).
- One concern per PR; `docs/decision-log.md` line added if a decision was made.
- `graphify update .` run after code changes.
