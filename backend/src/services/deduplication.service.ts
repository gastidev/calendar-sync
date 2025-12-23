import { syncedEventsRepository } from '../repositories/synced-events.repository';

export class DeduplicationService {
  async isEventSynced(syncId: string, sourceEventId: string): Promise<boolean> {
    const existing = await syncedEventsRepository.findBySourceEvent(syncId, sourceEventId);
    return !!existing;
  }

  async findSourceEvent(calendarId: string, targetEventId: string): Promise<string | null> {
    const syncedEvent = await syncedEventsRepository.findByTargetEvent(calendarId, targetEventId);
    return syncedEvent ? syncedEvent.source_event_id : null;
  }

  async isEventFromCalendar(calendarId: string, sourceEventId: string): Promise<boolean> {
    const syncedEvent = await syncedEventsRepository.findBySourceCalendarAndEvent(calendarId, sourceEventId);
    return !!syncedEvent;
  }

  async getTargetEventId(syncId: string, sourceEventId: string): Promise<string | null> {
    const syncedEvent = await syncedEventsRepository.findBySourceEvent(syncId, sourceEventId);
    return syncedEvent ? syncedEvent.target_event_id : null;
  }

  async markEventAsSynced(data: {
    syncId: string;
    sourceEventId: string;
    targetEventId: string;
    sourceCalendarId: string;
    targetCalendarId: string;
    lastSourceUpdated: Date;
  }): Promise<void> {
    const existing = await syncedEventsRepository.findBySourceEvent(data.syncId, data.sourceEventId);

    if (existing) {
      await syncedEventsRepository.update(existing.id, {
        target_event_id: data.targetEventId,
        last_source_updated: data.lastSourceUpdated,
      });
    } else {
      await syncedEventsRepository.create({
        sync_id: data.syncId,
        source_event_id: data.sourceEventId,
        target_event_id: data.targetEventId,
        source_calendar_id: data.sourceCalendarId,
        target_calendar_id: data.targetCalendarId,
        last_source_updated: data.lastSourceUpdated,
      });
    }
  }

  async removeEventMapping(syncId: string, sourceEventId: string): Promise<void> {
    const syncedEvent = await syncedEventsRepository.findBySourceEvent(syncId, sourceEventId);
    if (syncedEvent) {
      await syncedEventsRepository.delete(syncedEvent.id);
    }
  }

  async getAllMappings(syncId: string): Promise<Map<string, { targetEventId: string; lastUpdated: Date; isReverse: boolean }>> {
    const events = await syncedEventsRepository.findBySyncId(syncId);
    const map = new Map<string, { targetEventId: string; lastUpdated: Date; isReverse: boolean }>();

    for (const event of events) {
      map.set(event.source_event_id, {
        targetEventId: event.target_event_id,
        lastUpdated: new Date(event.last_source_updated),
        isReverse: false,
      });

      map.set(event.target_event_id, {
        targetEventId: event.source_event_id,
        lastUpdated: new Date(event.last_source_updated),
        isReverse: true,
      });
    }

    return map;
  }
}

export const deduplicationService = new DeduplicationService();
