-- Task lane: one-off to-dos stored as a JSON blob on user_settings.
-- Mirrors how daily_notes / dashboard_layout ride on the settings row.

alter table public.user_settings
  add column if not exists tasks jsonb not null default '[]'::jsonb;
