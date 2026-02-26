-- Soft delete support for wbz_image
ALTER TABLE wbz_image ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- When an image is soft-deleted, detach its children (set parent_id to NULL)
CREATE OR REPLACE FUNCTION wbz_image_soft_delete_detach_children()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE wbz_image SET parent_id = NULL WHERE parent_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wbz_image_soft_delete
  BEFORE UPDATE ON wbz_image
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION wbz_image_soft_delete_detach_children();

-- Index for cleanup cron to find soft-deleted images efficiently
CREATE INDEX idx_wbz_image_deleted_at ON wbz_image(deleted_at) WHERE deleted_at IS NOT NULL;
