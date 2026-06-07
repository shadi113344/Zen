-- Per-user Dashboard layout: draggable card order + hidden cards ({ order, hidden })
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS dashboard_layout jsonb NOT NULL DEFAULT '{}'::jsonb;
