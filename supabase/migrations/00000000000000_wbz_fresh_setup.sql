-- WBZero fresh database setup
-- Creates all wbz_* tables from scratch (for new Supabase projects)
-- This is a combined migration — do NOT run on the shared production DB
-- Safe to re-run: uses IF NOT EXISTS and guards throughout

BEGIN;

-- Ensure gen_random_uuid() is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- BetterAuth tables
-- ============================================================

CREATE TABLE IF NOT EXISTS wbz_user (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  name TEXT,
  image TEXT,
  active_theme_id TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wbz_session (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES wbz_user(id) ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT
);

CREATE TABLE IF NOT EXISTS wbz_account (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES wbz_user(id) ON DELETE CASCADE,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wbz_verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Application tables
-- ============================================================

CREATE TABLE IF NOT EXISTS wbz_project (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES wbz_user(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  active_theme_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wbz_chapter (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES wbz_project(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wbz_image (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT NOT NULL REFERENCES wbz_chapter(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  source_text TEXT,
  title TEXT DEFAULT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  parent_id TEXT REFERENCES wbz_image(id),
  refinement_prompt TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wbz_prompt (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES wbz_user(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wbz_chapter_tag (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  chapter_id TEXT NOT NULL REFERENCES wbz_chapter(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chapter_id, tag_name)
);

-- ============================================================
-- Canvas tables
-- ============================================================

CREATE TABLE IF NOT EXISTS wbz_canvas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES wbz_project(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wbz_canvas_node (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES wbz_canvas(id) ON DELETE CASCADE,
  type TEXT,
  label TEXT NOT NULL,
  content TEXT,
  chapter_id TEXT REFERENCES wbz_chapter(id) ON DELETE SET NULL,
  image_id TEXT REFERENCES wbz_image(id) ON DELETE SET NULL,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wbz_canvas_edge (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  canvas_id TEXT NOT NULL REFERENCES wbz_canvas(id) ON DELETE CASCADE,
  from_node_id TEXT NOT NULL REFERENCES wbz_canvas_node(id) ON DELETE CASCADE,
  to_node_id TEXT NOT NULL REFERENCES wbz_canvas_node(id) ON DELETE CASCADE,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Theme tables
-- ============================================================

CREATE TABLE IF NOT EXISTS wbz_project_theme (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL REFERENCES wbz_project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT,
  theme JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wbz_user_theme (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES wbz_user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT,
  theme JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys for active_theme_id (now that theme tables exist)
-- Guarded so re-runs don't fail
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_wbz_project_active_theme'
  ) THEN
    ALTER TABLE wbz_project ADD CONSTRAINT fk_wbz_project_active_theme
      FOREIGN KEY (active_theme_id) REFERENCES wbz_project_theme(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_wbz_user_active_theme'
  ) THEN
    ALTER TABLE wbz_user ADD CONSTRAINT fk_wbz_user_active_theme
      FOREIGN KEY (active_theme_id) REFERENCES wbz_user_theme(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_wbz_session_user_id ON wbz_session("userId");
CREATE INDEX IF NOT EXISTS idx_wbz_session_token ON wbz_session(token);
CREATE INDEX IF NOT EXISTS idx_wbz_account_user_id ON wbz_account("userId");
CREATE INDEX IF NOT EXISTS idx_wbz_project_user_id ON wbz_project(user_id);
CREATE INDEX IF NOT EXISTS idx_wbz_chapter_project_id ON wbz_chapter(project_id);
CREATE INDEX IF NOT EXISTS idx_wbz_chapter_position ON wbz_chapter(project_id, position);
CREATE INDEX IF NOT EXISTS idx_wbz_image_chapter_id ON wbz_image(chapter_id);
CREATE INDEX IF NOT EXISTS idx_wbz_image_parent ON wbz_image(parent_id);
CREATE INDEX IF NOT EXISTS idx_wbz_image_deleted_at ON wbz_image(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wbz_chapter_tag_chapter_id ON wbz_chapter_tag(chapter_id);
CREATE INDEX IF NOT EXISTS idx_wbz_chapter_tag_name ON wbz_chapter_tag(tag_name);
CREATE INDEX IF NOT EXISTS idx_wbz_canvas_project_id ON wbz_canvas(project_id);
CREATE INDEX IF NOT EXISTS idx_wbz_canvas_node_canvas_id ON wbz_canvas_node(canvas_id);
CREATE INDEX IF NOT EXISTS idx_wbz_canvas_edge_canvas_id ON wbz_canvas_edge(canvas_id);
CREATE INDEX IF NOT EXISTS idx_wbz_prompt_user_id ON wbz_prompt(user_id);
CREATE INDEX IF NOT EXISTS idx_wbz_user_theme_user_id ON wbz_user_theme(user_id);
CREATE INDEX IF NOT EXISTS idx_wbz_project_theme_project_id ON wbz_project_theme(project_id);
CREATE INDEX IF NOT EXISTS idx_wbz_project_theme_created_at ON wbz_project_theme(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wbz_user_theme_created_at ON wbz_user_theme(user_id, created_at DESC);

-- ============================================================
-- Triggers
-- ============================================================

-- When an image is soft-deleted, detach its children
CREATE OR REPLACE FUNCTION wbz_image_soft_delete_detach_children()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE wbz_image SET parent_id = NULL WHERE parent_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger (no IF NOT EXISTS for triggers in PostgreSQL)
DROP TRIGGER IF EXISTS trg_wbz_image_soft_delete ON wbz_image;
CREATE TRIGGER trg_wbz_image_soft_delete
  BEFORE UPDATE ON wbz_image
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION wbz_image_soft_delete_detach_children();

COMMIT;
