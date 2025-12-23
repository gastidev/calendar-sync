export interface CalendarConnection {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  calendar_prefix: string;
  color_tag: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoogleCalendar {
  id: string;
  connection_id: string;
  google_calendar_id: string;
  calendar_name: string;
  is_primary: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarSync {
  id: string;
  user_id: string;
  source_calendar_id: string;
  target_calendar_id: string;
  is_active: boolean;
  sync_direction: 'bidirectional' | 'source_to_target' | 'target_to_source';
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
}

export interface SyncSettings {
  id: string;
  sync_id: string;
  privacy_mode: boolean;
  placeholder_text: string;
  event_filter_type: 'all' | 'accepted_only';
  source_to_target_privacy_mode: boolean;
  target_to_source_privacy_mode: boolean;
  source_to_target_placeholder_text: string;
  target_to_source_placeholder_text: string;
  source_to_target_event_filter_type: 'all' | 'accepted_only';
  target_to_source_event_filter_type: 'all' | 'accepted_only';
  source_to_target_prefix: string;
  target_to_source_prefix: string;
  created_at: string;
  updated_at: string;
}

export interface SyncedEvent {
  id: string;
  sync_id: string;
  source_event_id: string;
  target_event_id: string;
  source_calendar_id: string;
  target_calendar_id: string;
  last_source_updated: string;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  sync_id: string;
  status: 'success' | 'error' | 'partial';
  events_processed: number;
  events_created: number;
  events_updated: number;
  events_deleted: number;
  error_message: string | null;
  started_at: string;
  completed_at: string;
}

export interface WebhookSubscription {
  id: string;
  calendar_id: string;
  google_channel_id: string;
  google_resource_id: string;
  expiration_time: string;
  created_at: string;
}
