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
