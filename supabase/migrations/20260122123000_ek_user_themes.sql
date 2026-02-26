CREATE TABLE IF NOT EXISTS wbz_user_theme (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES wbz_user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT,
  theme JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE wbz_user
  ADD COLUMN IF NOT EXISTS active_theme_id TEXT REFERENCES wbz_user_theme(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wbz_user_theme_user_id ON wbz_user_theme(user_id);
CREATE INDEX IF NOT EXISTS idx_wbz_user_theme_created_at ON wbz_user_theme(user_id, created_at DESC);
