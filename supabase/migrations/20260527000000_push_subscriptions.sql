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
