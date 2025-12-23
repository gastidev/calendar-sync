-- Create calendar_sync_logs table
CREATE TABLE IF NOT EXISTS calendar_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id UUID NOT NULL REFERENCES calendar_sync_syncs(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  events_processed INTEGER NOT NULL DEFAULT 0,
  events_created INTEGER NOT NULL DEFAULT 0,
  events_updated INTEGER NOT NULL DEFAULT 0,
  events_deleted INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT calendar_sync_valid_status CHECK (status IN ('success', 'error', 'partial'))
);

-- Create indexes
CREATE INDEX idx_calendar_sync_logs_sync_id ON calendar_sync_logs(sync_id);
CREATE INDEX idx_calendar_sync_logs_started_at ON calendar_sync_logs(sync_id, started_at DESC);
CREATE INDEX idx_calendar_sync_logs_status ON calendar_sync_logs(status);

-- Enable RLS
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "calendar_sync_users_can_view_logs_for_their_syncs"
  ON calendar_sync_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_sync_syncs
      WHERE calendar_sync_syncs.id = calendar_sync_logs.sync_id
      AND calendar_sync_syncs.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_sync_service_role_can_manage_logs"
  ON calendar_sync_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
