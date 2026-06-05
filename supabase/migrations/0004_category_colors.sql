-- Per-category subtle pastel tints for cards
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS category_colors jsonb NOT NULL DEFAULT '{}'::jsonb;
