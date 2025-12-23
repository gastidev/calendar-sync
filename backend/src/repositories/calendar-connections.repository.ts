import { supabase } from '../config/database';
import { CalendarConnection, GoogleCalendar } from '../types/database.types';

export class CalendarConnectionsRepository {
  async create(data: {
    user_id: string;
    provider: string;
    provider_account_id: string;
    access_token: string;
    refresh_token: string;
    token_expires_at: Date;
    calendar_prefix: string;
    color_tag: string;
  }): Promise<CalendarConnection> {
    const { data: connection, error } = await supabase
      .from('calendar_sync_connections')
      .insert({
        ...data,
        token_expires_at: data.token_expires_at.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return connection;
  }

  async findById(id: string): Promise<CalendarConnection | null> {
    const { data, error } = await supabase
      .from('calendar_sync_connections')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findByUserId(userId: string): Promise<CalendarConnection[]> {
    const { data, error } = await supabase
      .from('calendar_sync_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date
  ): Promise<CalendarConnection> {
    const { data, error } = await supabase
      .from('calendar_sync_connections')
      .update({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt.toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('calendar_sync_connections')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  }

  async updateColor(id: string, colorTag: string): Promise<CalendarConnection> {
    const { data, error } = await supabase
      .from('calendar_sync_connections')
      .update({ color_tag: colorTag })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_sync_connections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async createGoogleCalendar(data: {
    connection_id: string;
    google_calendar_id: string;
    calendar_name: string;
    is_primary: boolean;
    timezone: string;
  }): Promise<GoogleCalendar> {
    const { data: calendar, error } = await supabase
      .from('calendar_sync_google_calendars')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return calendar;
  }

  async findCalendarsByConnectionId(connectionId: string): Promise<GoogleCalendar[]> {
    const { data, error } = await supabase
      .from('calendar_sync_google_calendars')
      .select('*')
      .eq('connection_id', connectionId)
      .order('is_primary', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async findCalendarById(id: string): Promise<GoogleCalendar | null> {
    const { data, error } = await supabase
      .from('calendar_sync_google_calendars')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

export const calendarConnectionsRepository = new CalendarConnectionsRepository();
