-- Add directional prefix columns to calendar_sync_settings table
ALTER TABLE calendar_sync_settings
ADD COLUMN IF NOT EXISTS source_to_target_prefix TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS target_to_source_prefix TEXT DEFAULT '';
