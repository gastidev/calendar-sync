-- Create calendar_sync_syncs table
CREATE TABLE IF NOT EXISTS calendar_sync_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_calendar_id UUID NOT NULL REFERENCES calendar_sync_google_calendars(id) ON DELETE CASCADE,
  target_calendar_id UUID NOT NULL REFERENCES calendar_sync_google_calendars(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sync_direction TEXT NOT NULL DEFAULT 'bidirectional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,

  CONSTRAINT calendar_sync_different_calendars CHECK (source_calendar_id != target_calendar_id),
  CONSTRAINT calendar_sync_unique_sync_pair UNIQUE (source_calendar_id, target_calendar_id)
);

-- Create indexes
CREATE INDEX idx_calendar_sync_syncs_user_id ON calendar_sync_syncs(user_id);
CREATE INDEX idx_calendar_sync_syncs_source_calendar ON calendar_sync_syncs(source_calendar_id);
CREATE INDEX idx_calendar_sync_syncs_target_calendar ON calendar_sync_syncs(target_calendar_id);
CREATE INDEX idx_calendar_sync_syncs_is_active ON calendar_sync_syncs(is_active);
CREATE INDEX idx_calendar_sync_syncs_last_synced ON calendar_sync_syncs(last_synced_at);

-- Create updated_at trigger
CREATE TRIGGER calendar_sync_update_syncs_updated_at
  BEFORE UPDATE ON calendar_sync_syncs
  FOR EACH ROW
  EXECUTE FUNCTION calendar_sync_update_updated_at_column();

-- Enable RLS
ALTER TABLE calendar_sync_syncs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "calendar_sync_users_can_view_their_own_syncs"
  ON calendar_sync_syncs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "calendar_sync_users_can_insert_their_own_syncs"
  ON calendar_sync_syncs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_sync_users_can_update_their_own_syncs"
  ON calendar_sync_syncs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "calendar_sync_users_can_delete_their_own_syncs"
  ON calendar_sync_syncs FOR DELETE
  USING (auth.uid() = user_id);
