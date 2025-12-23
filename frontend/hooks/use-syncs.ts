"use client"

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

export interface Sync {
  id: string;
  user_id: string;
  source_calendar_id: string;
  target_calendar_id: string;
  is_active: boolean;
  sync_direction: string;
  created_at: string;
  last_synced_at: string | null;
}

export interface SyncSettings {
  id: string;
  sync_id: string;
  privacy_mode: boolean;
  placeholder_text: string;
  event_filter_type: 'all' | 'accepted_only';
}

export function useSyncs() {
  const [syncs, setSyncs] = useState<Sync[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncs = async () => {
    try {
      setLoading(true);
      const data = await api.syncs.list();
      setSyncs(data.syncs);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSync = async (sourceCalendarId: string, targetCalendarId: string) => {
    try {
      await api.syncs.create({ sourceCalendarId, targetCalendarId });
      await fetchSyncs();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const toggleSync = async (id: string, isActive: boolean) => {
    try {
      await api.syncs.update(id, { isActive });
      await fetchSyncs();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteSync = async (id: string) => {
    try {
      await api.syncs.delete(id);
      await fetchSyncs();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const triggerSync = async (id: string) => {
    try {
      await api.syncs.trigger(id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchSyncs();
  }, []);

  return {
    syncs,
    loading,
    error,
    refetch: fetchSyncs,
    createSync,
    toggleSync,
    deleteSync,
    triggerSync,
  };
}
