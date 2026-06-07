# Graph Report - .  (2026-06-07)

## Corpus Check
- 216 files · ~83,107 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1092 nodes · 2715 edges · 53 communities (48 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.89)
- Token cost: 134,377 input · 0 output

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
- `todayLogLabel()` --calls--> `logValueForHabit()`  [EXTRACTED]
  apps/web/src/components/goals/GoalDetailCard.tsx → packages/core/src/scoring.ts
- `HabitGoalIndicatorsProps` --references--> `Goal`  [EXTRACTED]
  apps/web/src/components/goals/HabitGoalIndicators.tsx → packages/core/src/types.ts
- `EditHabitModalProps` --references--> `Habit`  [EXTRACTED]
  apps/web/src/components/habit/EditHabitModal.tsx → packages/core/src/types.ts
- `CalendarModalProps` --references--> `DayLog`  [EXTRACTED]
  apps/web/src/components/log/CalendarModal.tsx → packages/core/src/types.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Background Web Push Flow** — push_setup_web_push_setup, cron_reminders_cron_workflow, cron_reminders_send_reminders_function, push_setup_send_test_push_function, push_setup_vapid_keys, push_setup_push_subscriptions_migration, push_setup_push_notify_log [EXTRACTED 0.90]
- **Four-Phase Rebuild Plan** — docs_rebuild_readme_guide, docs_phase_1_interface_and_ia_spec, docs_phase_2_foundation_spec, docs_phase_3_features_spec, docs_phase_4_launch_spec [EXTRACTED 0.90]
- **@mottazen/core Domain Ruleset** — docs_app_logic_mottazen_core, docs_app_logic_scoring, docs_app_logic_streaks, docs_app_logic_goals, docs_app_logic_insights, docs_app_logic_notifications [EXTRACTED 0.90]
- **Mottazen Brand Identity** — logo_mottazen_logo_dark_bg, logo_mottazen_logo_ligh_bg, public_logo, public_logo_dark, public_logo_light [INFERRED 0.85]
- **App Icon Asset (size and format variants)** — public_icon_png, public_icon_192, public_icon_512, public_icon_svg [INFERRED 0.85]

## Communities (53 total, 5 thin omitted)

### Community 0 - "Core Data & State"
Cohesion: 0.05
Nodes (79): ActivityCalendarProps, HabitBreakdownListProps, GoalDetailCardProps, HabitActivityCalendarProps, HabitDetailChartsProps, HabitReminderModalProps, WEEKDAYS, DataContext (+71 more)

### Community 1 - "Category Scoring"
Cohesion: 0.06
Nodes (59): CategoryWeightsSectionProps, toWeightItems(), ActivityCalendar(), CategoryHero(), CategoryHeroProps, StatTile, HabitBreakdownList(), HabitSort (+51 more)

### Community 2 - "Insights & Analytics"
Cohesion: 0.05
Nodes (51): HabitActivityCalendar(), ACTIVITY_INSIGHT_CARDS, ACTIVITY_INSIGHT_CHART_LABELS, ActivityInsightCardId, CATEGORY_INSIGHT_CARDS, CATEGORY_INSIGHT_CHART_LABELS, CategoryInsightCardId, hiddenKey() (+43 more)

### Community 3 - "Project Docs & Specs"
Cohesion: 0.05
Nodes (59): CI Workflow (test + build), Cron Reminders Workflow, send-reminders Edge Function, Deploy Workflow (Cloudflare), Zen App Description, Phase Status Audit, Product Principles (Log first, Honest math, Coach not alarm), Tech Stack (React 19, Vite, Supabase, Cloudflare) (+51 more)

### Community 4 - "Goals Logic"
Cohesion: 0.08
Nodes (48): activityProgressPct(), GoalDetailCard(), kindLabel(), todayLogLabel(), typeDetail(), activeGoals(), addDaysLocal(), categoryGroupScoreNumeric() (+40 more)

