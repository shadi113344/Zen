# Graph Report - zen  (2026-06-07)

## Corpus Check
- 202 files · ~83,163 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1433 nodes · 3045 edges · 90 communities (84 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af6ee426`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Core Data & State|Core Data & State]]
- [[_COMMUNITY_Category Scoring|Category Scoring]]
- [[_COMMUNITY_Insights & Analytics|Insights & Analytics]]
- [[_COMMUNITY_Project Docs & Specs|Project Docs & Specs]]
- [[_COMMUNITY_Goals Logic|Goals Logic]]
- [[_COMMUNITY_Theming & Colors|Theming & Colors]]
- [[_COMMUNITY_App Shell & Date Nav|App Shell & Date Nav]]
- [[_COMMUNITY_Habit & Goal Forms|Habit & Goal Forms]]
- [[_COMMUNITY_Mood & Emoji UI|Mood & Emoji UI]]
- [[_COMMUNITY_Profile & Haptics|Profile & Haptics]]
- [[_COMMUNITY_Charts & Visualization|Charts & Visualization]]
- [[_COMMUNITY_Habit Cards & Logging UI|Habit Cards & Logging UI]]
- [[_COMMUNITY_Streak Calculation|Streak Calculation]]
- [[_COMMUNITY_Web App Dependencies|Web App Dependencies]]
- [[_COMMUNITY_Log Page|Log Page]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Categories Management|Categories Management]]
- [[_COMMUNITY_Headers & Account UI|Headers & Account UI]]
- [[_COMMUNITY_Auth & Routing|Auth & Routing]]
- [[_COMMUNITY_Goals Page & Toasts|Goals Page & Toasts]]
- [[_COMMUNITY_Notification Settings|Notification Settings]]
- [[_COMMUNITY_App Providers & Bootstrap|App Providers & Bootstrap]]
- [[_COMMUNITY_Root Build Scripts|Root Build Scripts]]
- [[_COMMUNITY_Push Notification Backend|Push Notification Backend]]
- [[_COMMUNITY_Tab Bars & Controls|Tab Bars & Controls]]
- [[_COMMUNITY_Core Package Config|Core Package Config]]
- [[_COMMUNITY_Display Density Settings|Display Density Settings]]
- [[_COMMUNITY_Legacy v1 Data Migration|Legacy v1 Data Migration]]
- [[_COMMUNITY_Trophy Emoji (Lottie)|Trophy Emoji (Lottie)]]
- [[_COMMUNITY_Clapping Emoji (Lottie)|Clapping Emoji (Lottie)]]
- [[_COMMUNITY_Muscle Emoji (Lottie)|Muscle Emoji (Lottie)]]
- [[_COMMUNITY_Fire Emoji (Lottie)|Fire Emoji (Lottie)]]
- [[_COMMUNITY_Smiling Emoji (Lottie)|Smiling Emoji (Lottie)]]
- [[_COMMUNITY_Neutral Emoji (Lottie)|Neutral Emoji (Lottie)]]
- [[_COMMUNITY_Angry Emoji (Lottie)|Angry Emoji (Lottie)]]
- [[_COMMUNITY_Crying Emoji (Lottie)|Crying Emoji (Lottie)]]
- [[_COMMUNITY_Habit Detail Page|Habit Detail Page]]
- [[_COMMUNITY_PWA Manifest|PWA Manifest]]
- [[_COMMUNITY_Error Boundary|Error Boundary]]
- [[_COMMUNITY_Legacy Bundle Migration|Legacy Bundle Migration]]
- [[_COMMUNITY_Habit Swipe Gestures|Habit Swipe Gestures]]
- [[_COMMUNITY_Supabase Env & Push Test|Supabase Env & Push Test]]
- [[_COMMUNITY_Mottazen Logo Assets|Mottazen Logo Assets]]
- [[_COMMUNITY_Icon Generation Script|Icon Generation Script]]
- [[_COMMUNITY_App Icon Assets|App Icon Assets]]
- [[_COMMUNITY_Setup Script|Setup Script]]
- [[_COMMUNITY_Claude Settings Permissions|Claude Settings Permissions]]
- [[_COMMUNITY_Migration Combiner Script|Migration Combiner Script]]
- [[_COMMUNITY_Vite Env Types|Vite Env Types]]
- [[_COMMUNITY_App TS Config|App TS Config]]
- [[_COMMUNITY_Robots.txt|Robots.txt]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]

## God Nodes (most connected - your core abstractions)
1. `Habit` - 69 edges
2. `DayLog` - 44 edges
3. `useData()` - 34 edges
4. `useLogs()` - 31 edges
5. `useAppDate()` - 27 edges
6. `logValueForHabit()` - 26 edges
7. `useHabits()` - 23 edges
8. `Goal` - 23 edges
9. `useCategoryColors()` - 22 edges
10. `habitScore()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `GoalColorDotProps` --references--> `Goal`  [EXTRACTED]
  apps/web/src/components/goals/GoalColorDot.tsx → packages/core/src/types.ts
- `HabitGoalIndicatorsProps` --references--> `Goal`  [EXTRACTED]
  apps/web/src/components/goals/HabitGoalIndicators.tsx → packages/core/src/types.ts
- `EditHabitModalProps` --references--> `Habit`  [EXTRACTED]
  apps/web/src/components/habit/EditHabitModal.tsx → packages/core/src/types.ts
- `CalendarModalProps` --references--> `DayLog`  [EXTRACTED]
  apps/web/src/components/log/CalendarModal.tsx → packages/core/src/types.ts
- `CategoryGridCardProps` --references--> `Habit`  [EXTRACTED]
  apps/web/src/components/log/CategoryGridCard.tsx → packages/core/src/types.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Background Web Push Flow** — push_setup_web_push_setup, cron_reminders_cron_workflow, cron_reminders_send_reminders_function, push_setup_send_test_push_function, push_setup_vapid_keys, push_setup_push_subscriptions_migration, push_setup_push_notify_log [EXTRACTED 0.90]
- **Four-Phase Rebuild Plan** — docs_rebuild_readme_guide, docs_phase_1_interface_and_ia_spec, docs_phase_2_foundation_spec, docs_phase_3_features_spec, docs_phase_4_launch_spec [EXTRACTED 0.90]
- **@mottazen/core Domain Ruleset** — docs_app_logic_mottazen_core, docs_app_logic_scoring, docs_app_logic_streaks, docs_app_logic_goals, docs_app_logic_insights, docs_app_logic_notifications [EXTRACTED 0.90]
- **Mottazen Brand Identity** — logo_mottazen_logo_dark_bg, logo_mottazen_logo_ligh_bg, public_logo, public_logo_dark, public_logo_light [INFERRED 0.85]
- **App Icon Asset (size and format variants)** — public_icon_png, public_icon_192, public_icon_512, public_icon_svg [INFERRED 0.85]

## Communities (90 total, 6 thin omitted)

### Community 0 - "Core Data & State"
Cohesion: 0.06
Nodes (76): ActivityCalendarProps, HabitBreakdownListProps, GoalDetailCardProps, HabitActivityCalendar(), HabitActivityCalendarProps, HabitDetailChartsProps, HabitReminderModalProps, WEEKDAYS (+68 more)

### Community 1 - "Category Scoring"
Cohesion: 0.06
Nodes (57): CategoryWeightsSectionProps, toWeightItems(), ActivityCalendar(), CategoryHero(), CategoryHeroProps, StatTile, HabitBreakdownList(), HabitSort (+49 more)

### Community 2 - "Insights & Analytics"
Cohesion: 0.21
Nodes (11): CATEGORY_INSIGHT_CARDS, CATEGORY_INSIGHT_CHART_LABELS, CategoryInsightCardId, hiddenKey(), loadHidden(), useInsightsCardOrder(), CategoriesInsights(), CategoriesInsightsProps (+3 more)

### Community 3 - "Project Docs & Specs"
Cohesion: 0.14
Nodes (19): Cron Reminders Workflow, Deploy Workflow (Cloudflare), Zen App Logic, Routing, Service worker & PWA, GitHub Actions Secrets, GitHub Setup Guide, Cloudflare Deploy & Custom Domain (+11 more)

### Community 4 - "Goals Logic"
Cohesion: 0.06
Nodes (65): CategoryGoalsSection(), CategoryGoalsSectionProps, GoalChipsRow(), GoalChipsRowProps, GoalColorDot(), GoalColorDotProps, activityProgressPct(), GoalDetailCard() (+57 more)

### Community 5 - "Theming & Colors"
Cohesion: 0.07
Nodes (49): systemTheme(), ThemeContext, ThemeContextValue, ThemeMode, ThemeProvider(), resolveCategoryTint(), ACCENT_PASTEL, ACCENT_PRESETS (+41 more)

### Community 6 - "App Shell & Date Nav"
Cohesion: 0.05
Nodes (45): AppShell(), ShellContent(), LogDateChrome(), PageDateChrome(), ScreenPageBody(), ScreenPageTop(), ScreenPageTopProps, SegmentedControl() (+37 more)

### Community 7 - "Habit & Goal Forms"
Cohesion: 0.07
Nodes (53): AddCategoryModal(), AddCategoryModalProps, CategorySwitcher(), CategoryWeightsSection(), CategoryRow(), CategoryRowProps, sparklineToPolyline(), EmptyState() (+45 more)

### Community 8 - "Mood & Emoji UI"
Cohesion: 0.09
Nodes (27): AnimatedEmoji(), AnimatedEmojiProps, usePrefersReducedMotion(), useDayMood(), useDayNotes(), PressMenuOption, usePressRadialMenu(), DAY_MOOD_OPTIONS (+19 more)

### Community 9 - "Profile & Haptics"
Cohesion: 0.15
Nodes (22): useHapticSettings(), downloadJson(), downloadText(), logsToCsv(), asHapticSwitch(), COMPLETION_PATTERN, hapticGoalComplete(), HapticOptions (+14 more)

### Community 10 - "Charts & Visualization"
Cohesion: 0.15
Nodes (13): ChartChrome(), ChartChromeProps, ScoreLineChart(), ScoreLineChartProps, CategoryBarChart(), CategoryBarChartProps, DEFAULT_CHARTS, defaultChartsFor() (+5 more)

### Community 11 - "Habit Cards & Logging UI"
Cohesion: 0.06
Nodes (52): NumericInput(), NumericInputProps, HabitGoalIndicators(), HabitGoalIndicatorsProps, HabitHistoryTable(), HabitHistoryTableProps, HistoryRow(), HabitReminderModal() (+44 more)

### Community 12 - "Streak Calculation"
Cohesion: 0.21
Nodes (11): bestHabitByConsistency(), categoryHabitExtremes(), dayActivityLevel(), HabitMetricRow, habitPerformanceRows(), heatmapWeeks(), heatmapWeeksFromDates(), radarCategoryScores() (+3 more)

### Community 13 - "Web App Dependencies"
Cohesion: 0.08
Nodes (22): dependencies, lottie-react, @mottazen/core, react, react-dom, react-router-dom, @supabase/supabase-js, devDependencies (+14 more)

### Community 14 - "Log Page"
Cohesion: 0.04
Nodes (44): 10. Security hardening, 11. Launch day runbook (ordered), 12. Staging environment (optional but recommended), 13. Marketing / onboarding (minimal), 14. Future work (post-launch, not blocking), 15. Acceptance criteria (project complete), 16. Reference: current repo assets to reuse, 17. Congratulations checklist (+36 more)

### Community 15 - "TypeScript Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 16 - "Categories Management"
Cohesion: 0.05
Nodes (39): 10. IndexedDB (optional in Phase 2), 11. Tasks checklist (ordered), 12. Acceptance criteria (gate to Phase 3), 13. Migration from monolithic `index.html`, 14. Phase 2 → Phase 3 handoff, 1. Repository structure, 2. Technology versions (pin early), 3.1 `profiles` (extends auth.users) (+31 more)

### Community 17 - "Headers & Account UI"
Cohesion: 0.27
Nodes (11): AppLogo(), AppLogoProps, sizeClass, DesktopHeader(), formatDateBadge(), useTheme(), userDisplayName(), userInitial() (+3 more)

### Community 18 - "Auth & Routing"
Cohesion: 0.28
Nodes (9): ProtectedLayout(), router, useSession(), supabaseConfigured, AuthPage(), ProfileDisplayPage(), ProfilePage(), useDevUnlock() (+1 more)

### Community 19 - "Goals Page & Toasts"
Cohesion: 0.07
Nodes (26): Auth & data, Categories (`/categories`, `/categories/:slug`), Extra features (beyond rebuild phase docs), Feature inventory (by area), Gaps & known issues, Goals (`/goals`), Habit detail (`/habit/:id`), Insights (`/insights`) (+18 more)

### Community 20 - "Notification Settings"
Cohesion: 0.21
Nodes (12): useNotifications(), coachNotify(), defaultTimezone(), getNotifyPermission(), isIOS(), isStandalonePWA(), NotifyPermission, requestNotifyPermission() (+4 more)

### Community 21 - "App Providers & Bootstrap"
Cohesion: 0.29
Nodes (9): HapticSettingsContext, HapticSettingsCtx, HapticSettingsProvider(), persist(), clampStrength(), defaultHapticSettings, HapticSettings, readHapticSettings() (+1 more)

### Community 22 - "Root Build Scripts"
Cohesion: 0.12
Nodes (16): devDependencies, sharp, name, private, scripts, build, db:migrations, db:push (+8 more)

### Community 23 - "Push Notification Backend"
Cohesion: 0.21
Nodes (10): HabitRow, isInQuietHours(), NotificationPrefs, parseHM(), adminClient(), corsHeaders, getVapid(), jsonResponse() (+2 more)

### Community 24 - "Tab Bars & Controls"
Cohesion: 0.14
Nodes (19): Zen App Description, Phase Status Audit, Product Principles (Log first, Honest math, Coach not alarm), Tech Stack (React 19, Vite, Supabase, Cloudflare), Why Category Pages Matter, Component Inventory, Design Tokens, Phase 1 Product Principles (+11 more)

### Community 25 - "Core Package Config"
Cohesion: 0.14
Nodes (13): devDependencies, typescript, vitest, exports, main, name, private, scripts (+5 more)

### Community 26 - "Display Density Settings"
Cohesion: 0.15
Nodes (16): useCategoryOrder(), DisplayContext, DisplayPrefs, DisplayProvider(), readBool(), readDensity(), useDisplayPrefs(), DISPLAY_DENSITY_ORDER (+8 more)

### Community 27 - "Legacy v1 Data Migration"
Cohesion: 0.17
Nodes (8): bundle, convertNotificationSettings(), data, defaultNotificationSettings(), habits, idMap, logs, raw

### Community 28 - "Trophy Emoji (Lottie)"
Cohesion: 0.17
Nodes (11): assets, ddd, fr, h, ip, layers, markers, nm (+3 more)

### Community 29 - "Clapping Emoji (Lottie)"
Cohesion: 0.17
Nodes (11): assets, ddd, fr, h, ip, layers, markers, nm (+3 more)

### Community 30 - "Muscle Emoji (Lottie)"
Cohesion: 0.17
Nodes (11): assets, ddd, fr, h, ip, layers, markers, nm (+3 more)

### Community 31 - "Fire Emoji (Lottie)"
Cohesion: 0.17
Nodes (11): assets, ddd, fr, h, ip, layers, markers, nm (+3 more)

### Community 32 - "Smiling Emoji (Lottie)"
Cohesion: 0.17
Nodes (11): assets, ddd, fr, h, ip, layers, markers, nm (+3 more)

### Community 33 - "Neutral Emoji (Lottie)"
Cohesion: 0.17
Nodes (11): assets, ddd, fr, h, ip, layers, markers, nm (+3 more)

### Community 34 - "Angry Emoji (Lottie)"
Cohesion: 0.17
Nodes (11): assets, ddd, fr, h, ip, layers, markers, nm (+3 more)

### Community 35 - "Crying Emoji (Lottie)"
Cohesion: 0.17
Nodes (11): assets, ddd, fr, h, ip, layers, markers, nm (+3 more)

### Community 36 - "Habit Detail Page"
Cohesion: 0.12
Nodes (15): Architecture overview, Auth (`useSession.tsx`), Environment variables, File index (logic-critical), Goals progress (`goals.ts`), Haptics (`lib/haptic.ts`), Insights (`insights.ts`), Notifications (`notifications.ts` + web scheduler) (+7 more)

### Community 37 - "PWA Manifest"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 38 - "Error Boundary"
Cohesion: 0.18
Nodes (7): AppProviders(), AppRouter(), ErrorBoundary, Props, State, ToastProvider(), SessionProvider()

### Community 39 - "Legacy Bundle Migration"
Cohesion: 0.29
Nodes (5): bundle, habits, idMap, logs, raw

### Community 40 - "Habit Swipe Gestures"
Cohesion: 0.12
Nodes (15): 1. Database migrations, 2. Supabase Auth (Site URL + redirects), 3. Google OAuth, 3a. Google Cloud Console, 3b. Supabase, 3c. Test, 4. Deploy to Cloudflare, 5. Custom domain (`zen.mottazen.com`) (+7 more)

### Community 41 - "Supabase Env & Push Test"
Cohesion: 0.52
Nodes (4): sendTestPush(), getSupabaseEnv(), trimEnv(), { url, anonKey, configured }

### Community 42 - "Mottazen Logo Assets"
Cohesion: 0.60
Nodes (5): Mottazen Logo (Dark BG), Mottazen Logo (Light BG), Mottazen Logo (Default), Mottazen Logo (Dark Variant), Mottazen Logo (Light Variant)

### Community 43 - "Icon Generation Script"
Cohesion: 0.40
Nodes (4): publicDir, root, sizes, svg

### Community 44 - "App Icon Assets"
Cohesion: 1.00
Nodes (4): App Icon (PNG, 192px), App Icon (PNG, 512px), App Icon (PNG, base size), App Icon (SVG vector, Ensō)

### Community 45 - "Setup Script"
Cohesion: 0.50
Nodes (3): example, root, target

### Community 53 - "Community 53"
Cohesion: 0.17
Nodes (12): ACTIVITY_INSIGHT_CARDS, ACTIVITY_INSIGHT_CHART_LABELS, ActivityInsightCardId, ActivitiesInsightsProps, HabitInsightsList(), HabitInsightsListProps, HeatmapGrid(), ChartPickerOption (+4 more)

### Community 54 - "Community 54"
Cohesion: 0.13
Nodes (14): 10. Screen: Notifications (`/profile/notifications`), 11. Auth (`/auth`), 12. Component inventory (build in Phase 2–3), 14. Interaction rules (exact), 15. Copy deck (starter), 16. Wireframe checklist (one-time), 17. Phase 1 → Phase 2 handoff, 1. Product principles (+6 more)

### Community 55 - "Community 55"
Cohesion: 0.15
Nodes (12): 1. Database migrations (production Supabase), 2. Environment variables, 3. Auth redirects, 4. Cron (background reminders), 5. Post-deploy smoke tests, 6. Release hygiene, 7. Phase 4 milestone sign-off, Cloudflare Pages / Workers (Production) (+4 more)

### Community 56 - "Community 56"
Cohesion: 0.15
Nodes (12): 1. Run the database migration, 2. Generate VAPID keys, 3. Put the public key in the app, 4. Deploy static files (Cloudflare), 5. Deploy Supabase Edge Functions, 6. Test from the app, 7. Schedule reminder checks (every 5 minutes), 8. iPhone notes (+4 more)

### Community 57 - "Community 57"
Cohesion: 0.17
Nodes (11): 10. Edit mode & FAB, 11. Charts & performance, 13. Parity matrix (old app → new), 14. Acceptance criteria (gate to Phase 4), 15. Phase 3 → Phase 4 handoff, 8. Profile & data, 9. Add / Edit habit modal, One-time milestones (Phase 3) (+3 more)

### Community 58 - "Community 58"
Cohesion: 0.33
Nodes (7): SessionContext, SessionContextValue, clearAllLocalSnapshots(), isPasswordAuthUser(), userAuthProvider(), UserProfile, ProfileAccountPage()

### Community 59 - "Community 59"
Cohesion: 0.27
Nodes (9): ActivitiesInsights(), DayScoreBars(), DayScoreBarsProps, InsightsPage(), InsightsScope, dayScoreSeries(), insightsDayScoreTitle(), InsightsPeriod (+1 more)

### Community 60 - "Community 60"
Cohesion: 0.18
Nodes (11): 5. Screen: Category detail (`/categories/:slug`) — **hero spec**, Block A — Category score ring + stats, Block B — Category activity calendar, Block C — Habit breakdown (ranked list), Block D — Daily bars (7/30 days), Block E — Linked goals (Phase 3), Block F — Quick actions, Category score formula (for designers; implemented in Phase 2) (+3 more)

### Community 61 - "Community 61"
Cohesion: 0.20
Nodes (9): Commands, Connect Supabase, Deploy (Cloudflare), Docs, GitHub Actions (optional), Import from the old `index.html` app, Mottazen Habits (rebuild), Quick start (5 minutes) (+1 more)

### Community 62 - "Community 62"
Cohesion: 0.20
Nodes (10): 3.1 Page state, 3.2 Block A — Hero, 3.3 Block B — Activity calendar, 3.4 Block C — Habit breakdown, 3.5 Block D — Daily bars, 3.6 Block E — Linked goals (Sprint 4), 3.7 Block F — Quick actions, 3.8 Tasks (+2 more)

### Community 63 - "Community 63"
Cohesion: 0.31
Nodes (7): HabitMetricBarRow, HabitMetricBars(), HabitMetricBarsProps, ActivityMetricView, HabitMetricsCard(), HabitMetricsCardProps, METRIC_OPTIONS

### Community 64 - "Community 64"
Cohesion: 0.22
Nodes (8): How to use these docs, Milestones at a glance (one-time gates), Mottazen Habits — Rebuild Guide (4 Phases), New in rebuild vs current `index.html`, Phase map, Product vision (one paragraph), Recommended stack (locked for this guide), What you are NOT rebuilding in v1

### Community 65 - "Community 65"
Cohesion: 0.25
Nodes (8): CI Workflow (test + build), Haptics System, localStorage Snapshot Cache, Scoring Rules (habitScore, dayScore, categoryScore), Supabase Cloud Sync, useData Central Data Layer, Core Function Specs (habitScore, dayScore, goalProgress), Supabase Schema (habits, habit_logs, goals, RLS)

### Community 66 - "Community 66"
Cohesion: 0.25
Nodes (7): Connect Zen to GitHub, First-time push (already done), GitHub Actions secrets (required for auto-deploy), If Deploy still fails, Manual deploy (no GitHub), Push succeeded?, You cannot “view” secrets after saving

### Community 67 - "Community 67"
Cohesion: 0.29
Nodes (7): Domain Logic Separation Rule, Goals Progress Logic, Insights Logic, @mottazen/core Domain Package, Notifications & Scheduler, Streaks Logic, NotificationSettings Model

### Community 68 - "Community 68"
Cohesion: 0.38
Nodes (5): DragCtx, Slot, usePointerReorder(), InsightsReorderStack(), InsightsReorderStackProps

### Community 69 - "Community 69"
Cohesion: 0.29
Nodes (7): 12. Testing checklist (manual), Categories, Goals, Logging, Navigation, Notifications, Responsive

### Community 70 - "Community 70"
Cohesion: 0.29
Nodes (7): 6.1 Goals list, 6.2 Create wizard, 6.3 Goal detail, 6.4 Today integration, 6.5 Core function, 6.6 Tasks, 6. Goals (`/goals`)

### Community 71 - "Community 71"
Cohesion: 0.29
Nodes (7): Build order (recommended sprints), Sprint 1 — Today (P0), Sprint 2 — Categories (P0) ← differentiator, Sprint 3 — Habit detail + Insights (P0), Sprint 4 — Goals (P1), Sprint 5 — Notifications coach (P0), Sprint 6 — Polish, import/export, edge cases (P1)

### Community 72 - "Community 72"
Cohesion: 0.47
Nodes (6): send-reminders Edge Function, push_notify_log Dedupe Table, push_subscriptions Migration, Server Reminder Decision Logic, VAPID Keys, Web Push Setup

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (6): Boot sequence, Data layer (`useData.tsx`), Export / import (`lib/export-import.ts`), localStorage snapshot (`mottazen-data-snapshot:<userId>`), What syncs to Supabase, Write path (`setLogValue` example)

### Community 74 - "Community 74"
Cohesion: 0.33
Nodes (6): Category score (`categoryScore`), Day score (`dayScore`), Hero copy (`heroCopy`), Per-habit score (`habitScore`), Scoring rules, Streaks (`streaks.ts`)

### Community 75 - "Community 75"
Cohesion: 0.33
Nodes (6): 3. Screen: Today (`/log`), Desktop differences, Habit card (exact), Layout (mobile), Purpose, States

### Community 76 - "Community 76"
Cohesion: 0.33
Nodes (6): 1.1 Components to build, 1.2 Habit card interactions, 1.3 Hero copy, 1.4 Date navigation, 1.5 Tasks, 1. Today page (`/log`)

### Community 77 - "Community 77"
Cohesion: 0.40
Nodes (5): Category drill-down, Habit card states, Hero score celebration, Key UI flows, Today logging

### Community 78 - "Community 78"
Cohesion: 0.40
Nodes (5): 5.1 Overview tab, 5.2 Heatmap tab, 5.3 Habits tab, 5.4 Tasks, 5. Insights (`/insights`)

### Community 79 - "Community 79"
Cohesion: 0.40
Nodes (5): 7.1 Settings model, 7.2 Client scheduler (foreground), 7.3 Motivation on log, 7.4 Tasks, 7. Notifications coach (`/profile/notifications`)

### Community 80 - "Community 80"
Cohesion: 0.50
Nodes (4): Day log, Domain model (`@mottazen/core`), Goal, Habit

### Community 81 - "Community 81"
Cohesion: 0.50
Nodes (4): 13. Design tokens (starting point), Color (dark mode default), Spacing & touch, Typography

### Community 82 - "Community 82"
Cohesion: 0.50
Nodes (4): 2. Route map (canonical), Desktop (≥ 1024px): persistent layout, Full route table, Mobile (< 1024px): primary navigation

### Community 83 - "Community 83"
Cohesion: 0.50
Nodes (4): 4. Screen: Category index (`/categories`), Layout, Purpose, Row metrics (per category)

### Community 84 - "Community 84"
Cohesion: 0.50
Nodes (4): 8. Screen: Goals (`/goals`, `/goals/:id`), Create goal wizard (3 steps), Goal detail, Goals list

### Community 85 - "Community 85"
Cohesion: 0.50
Nodes (4): 2.1 Data, 2.2 UI, 2.3 Tasks, 2. Category index (`/categories`)

### Community 86 - "Community 86"
Cohesion: 0.67
Nodes (3): 6. Screen: Habit detail (`/habit/:id`), Purpose, Sections

### Community 87 - "Community 87"
Cohesion: 0.67
Nodes (3): 7. Screen: Insights hub (`/insights`), Category entry from Insights, Sub-views (tabs inside page)

### Community 88 - "Community 88"
Cohesion: 0.67
Nodes (3): 4. Habit detail (`/habit/:id`), Sections, Tasks

## Knowledge Gaps
- **581 isolated node(s):** `allow`, `name`, `private`, `version`, `type` (+576 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Habit` connect `Core Data & State` to `Category Scoring`, `Insights & Analytics`, `Goals Logic`, `Habit & Goal Forms`, `Charts & Visualization`, `Habit Cards & Logging UI`, `Streak Calculation`, `Notification Settings`, `Community 53`, `Display Density Settings`, `Community 63`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `DayLog` connect `Core Data & State` to `Category Scoring`, `Insights & Analytics`, `Goals Logic`, `App Shell & Date Nav`, `Charts & Visualization`, `Habit Cards & Logging UI`, `Streak Calculation`, `Community 53`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `useLogs()` connect `Habit Cards & Logging UI` to `Core Data & State`, `Category Scoring`, `App Shell & Date Nav`, `Habit & Goal Forms`, `Display Density Settings`, `Community 59`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `allow`, `name`, `private` to the rest of the system?**
  _584 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Data & State` be split into smaller, more focused modules?**
  _Cohesion score 0.05524752475247525 - nodes in this community are weakly interconnected._
- **Should `Category Scoring` be split into smaller, more focused modules?**
  _Cohesion score 0.0639386189258312 - nodes in this community are weakly interconnected._
- **Should `Project Docs & Specs` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._