-- Create calendar_sync_synced_events table
CREATE TABLE IF NOT EXISTS calendar_sync_synced_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id UUID NOT NULL REFERENCES calendar_sync_syncs(id) ON DELETE CASCADE,
  source_event_id TEXT NOT NULL,
  target_event_id TEXT NOT NULL,
  source_calendar_id UUID NOT NULL REFERENCES calendar_sync_google_calendars(id) ON DELETE CASCADE,
  target_calendar_id UUID NOT NULL REFERENCES calendar_sync_google_calendars(id) ON DELETE CASCADE,
  last_source_updated TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT calendar_sync_unique_sync_source_event UNIQUE (sync_id, source_event_id)
);

-- Create indexes for fast lookups and loop prevention
CREATE INDEX idx_calendar_sync_synced_events_sync_id ON calendar_sync_synced_events(sync_id);
CREATE INDEX idx_calendar_sync_synced_events_source ON calendar_sync_synced_events(source_calendar_id, source_event_id);
CREATE INDEX idx_calendar_sync_synced_events_target ON calendar_sync_synced_events(target_calendar_id, target_event_id);
CREATE INDEX idx_calendar_sync_synced_events_last_updated ON calendar_sync_synced_events(last_source_updated);

-- Create updated_at trigger
CREATE TRIGGER calendar_sync_update_synced_events_updated_at
  BEFORE UPDATE ON calendar_sync_synced_events
  FOR EACH ROW
  EXECUTE FUNCTION calendar_sync_update_updated_at_column();

-- Enable RLS
ALTER TABLE calendar_sync_synced_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "calendar_sync_users_can_view_synced_events_for_their_syncs"
  ON calendar_sync_synced_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_sync_syncs
      WHERE calendar_sync_syncs.id = calendar_sync_synced_events.sync_id
      AND calendar_sync_syncs.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_sync_service_role_can_manage_synced_events"
  ON calendar_sync_synced_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
