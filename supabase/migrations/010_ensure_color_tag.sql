-- Ensure color_tag column exists and set default for existing records
-- This migration is safe to run multiple times

-- Add color_tag column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calendar_sync_connections' 
    AND column_name = 'color_tag'
  ) THEN
    ALTER TABLE calendar_sync_connections
    ADD COLUMN color_tag TEXT NOT NULL DEFAULT '#3B82F6';
  END IF;
END $$;

-- Update any existing records that might have NULL color_tag
UPDATE calendar_sync_connections
SET color_tag = '#3B82F6'
WHERE color_tag IS NULL OR color_tag = '';