### Community 5 - "Theming & Colors"
Cohesion: 0.08
Nodes (46): systemTheme(), ThemeContext, ThemeContextValue, ThemeProvider(), ACCENT_PASTEL, ACCENT_PRESETS, accentLabel(), accentLuminance() (+38 more)

### Community 6 - "App Shell & Date Nav"
Cohesion: 0.07
Nodes (32): CategoryGoalsSection(), CategoryGoalsSectionProps, AppShell(), ShellContent(), LogDateChrome(), PageDateChrome(), ScreenPageBody(), ScreenPageTop() (+24 more)

### Community 7 - "Habit & Goal Forms"
Cohesion: 0.08
Nodes (30): CategorySwitcher(), FormNumericStepper(), FormNumericStepperProps, GlassSelect(), GlassSelectOption, GlassSelectProps, Modal(), ModalProps (+22 more)

### Community 8 - "Mood & Emoji UI"
Cohesion: 0.08
Nodes (30): AnimatedEmoji(), AnimatedEmojiProps, usePrefersReducedMotion(), useDayMood(), useDayNotes(), PressMenuOption, usePressRadialMenu(), DAY_MOOD_OPTIONS (+22 more)

### Community 9 - "Profile & Haptics"
Cohesion: 0.13
Nodes (25): useHapticSettings(), ThemeMode, downloadJson(), downloadText(), logsToCsv(), COMPLETION_PATTERN, hapticGoalComplete(), HapticOptions (+17 more)

### Community 10 - "Charts & Visualization"
Cohesion: 0.10
Nodes (20): ChartChrome(), ChartChromeProps, ScoreLineChart(), ScoreLineChartProps, CategoryBarChart(), CategoryBarChartProps, DEFAULT_CHARTS, defaultChartsFor() (+12 more)

### Community 11 - "Habit Cards & Logging UI"
Cohesion: 0.17
Nodes (17): NumericInput(), NumericInputProps, HabitHistoryTable(), HabitHistoryTableProps, HistoryRow(), HabitReminderModal(), useLogs(), formatCompactNumber() (+9 more)

### Community 12 - "Streak Calculation"
Cohesion: 0.18
Nodes (22): GoalFormModal(), d(), HabitCard(), heatmapWeeks(), logValueForHabit(), addDays(), currentStreak(), datesForInsightsPeriod() (+14 more)

### Community 13 - "Web App Dependencies"
Cohesion: 0.08
Nodes (22): dependencies, lottie-react, @mottazen/core, react, react-dom, react-router-dom, @supabase/supabase-js, devDependencies (+14 more)

### Community 14 - "Log Page"
Cohesion: 0.17
Nodes (14): GoalChipsRow(), GoalChipsRowProps, EditHabitModal(), useCategoryOrder(), useData(), useGoals(), useDisplayPrefs(), useOnline() (+6 more)

### Community 15 - "TypeScript Config"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 16 - "Categories Management"
Cohesion: 0.24
Nodes (16): AddCategoryModal(), AddCategoryModalProps, CategoryWeightsSection(), CategoryRow(), CategoryRowProps, sparklineToPolyline(), useCategoryColors(), useCategoryWeights() (+8 more)

### Community 17 - "Headers & Account UI"
Cohesion: 0.23
Nodes (14): AppLogo(), AppLogoProps, sizeClass, DesktopHeader(), formatDateBadge(), useTheme(), isPasswordAuthUser(), userAuthProvider() (+6 more)

### Community 18 - "Auth & Routing"
Cohesion: 0.22
Nodes (11): ProtectedLayout(), router, SessionContext, SessionContextValue, useSession(), clearAllLocalSnapshots(), supabaseConfigured, { url, anonKey, configured } (+3 more)

### Community 19 - "Goals Page & Toasts"
Cohesion: 0.16
Nodes (13): FabButton(), FabButtonProps, ToastContext, ToastContextValue, ToastProvider(), ToastState, useToast(), DataProvider() (+5 more)

