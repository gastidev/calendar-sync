"use client"

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

export interface Connection {
  id: string;
  provider: string;
  provider_account_id: string;
  calendar_prefix: string;
  color_tag: string;
  is_active: boolean;
  created_at: string;
  calendars: Calendar[];
}

export interface Calendar {
  id: string;
  connection_id: string;
  google_calendar_id: string;
  calendar_name: string;
  is_primary: boolean;
  timezone: string;
}

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const data = await api.connections.list();
      setConnections(data.connections);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      await api.connections.delete(id);
      await fetchConnections();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  return {
    connections,
    loading,
    error,
    refetch: fetchConnections,
    deleteConnection,
  };
}
