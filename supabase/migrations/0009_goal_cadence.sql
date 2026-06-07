-- Goal cadence: generalize consistency from days/week to {count, period}.
-- `days_per_week` is kept for back-compat (mirrors count when period = 'week').

alter table public.goals
  add column if not exists cadence_count int,
  add column if not exists cadence_period text
    check (cadence_period in ('week', 'month'));
