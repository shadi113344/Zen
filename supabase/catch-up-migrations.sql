-- Run this if you already applied 0001_base + 0002_rls and only need the rest.
-- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS where needed).

-- ========== 0003_category_weights.sql ==========
alter table public.user_settings
  add column if not exists category_weights jsonb not null default '{}'::jsonb;

-- ========== 0004_category_colors.sql ==========
alter table public.user_settings
  add column if not exists category_colors jsonb not null default '{}'::jsonb;

-- ========== 0005_habit_types.sql ==========
alter table public.habits drop constraint if exists habits_type_check;
alter table public.habits add constraint habits_type_check
  check (type in ('check', 'numeric', 'milestone', 'onetime'));

-- ========== 0006_goals_v2.sql ==========
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

alter table public.goals alter column period drop not null;
alter table public.goals alter column target_percent drop not null;

create index if not exists goals_user_id_idx on public.goals (user_id);

-- ========== 20260527000000_push_subscriptions.sql ==========
alter table public.habits
  add column if not exists remind_at time;

alter table public.user_settings
  add column if not exists notification_prefs jsonb not null default '{"enabled":false,"dailyTime":"20:00"}'::jsonb;

alter table public.user_settings
  add column if not exists timezone text not null default 'UTC';

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

create table if not exists public.push_notify_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notify_key text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, notify_key)
);

create index if not exists push_notify_log_user_id_idx
  on public.push_notify_log (user_id);

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
