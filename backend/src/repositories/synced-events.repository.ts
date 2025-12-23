import { supabase } from '../config/database';
import { SyncedEvent } from '../types/database.types';

export class SyncedEventsRepository {
  async create(data: {
    sync_id: string;
    source_event_id: string;
    target_event_id: string;
    source_calendar_id: string;
    target_calendar_id: string;
    last_source_updated: Date;
  }): Promise<SyncedEvent> {
    const { data: event, error } = await supabase
      .from('calendar_sync_synced_events')
      .insert({
        ...data,
        last_source_updated: data.last_source_updated.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return event;
  }

  async findBySyncId(syncId: string): Promise<SyncedEvent[]> {
    const { data, error } = await supabase
      .from('calendar_sync_synced_events')
      .select('*')
      .eq('sync_id', syncId);

    if (error) throw error;
    return data || [];
  }

  async findBySourceEvent(syncId: string, sourceEventId: string): Promise<SyncedEvent | null> {
    const { data, error } = await supabase
      .from('calendar_sync_synced_events')
      .select('*')
      .eq('sync_id', syncId)
      .eq('source_event_id', sourceEventId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByTargetEvent(calendarId: string, targetEventId: string): Promise<SyncedEvent | null> {
    const { data, error } = await supabase
      .from('calendar_sync_synced_events')
      .select('*')
      .eq('target_calendar_id', calendarId)
      .eq('target_event_id', targetEventId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findBySourceCalendarAndEvent(calendarId: string, sourceEventId: string): Promise<SyncedEvent | null> {
    const { data, error } = await supabase
      .from('calendar_sync_synced_events')
      .select('*')
      .eq('source_calendar_id', calendarId)
      .eq('source_event_id', sourceEventId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async update(id: string, data: {
    target_event_id?: string;
    last_source_updated?: Date;
  }): Promise<SyncedEvent> {
    const updateData: any = {};
    if (data.target_event_id) updateData.target_event_id = data.target_event_id;
    if (data.last_source_updated) updateData.last_source_updated = data.last_source_updated.toISOString();

    const { data: event, error } = await supabase
      .from('calendar_sync_synced_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return event;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_sync_synced_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteBySyncId(syncId: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_sync_synced_events')
      .delete()
      .eq('sync_id', syncId);

    if (error) throw error;
  }
}

export const syncedEventsRepository = new SyncedEventsRepository();
