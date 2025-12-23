import { calendar_v3 } from "googleapis";

export type GoogleEvent = calendar_v3.Schema$Event;
export type GoogleCalendarList = calendar_v3.Schema$CalendarListEntry;

export interface TokenInfo {
  access_token: string;
  refresh_token: string;
  expires_at: Date;
}

export interface EventTransformOptions {
  privacyMode: boolean;
  placeholderText: string;
}
