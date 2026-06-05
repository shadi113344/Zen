-- RLS policies (idempotent — safe to re-run)

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.user_settings enable row level security;
alter table public.goals enable row level security;
alter table public.goal_habits enable row level security;

drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "habits_own" on public.habits;
create policy "habits_own"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "habit_logs_own" on public.habit_logs;
create policy "habit_logs_own"
  on public.habit_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_own" on public.user_settings;
create policy "user_settings_own"
  on public.user_settings for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "goals_own" on public.goals;
create policy "goals_own"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "goal_habits_own" on public.goal_habits;
create policy "goal_habits_own"
  on public.goal_habits for all
  using (
    exists (
      select 1 from public.goals g
      where g.id = goal_habits.goal_id and g.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.goals g
      where g.id = goal_habits.goal_id and g.user_id = auth.uid()
    )
  );
