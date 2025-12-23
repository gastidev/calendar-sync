import { supabase } from '../config/database';
import { CalendarSync, SyncSettings, SyncLog } from '../types/database.types';

export class SyncsRepository {
  async create(data: {
    user_id: string;
    source_calendar_id: string;
    target_calendar_id: string;
  }): Promise<CalendarSync> {
    const { data: sync, error } = await supabase
      .from('calendar_sync_syncs')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('calendar_sync_settings').insert({ sync_id: sync.id });

    return sync;
  }

  async findById(id: string): Promise<CalendarSync | null> {
    const { data, error } = await supabase
      .from('calendar_sync_syncs')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByUserId(userId: string): Promise<CalendarSync[]> {
    const { data, error } = await supabase
      .from('calendar_sync_syncs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findActiveSyncs(): Promise<CalendarSync[]> {
    const { data, error } = await supabase
      .from('calendar_sync_syncs')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('calendar_sync_syncs')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  }

  async updateSyncDirection(id: string, syncDirection: 'bidirectional' | 'source_to_target' | 'target_to_source'): Promise<void> {
    const { error } = await supabase
      .from('calendar_sync_syncs')
      .update({ sync_direction: syncDirection })
      .eq('id', id);

    if (error) throw error;
  }

  async updateLastSyncedAt(id: string): Promise<void> {
    const { error} = await supabase
      .from('calendar_sync_syncs')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_sync_syncs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getSettings(syncId: string): Promise<SyncSettings | null> {
    const { data, error } = await supabase
      .from('calendar_sync_settings')
      .select('*')
      .eq('sync_id', syncId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateSettings(
    syncId: string,
    settings: Partial<Pick<SyncSettings, 'privacy_mode' | 'placeholder_text' | 'event_filter_type' | 'source_to_target_privacy_mode' | 'target_to_source_privacy_mode' | 'source_to_target_placeholder_text' | 'target_to_source_placeholder_text' | 'source_to_target_event_filter_type' | 'target_to_source_event_filter_type' | 'source_to_target_prefix' | 'target_to_source_prefix'>>
  ): Promise<SyncSettings> {
    const { data, error } = await supabase
      .from('calendar_sync_settings')
      .update(settings)
      .eq('sync_id', syncId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createLog(data: {
    sync_id: string;
    status: 'success' | 'error' | 'partial';
    events_processed: number;
    events_created: number;
    events_updated: number;
    events_deleted: number;
    error_message?: string;
    started_at: Date;
    completed_at: Date;
  }): Promise<SyncLog> {
    const { data: log, error } = await supabase
      .from('calendar_sync_logs')
      .insert({
        ...data,
        started_at: data.started_at.toISOString(),
        completed_at: data.completed_at.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return log;
  }

  async getLogsBySyncId(syncId: string, limit: number = 50): Promise<SyncLog[]> {
    const { data, error } = await supabase
      .from('calendar_sync_logs')
      .select('*')
      .eq('sync_id', syncId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

export const syncsRepository = new SyncsRepository();
