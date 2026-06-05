-- Zen: all migrations in order. Safe to re-run (tables use IF NOT EXISTS; policies use DROP IF EXISTS).
-- If you already ran 0001+0002, you can use catch-up-migrations.sql instead.

-- ========== 0001_base.sql ==========
-- Base schema v1

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'Other',
  type text not null check (type in ('check', 'numeric')),
  min numeric,
  max numeric,
  step numeric default 1,
  color text default '#3b82f6',
  order_index int not null default 0,
  paused boolean not null default false,
  remind_at time,
  notify jsonb default '{}'::jsonb,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists habits_user_id_idx on public.habits (user_id);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  log_date date not null,
  value numeric,
  note text,
  is_rest boolean not null default false,
  unique (habit_id, log_date)
);

create index if not exists habit_logs_user_id_idx on public.habit_logs (user_id);
create index if not exists habit_logs_habit_date_idx on public.habit_logs (habit_id, log_date);

create table if not exists public.user_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  compact_view boolean not null default false,
  show_edit_buttons boolean not null default false,
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  notification_prefs jsonb not null default '{}'::jsonb,
  timezone text not null default 'UTC',
  daily_notes jsonb not null default '{}'::jsonb
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  period text not null check (period in ('daily', 'weekly')),
  target_percent numeric not null default 80,
  created_at timestamptz not null default now()
);

create table if not exists public.goal_habits (
  goal_id uuid not null references public.goals(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  weight numeric not null default 1,
  required boolean not null default false,
  primary key (goal_id, habit_id)
);

-- Auto-create profile + settings on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;

  insert into public.user_settings (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ========== 0002_rls.sql ==========
-- RLS policies (idempotent ÔÇö safe to re-run)

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


-- ========== 0003_category_weights.sql ==========
alter table public.user_settings
  add column if not exists category_weights jsonb not null default '{}'::jsonb;


-- ========== 0004_category_colors.sql ==========
-- Per-category subtle pastel tints for cards
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS category_colors jsonb NOT NULL DEFAULT '{}'::jsonb;


-- ========== 0005_habit_types.sql ==========
alter table habits drop constraint if exists habits_type_check;
alter table habits add constraint habits_type_check
  check (type in ('check', 'numeric', 'milestone', 'onetime'));


-- ========== 0006_goals_v2.sql ==========
-- Goals v2: consistency / cumulative / legacy model (matches @mottazen/core Goal type)

alter table public.goals
  add column if not exists kind text not null default 'legacy'
    check (kind in ('consistency', 'cumulative', 'legacy')),
  add column if not exists category text,
  add column if not exists start_date date not null default '2020-01-01',
  add column if not exists end_date date not null default '2099-12-31',
  add column if not exists days_per_week int,
  add column if not exists target_total numeric,
  add column if not exists unit text,
  add column if not exists plan_interval_days int,
  add column if not exists plan_amount_per_session numeric,
  add column if not exists color text;

-- Legacy columns remain for kind = 'legacy'; nullable for other kinds
alter table public.goals alter column period drop not null;
alter table public.goals alter column target_percent drop not null;

create index if not exists goals_user_id_idx on public.goals (user_id);


-- ========== 20260527000000_push_subscriptions.sql ==========
-- Web Push: subscriptions, reminder prefs, dedupe log, per-habit remind time

-- Per-habit reminder time (HH:MM in user's local timezone, checked by Edge Function)
alter table public.habits
  add column if not exists remind_at time;

-- Daily reminder prefs + timezone on existing settings row
alter table public.user_settings
  add column if not exists notification_prefs jsonb not null default '{"enabled":false,"dailyTime":"20:00"}'::jsonb;

alter table public.user_settings
  add column if not exists timezone text not null default 'UTC';

-- Browser push subscriptions (one row per device/browser)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

-- Prevent duplicate pushes for the same daily/habit slot
create table if not exists public.push_notify_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notify_key text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, notify_key)
);

create index if not exists push_notify_log_user_id_idx
  on public.push_notify_log (user_id);

-- RLS
alter table public.push_subscriptions enable row level security;
alter table public.push_notify_log enable row level security;

drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions;
create policy "Users manage own push subscriptions"
  on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users read own push notify log" on public.push_notify_log;
create policy "Users read own push notify log"
  on public.push_notify_log
  for select
  using (auth.uid() = user_id);

-- Edge Function (service role) inserts dedupe rows; no client insert policy needed

-- Auto-update updated_at on push_subscriptions
create or replace function public.set_push_subscription_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists push_subscriptions_updated_at on public.push_subscriptions;
create trigger push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row
  execute function public.set_push_subscription_updated_at();


