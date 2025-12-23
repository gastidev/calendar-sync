-- Create calendar_sync_webhook_subscriptions table
CREATE TABLE IF NOT EXISTS calendar_sync_webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL UNIQUE REFERENCES calendar_sync_google_calendars(id) ON DELETE CASCADE,
  google_channel_id TEXT NOT NULL,
  google_resource_id TEXT NOT NULL,
  expiration_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_calendar_sync_webhook_subscriptions_calendar_id ON calendar_sync_webhook_subscriptions(calendar_id);
CREATE INDEX idx_calendar_sync_webhook_subscriptions_expiration ON calendar_sync_webhook_subscriptions(expiration_time);
CREATE INDEX idx_calendar_sync_webhook_subscriptions_channel_id ON calendar_sync_webhook_subscriptions(google_channel_id);

-- Enable RLS
ALTER TABLE calendar_sync_webhook_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "calendar_sync_users_can_view_webhook_subscriptions_for_their_calendars"
  ON calendar_sync_webhook_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_sync_google_calendars
      JOIN calendar_sync_connections ON calendar_sync_connections.id = calendar_sync_google_calendars.connection_id
      WHERE calendar_sync_google_calendars.id = calendar_sync_webhook_subscriptions.calendar_id
      AND calendar_sync_connections.user_id = auth.uid()
    )
  );

CREATE POLICY "calendar_sync_service_role_can_manage_webhook_subscriptions"
  ON calendar_sync_webhook_subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
