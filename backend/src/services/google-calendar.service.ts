import { google, calendar_v3 } from 'googleapis';
import { oauth2Client } from '../config/google-oauth';
import { TokenInfo, GoogleEvent, GoogleCalendarList } from '../types/google.types';
import { env } from '../config/env';

export class GoogleCalendarService {
  async exchangeCodeForTokens(code: string): Promise<TokenInfo> {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from Google');
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(tokens.expiry_date!),
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenInfo> {
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    return {
      access_token: credentials.access_token,
      refresh_token: refreshToken,
      expires_at: new Date(credentials.expiry_date!),
    };
  }

  async getUserInfo(accessToken: string): Promise<{ email: string; name: string }> {
    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return {
      email: data.email!,
      name: data.name || data.email!,
    };
  }

  async listCalendars(accessToken: string): Promise<GoogleCalendarList[]> {
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { data } = await calendar.calendarList.list();

    return data.items || [];
  }

  async listEvents(
    accessToken: string,
    calendarId: string,
    options: {
      timeMin?: Date;
      timeMax?: Date;
      maxResults?: number;
      syncToken?: string;
      pageToken?: string;
    } = {}
  ): Promise<{ events: GoogleEvent[]; nextPageToken?: string; nextSyncToken?: string }> {
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const { data } = await calendar.events.list({
      calendarId,
      timeMin: options.timeMin?.toISOString(),
      timeMax: options.timeMax?.toISOString(),
      maxResults: options.maxResults || 2500,
      singleEvents: true,
      orderBy: 'startTime',
      syncToken: options.syncToken,
      pageToken: options.pageToken,
    });

    return {
      events: data.items || [],
      nextPageToken: data.nextPageToken,
      nextSyncToken: data.nextSyncToken,
    };
  }

  async createEvent(
    accessToken: string,
    calendarId: string,
    event: calendar_v3.Schema$Event
  ): Promise<GoogleEvent> {
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const { data } = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return data;
  }

  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: calendar_v3.Schema$Event
  ): Promise<GoogleEvent> {
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const { data } = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    });

    return data;
  }

  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId,
      eventId,
    });
  }

  async setupWebhook(
    accessToken: string,
    calendarId: string,
    channelId: string
  ): Promise<{ channelId: string; resourceId: string; expiration: Date }> {
    if (!env.WEBHOOK_BASE_URL) {
      throw new Error('WEBHOOK_BASE_URL not configured');
    }

    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const { data } = await calendar.events.watch({
      calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: `${env.WEBHOOK_BASE_URL}/webhooks/google`,
      },
    });

    return {
      channelId: data.id!,
      resourceId: data.resourceId!,
      expiration: new Date(parseInt(data.expiration!)),
    };
  }

  async stopWebhook(
    accessToken: string,
    channelId: string,
    resourceId: string
  ): Promise<void> {
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.channels.stop({
      requestBody: {
        id: channelId,
        resourceId,
      },
    });
  }
}

export const googleCalendarService = new GoogleCalendarService();
