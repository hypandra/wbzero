-- Add title column to wbz_image
ALTER TABLE wbz_image ADD COLUMN title TEXT DEFAULT NULL;

-- Backfill existing images with truncated source_text
UPDATE wbz_image SET title = LEFT(source_text, 50) WHERE source_text IS NOT NULL;
