-- Add directional privacy mode fields to calendar_sync_settings
ALTER TABLE calendar_sync_settings
  ADD COLUMN source_to_target_privacy_mode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN target_to_source_privacy_mode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN source_to_target_placeholder_text TEXT NOT NULL DEFAULT 'Busy',
  ADD COLUMN target_to_source_placeholder_text TEXT NOT NULL DEFAULT 'Busy',
  ADD COLUMN source_to_target_event_filter_type TEXT NOT NULL DEFAULT 'all',
  ADD COLUMN target_to_source_event_filter_type TEXT NOT NULL DEFAULT 'all';

-- Add constraints for new event filter fields
ALTER TABLE calendar_sync_settings
  ADD CONSTRAINT calendar_sync_valid_source_to_target_filter
    CHECK (source_to_target_event_filter_type IN ('all', 'accepted_only')),
  ADD CONSTRAINT calendar_sync_valid_target_to_source_filter
    CHECK (target_to_source_event_filter_type IN ('all', 'accepted_only'));

-- Add constraint for sync_direction in calendar_sync_syncs table
ALTER TABLE calendar_sync_syncs
  ADD CONSTRAINT calendar_sync_valid_sync_direction
    CHECK (sync_direction IN ('bidirectional', 'source_to_target', 'target_to_source'));

-- Migrate existing data: copy privacy_mode to both directional fields
UPDATE calendar_sync_settings
SET
  source_to_target_privacy_mode = privacy_mode,
  target_to_source_privacy_mode = privacy_mode,
  source_to_target_placeholder_text = placeholder_text,
  target_to_source_placeholder_text = placeholder_text,
  source_to_target_event_filter_type = event_filter_type,
  target_to_source_event_filter_type = event_filter_type;
