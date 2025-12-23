import { googleCalendarService } from "./google-calendar.service";
import { deduplicationService } from "./deduplication.service";
import { calendarConnectionsRepository } from "../repositories/calendar-connections.repository";
import { syncsRepository } from "../repositories/syncs.repository";
import { GoogleEvent } from "../types/google.types";
import {
  CalendarSync,
  SyncSettings,
  GoogleCalendar,
} from "../types/database.types";
import { getColorIdFromHex } from "../utils/color-mapper";

export class SyncEngineService {
  async executeSyncJob(syncId: string): Promise<{
    status: "success" | "error" | "partial";
    eventsProcessed: number;
    eventsCreated: number;
    eventsUpdated: number;
    eventsDeleted: number;
    errorMessage?: string;
  }> {
    const startedAt = new Date();
    let stats = {
      status: "success" as "success" | "error" | "partial",
      eventsProcessed: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      errorMessage: undefined as string | undefined,
    };

    try {
      const sync = await syncsRepository.findById(syncId);
      if (!sync || !sync.is_active) {
        throw new Error("Sync not found or inactive");
      }

      const settings = await syncsRepository.getSettings(syncId);
      if (!settings) {
        throw new Error("Sync settings not found");
      }

      const sourceCalendar =
        await calendarConnectionsRepository.findCalendarById(
          sync.source_calendar_id
        );
      const targetCalendar =
        await calendarConnectionsRepository.findCalendarById(
          sync.target_calendar_id
        );

      if (!sourceCalendar || !targetCalendar) {
        throw new Error("Source or target calendar not found");
      }

      const sourceConnection = await calendarConnectionsRepository.findById(
        sourceCalendar.connection_id
      );
      const targetConnection = await calendarConnectionsRepository.findById(
        targetCalendar.connection_id
      );

      if (!sourceConnection || !targetConnection) {
        throw new Error("Calendar connections not found");
      }

      const sourceToken = await this.ensureValidToken(sourceConnection);
      const targetToken = await this.ensureValidToken(targetConnection);

      let sourceToTargetStats = {
        processed: 0,
        created: 0,
        updated: 0,
        deleted: 0,
      };
      let targetToSourceStats = {
        processed: 0,
        created: 0,
        updated: 0,
        deleted: 0,
      };

      if (
        sync.sync_direction === "bidirectional" ||
        sync.sync_direction === "source_to_target"
      ) {
        sourceToTargetStats = await this.syncDirection(
          sync,
          settings,
          sourceCalendar,
          targetCalendar,
          sourceToken,
          targetToken,
          sourceConnection,
          "source_to_target"
        );
      }

      if (sync.sync_direction === "bidirectional") {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (
        sync.sync_direction === "bidirectional" ||
        sync.sync_direction === "target_to_source"
      ) {
        targetToSourceStats = await this.syncDirection(
          sync,
          settings,
          targetCalendar,
          sourceCalendar,
          targetToken,
          sourceToken,
          targetConnection,
          "target_to_source"
        );
      }

      stats.eventsProcessed =
        sourceToTargetStats.processed + targetToSourceStats.processed;
      stats.eventsCreated =
        sourceToTargetStats.created + targetToSourceStats.created;
      stats.eventsUpdated =
        sourceToTargetStats.updated + targetToSourceStats.updated;
      stats.eventsDeleted =
        sourceToTargetStats.deleted + targetToSourceStats.deleted;

      await syncsRepository.updateLastSyncedAt(syncId);
    } catch (error: any) {
      stats.status = "error";
      stats.errorMessage = error.message || "Unknown error";
    }

    const completedAt = new Date();

    await syncsRepository.createLog({
      sync_id: syncId,
      status: stats.status,
      events_processed: stats.eventsProcessed,
      events_created: stats.eventsCreated,
      events_updated: stats.eventsUpdated,
      events_deleted: stats.eventsDeleted,
      error_message: stats.errorMessage,
      started_at: startedAt,
      completed_at: completedAt,
    });

    return stats;
  }

  private async syncDirection(
    sync: CalendarSync,
    settings: SyncSettings,
    sourceCalendar: GoogleCalendar,
    targetCalendar: GoogleCalendar,
    sourceToken: string,
    targetToken: string,
    sourceConnection: any,
    direction: "source_to_target" | "target_to_source"
  ): Promise<{
    processed: number;
    created: number;
    updated: number;
    deleted: number;
  }> {
    const stats = { processed: 0, created: 0, updated: 0, deleted: 0 };

    const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const timeMax = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    console.log(
      `[SYNC ${direction}] Fetching events from ${sourceCalendar.calendar_name} (${sourceCalendar.google_calendar_id})`
    );
    console.log(
      `[SYNC ${direction}] Time window: ${timeMin.toISOString()} to ${timeMax.toISOString()}`
    );

    const { events: sourceEvents } = await googleCalendarService.listEvents(
      sourceToken,
      sourceCalendar.google_calendar_id,
      { timeMin, timeMax }
    );

    console.log(
      `[SYNC ${direction}] Found ${sourceEvents.length} events in source calendar`
    );

    const filteredEvents = this.applyEventFilter(
      sourceEvents,
      settings,
      direction
    );
    console.log(
      `[SYNC ${direction}] After filter: ${
        filteredEvents.length
      } events (filter type: ${
        direction === "source_to_target"
          ? settings.source_to_target_event_filter_type
          : settings.target_to_source_event_filter_type
      })`
    );

    const mappings = await deduplicationService.getAllMappings(sync.id);
    console.log(`[SYNC ${direction}] Existing mappings: ${mappings.size}`);

    for (const event of filteredEvents) {
      if (!event.id) {
        console.log(
          `[SYNC ${direction}] Skipping event without ID: ${event.summary}`
        );
        continue;
      }

      stats.processed++;
      console.log(
        `[SYNC ${direction}] Processing event ${stats.processed}: "${event.summary}" (${event.id})`
      );

      try {
        const transformedEvent = this.transformEventForPrivacy(
          event,
          settings,
          direction,
          sourceConnection.color_tag
        );
        const existingMapping = mappings.get(event.id);

        if (existingMapping) {
          if (existingMapping.isReverse) {
            console.log(
              `[SYNC ${direction}] Loop detected (reverse mapping), skipping: ${event.summary} (${event.id})`
            );
            continue;
          }

          const eventUpdated = new Date(event.updated!);
          if (eventUpdated > existingMapping.lastUpdated) {
            console.log(
              `[SYNC ${direction}] Updating existing event in ${targetCalendar.calendar_name}: ${event.summary}`
            );
            await googleCalendarService.updateEvent(
              targetToken,
              targetCalendar.google_calendar_id,
              existingMapping.targetEventId,
              transformedEvent
            );
            stats.updated++;

            await deduplicationService.markEventAsSynced({
              syncId: sync.id,
              sourceEventId: event.id,
              targetEventId: existingMapping.targetEventId,
              sourceCalendarId: sourceCalendar.id,
              targetCalendarId: targetCalendar.id,
              lastSourceUpdated: eventUpdated,
            });
          } else {
            console.log(
              `[SYNC ${direction}] Event not updated (no changes): ${event.summary}`
            );
          }
        } else {
          console.log(
            `[SYNC ${direction}] Creating new event in ${targetCalendar.calendar_name}: ${event.summary}`
          );
          console.log(
            `[SYNC ${direction}] Event details:`,
            JSON.stringify(transformedEvent, null, 2)
          );

          const createdEvent = await googleCalendarService.createEvent(
            targetToken,
            targetCalendar.google_calendar_id,
            transformedEvent
          );

          console.log(
            `[SYNC ${direction}] Created event with ID: ${createdEvent.id}`
          );

          if (createdEvent.id) {
            stats.created++;

            await deduplicationService.markEventAsSynced({
              syncId: sync.id,
              sourceEventId: event.id,
              targetEventId: createdEvent.id,
              sourceCalendarId: sourceCalendar.id,
              targetCalendarId: targetCalendar.id,
              lastSourceUpdated: new Date(event.updated!),
            });
            console.log(
              `[SYNC ${direction}] Saved mapping: ${event.id} -> ${createdEvent.id}`
            );
          }
        }
      } catch (error: any) {
        console.error(
          `[SYNC ${direction}] Error syncing event "${event.summary}":`,
          error.message
        );
        console.error(`[SYNC ${direction}] Error details:`, error);
        continue;
      }
    }

    console.log(
      `[SYNC ${direction}] Sync complete - Processed: ${stats.processed}, Created: ${stats.created}, Updated: ${stats.updated}`
    );
    return stats;
  }

  private applyEventFilter(
    events: GoogleEvent[],
    settings: SyncSettings,
    direction: "source_to_target" | "target_to_source"
  ): GoogleEvent[] {
    const filterType =
      direction === "source_to_target"
        ? settings.source_to_target_event_filter_type
        : settings.target_to_source_event_filter_type;

    if (filterType === "all") {
      return events;
    }

    return events.filter((event) => {
      if (!event.attendees || event.attendees.length === 0) {
        return true;
      }

      if (event.organizer?.self) {
        return true;
      }

      return event.attendees.some(
        (attendee) => attendee.self && attendee.responseStatus === "accepted"
      );
    });
  }

  private transformEventForPrivacy(
    event: GoogleEvent,
    settings: SyncSettings,
    direction: "source_to_target" | "target_to_source",
    sourceConnectionColor?: string
  ): GoogleEvent {
    const privacyMode =
      direction === "source_to_target"
        ? settings.source_to_target_privacy_mode
        : settings.target_to_source_privacy_mode;

    const placeholderText =
      direction === "source_to_target"
        ? settings.source_to_target_placeholder_text
        : settings.target_to_source_placeholder_text;

    const prefix =
      direction === "source_to_target"
        ? settings.source_to_target_prefix
        : settings.target_to_source_prefix;

    const cleanEvent: GoogleEvent = {
      summary: privacyMode
        ? placeholderText
        : prefix
        ? `${prefix}${event.summary}`
        : event.summary,
      start: event.start,
      end: event.end,
    };

    // Apply color from source calendar connection
    if (sourceConnectionColor) {
      cleanEvent.colorId = getColorIdFromHex(sourceConnectionColor);
    }

    return cleanEvent;
  }

  private async ensureValidToken(connection: any): Promise<string> {
    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();

    if (expiresAt > now) {
      return connection.access_token;
    }

    const tokenInfo = await googleCalendarService.refreshAccessToken(
      connection.refresh_token
    );

    await calendarConnectionsRepository.updateTokens(
      connection.id,
      tokenInfo.access_token,
      tokenInfo.refresh_token,
      tokenInfo.expires_at
    );

    return tokenInfo.access_token;
  }
}

export const syncEngineService = new SyncEngineService();