### Community 20 - "Notification Settings"
Cohesion: 0.20
Nodes (13): useNotifications(), coachNotify(), defaultTimezone(), getNotifyPermission(), isIOS(), isStandalonePWA(), NotifyPermission, requestNotifyPermission() (+5 more)

### Community 21 - "App Providers & Bootstrap"
Cohesion: 0.18
Nodes (13): AppProviders(), AppRouter(), DisplayProvider(), HapticSettingsContext, HapticSettingsCtx, HapticSettingsProvider(), persist(), SessionProvider() (+5 more)

### Community 22 - "Root Build Scripts"
Cohesion: 0.12
Nodes (16): devDependencies, sharp, name, private, scripts, build, db:migrations, db:push (+8 more)

### Community 23 - "Push Notification Backend"
Cohesion: 0.21
Nodes (10): HabitRow, isInQuietHours(), NotificationPrefs, parseHM(), adminClient(), corsHeaders, getVapid(), jsonResponse() (+2 more)

### Community 24 - "Tab Bars & Controls"
Cohesion: 0.20
Nodes (9): SegmentedControl(), SegmentedControlProps, SubTabBar(), SubTabBarProps, SubTabItem, TabBar(), SlidingIndicatorStyle, useSlidingIndicator() (+1 more)

### Community 25 - "Core Package Config"
Cohesion: 0.14
Nodes (13): devDependencies, typescript, vitest, exports, main, name, private, scripts (+5 more)

### Community 26 - "Display Density Settings"
Cohesion: 0.27
Nodes (10): DisplayContext, DisplayPrefs, readBool(), readDensity(), DISPLAY_DENSITY_ORDER, DisplayDensity, displayDensityLabel(), isDisplayDensity() (+2 more)

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
Cohesion: 0.27
Nodes (8): EmptyState(), EmptyStateProps, StreakPills(), StreakPillsProps, HabitDetailPage(), habitTypeLabel(), habitDayHistory(), consistency30d()

### Community 37 - "PWA Manifest"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 38 - "Error Boundary"
Cohesion: 0.29
Nodes (3): ErrorBoundary, Props, State

### Community 39 - "Legacy Bundle Migration"
Cohesion: 0.29
Nodes (5): bundle, habits, idMap, logs, raw

### Community 40 - "Habit Swipe Gestures"
Cohesion: 0.60
Nodes (3): useHabitSwipe(), HabitSwipeRow(), HabitSwipeRowProps

### Community 41 - "Supabase Env & Push Test"
Cohesion: 0.70
Nodes (3): sendTestPush(), getSupabaseEnv(), trimEnv()

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

## Knowledge Gaps
- **311 isolated node(s):** `allow`, `name`, `private`, `version`, `type` (+306 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Habit` connect `Core Data & State` to `Category Scoring`, `Insights & Analytics`, `Goals Logic`, `Habit Detail Page`, `Habit & Goal Forms`, `Charts & Visualization`, `Habit Cards & Logging UI`, `Streak Calculation`, `Log Page`, `Categories Management`, `Notification Settings`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `DayLog` connect `Core Data & State` to `Category Scoring`, `Insights & Analytics`, `Goals Logic`, `App Shell & Date Nav`, `Charts & Visualization`, `Streak Calculation`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `logValueForHabit()` connect `Streak Calculation` to `Core Data & State`, `Category Scoring`, `Insights & Analytics`, `Goals Logic`, `Habit Detail Page`, `Charts & Visualization`, `Habit Cards & Logging UI`, `Log Page`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `allow`, `name`, `private` to the rest of the system?**
  _314 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Data & State` be split into smaller, more focused modules?**
  _Cohesion score 0.05485148514851485 - nodes in this community are weakly interconnected._
- **Should `Category Scoring` be split into smaller, more focused modules?**
  _Cohesion score 0.06277665995975855 - nodes in this community are weakly interconnected._
- **Should `Insights & Analytics` be split into smaller, more focused modules?**
  _Cohesion score 0.054987212276214836 - nodes in this community are weakly interconnected._