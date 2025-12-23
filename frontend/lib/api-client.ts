import { createClient } from "./supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

export const api = {
  connections: {
    list: () => apiRequest<{ connections: any[] }>("/api/v1/connections"),
    delete: (id: string) =>
      apiRequest(`/api/v1/connections/${id}`, { method: "DELETE" }),
    getCalendars: (id: string) =>
      apiRequest<{ calendars: any[] }>(`/api/v1/connections/${id}/calendars`),
    updateColor: (id: string, colorTag: string) =>
      apiRequest(`/api/v1/connections/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ colorTag }),
      }),
  },
  syncs: {
    list: () => apiRequest<{ syncs: any[] }>("/api/v1/syncs"),
    create: (data: { sourceCalendarId: string; targetCalendarId: string }) =>
      apiRequest("/api/v1/syncs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getById: (id: string) => apiRequest<{ sync: any }>(`/api/v1/syncs/${id}`),
    update: (
      id: string,
      data: {
        isActive?: boolean;
        syncDirection?:
          | "bidirectional"
          | "source_to_target"
          | "target_to_source";
      }
    ) =>
      apiRequest(`/api/v1/syncs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      apiRequest(`/api/v1/syncs/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ id }),
      }),
    getSettings: (id: string) =>
      apiRequest<{ settings: any }>(`/api/v1/syncs/${id}/settings`),
    updateSettings: (id: string, data: any) =>
      apiRequest(`/api/v1/syncs/${id}/settings`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    trigger: (id: string) =>
      apiRequest(`/api/v1/syncs/${id}/trigger`, {
        method: "POST",
        body: JSON.stringify({ id }),
      }),
    getLogs: (id: string) =>
      apiRequest<{ logs: any[] }>(`/api/v1/syncs/${id}/logs`),
  },
};
