alter table public.user_settings
  add column if not exists category_weights jsonb not null default '{}'::jsonb;
