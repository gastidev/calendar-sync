-- Create calendar_sync_connections table
CREATE TABLE IF NOT EXISTS calendar_sync_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  calendar_prefix TEXT NOT NULL,
  color_tag TEXT NOT NULL DEFAULT '#3B82F6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT calendar_sync_unique_user_provider_account UNIQUE (user_id, provider, provider_account_id)
);

-- Create index for faster lookups
CREATE INDEX idx_calendar_sync_connections_user_id ON calendar_sync_connections(user_id);
CREATE INDEX idx_calendar_sync_connections_is_active ON calendar_sync_connections(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION calendar_sync_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_sync_update_connections_updated_at
  BEFORE UPDATE ON calendar_sync_connections
  FOR EACH ROW
  EXECUTE FUNCTION calendar_sync_update_updated_at_column();

-- Enable RLS
ALTER TABLE calendar_sync_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "calendar_sync_users_can_view_own_connections"
  ON calendar_sync_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "calendar_sync_users_can_insert_own_connections"
  ON calendar_sync_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_sync_users_can_update_own_connections"
  ON calendar_sync_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "calendar_sync_users_can_delete_own_connections"
  ON calendar_sync_connections FOR DELETE
  USING (auth.uid() = user_id);
