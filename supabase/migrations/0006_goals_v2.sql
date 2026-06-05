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
