-- Create calendar_sync_settings table
CREATE TABLE IF NOT EXISTS calendar_sync_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id UUID NOT NULL UNIQUE REFERENCES calendar_sync_syncs(id) ON DELETE CASCADE,
  privacy_mode BOOLEAN NOT NULL DEFAULT false,
  placeholder_text TEXT NOT NULL DEFAULT 'Busy',
  event_filter_type TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT calendar_sync_valid_event_filter CHECK (event_filter_type IN ('all', 'accepted_only'))
);

-- Create index
CREATE INDEX idx_calendar_sync_settings_sync_id ON calendar_sync_settings(sync_id);

-- Create updated_at trigger
CREATE TRIGGER calendar_sync_update_settings_updated_at
  BEFORE UPDATE ON calendar_sync_settings
  FOR EACH ROW
  EXECUTE FUNCTION calendar_sync_update_updated_at_column();

-- Enable RLS
ALTER TABLE calendar_sync_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "calendar_sync_users_can_view_settings_for_their_syncs"
  ON calendar_sync_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_sync_syncs
      WHERE calendar_sync_syncs.id = calendar_sync_settings.sync_id
      AND calendar_sync_syncs.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_sync_users_can_insert_settings_for_their_syncs"
  ON calendar_sync_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_sync_syncs
      WHERE calendar_sync_syncs.id = calendar_sync_settings.sync_id
      AND calendar_sync_syncs.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_sync_users_can_update_settings_for_their_syncs"
  ON calendar_sync_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM calendar_sync_syncs
      WHERE calendar_sync_syncs.id = calendar_sync_settings.sync_id
      AND calendar_sync_syncs.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_sync_users_can_delete_settings_for_their_syncs"
  ON calendar_sync_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM calendar_sync_syncs
      WHERE calendar_sync_syncs.id = calendar_sync_settings.sync_id
      AND calendar_sync_syncs.user_id = auth.uid()
    )
  );
