-- Create calendar_sync_google_calendars table
CREATE TABLE IF NOT EXISTS calendar_sync_google_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES calendar_sync_connections(id) ON DELETE CASCADE,
  google_calendar_id TEXT NOT NULL,
  calendar_name TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT calendar_sync_unique_connection_calendar UNIQUE (connection_id, google_calendar_id)
);

-- Create indexes
CREATE INDEX idx_calendar_sync_google_calendars_connection_id ON calendar_sync_google_calendars(connection_id);
CREATE INDEX idx_calendar_sync_google_calendars_google_id ON calendar_sync_google_calendars(google_calendar_id);

-- Create updated_at trigger
CREATE TRIGGER calendar_sync_update_google_calendars_updated_at
  BEFORE UPDATE ON calendar_sync_google_calendars
  FOR EACH ROW
  EXECUTE FUNCTION calendar_sync_update_updated_at_column();

-- Enable RLS
ALTER TABLE calendar_sync_google_calendars ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "calendar_sync_users_can_view_calendars_from_their_connections"
  ON calendar_sync_google_calendars FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_sync_connections
      WHERE calendar_sync_connections.id = calendar_sync_google_calendars.connection_id
      AND calendar_sync_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_sync_users_can_insert_calendars_for_their_connections"
  ON calendar_sync_google_calendars FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_sync_connections
      WHERE calendar_sync_connections.id = calendar_sync_google_calendars.connection_id
      AND calendar_sync_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_sync_users_can_update_calendars_from_their_connections"
  ON calendar_sync_google_calendars FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM calendar_sync_connections
      WHERE calendar_sync_connections.id = calendar_sync_google_calendars.connection_id
      AND calendar_sync_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_sync_users_can_delete_calendars_from_their_connections"
  ON calendar_sync_google_calendars FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM calendar_sync_connections
      WHERE calendar_sync_connections.id = calendar_sync_google_calendars.connection_id
      AND calendar_sync_connections.user_id = auth.uid()
    )
  );
