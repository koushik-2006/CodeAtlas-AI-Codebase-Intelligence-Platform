import { GlobalSearchResponse } from "@/types/search";
import { DbActivityEvent, DbNotification, DbUserSettings } from "@/types/database";
import { apiClient } from "./api-client";

export interface WorkspaceSettingsData {
  profile: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    createdAt?: string;
  };
  settings: DbUserSettings;
  integrations: {
    github: {
      connected: boolean;
      username: string | null;
      scopes: string[];
      connectedAt: string | null;
      isSandbox?: boolean;
    };
    ai: Record<string, { configured: boolean; model: string; status: string }>;
  };
}

export const workspaceService = {
  async searchCodebase(
    query: string,
    filters?: { repo?: string; category?: string; lang?: string; exact?: boolean }
  ): Promise<GlobalSearchResponse> {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filters?.repo) params.set("repo", filters.repo);
    if (filters?.category) params.set("category", filters.category);
    if (filters?.lang) params.set("lang", filters.lang);
    if (filters?.exact) params.set("exact", "true");

    const res = await apiClient.get<any>(`/api/search?${params.toString()}`);
    const data = res.data || {};
    if (!res.success) throw new Error(data.error || res.message || "Search failed");
    return data.data || data;
  },

  async getActivities(
    filterType?: string,
    repoId?: string,
    limit: number = 30
  ): Promise<DbActivityEvent[]> {
    const params = new URLSearchParams();
    if (filterType && filterType !== "all") params.set("type", filterType);
    if (repoId) params.set("repo", repoId);
    if (limit) params.set("limit", String(limit));

    const res = await apiClient.get<any>(`/api/activity?${params.toString()}`);
    const data = res.data || {};
    if (!res.success) throw new Error(data.error || res.message || "Failed to load activities");
    return Array.isArray(res.data) ? res.data : (data.data || []);
  },

  async logActivity(event: {
    title: string;
    description?: string;
    type: string;
    repositoryId?: string;
    repositoryName?: string;
    href?: string;
    linkText?: string;
    status?: "success" | "warning" | "error" | "info";
  }): Promise<DbActivityEvent> {
    const res = await apiClient.post<any>("/api/activity", event);
    const data = res.data || {};
    if (!res.success) throw new Error(data.error || res.message || "Failed to log activity");
    return data.data || data;
  },

  async getNotifications(): Promise<{ notifications: DbNotification[]; unreadCount: number }> {
    const res = await apiClient.get<any>("/api/notifications");
    const data = res.data || {};
    if (!res.success) throw new Error(data.error || res.message || "Failed to load notifications");
    return data.data || data;
  },

  async markNotificationRead(id?: string, all: boolean = false): Promise<boolean> {
    const res = await apiClient.patch<any>("/api/notifications", { id, all });
    return res.success;
  },

  async getSettings(): Promise<WorkspaceSettingsData> {
    const res = await apiClient.get<any>("/api/settings");
    const data = res.data || {};
    if (!res.success) throw new Error(data.error || res.message || "Failed to load settings");
    return data.data || data;
  },

  async updateSettings(
    settings?: Partial<DbUserSettings>,
    profile?: { name?: string; email?: string; role?: string }
  ): Promise<any> {
    const res = await apiClient.post<any>("/api/settings", { settings, profile });
    const data = res.data || {};
    if (!res.success) throw new Error(data.error || res.message || "Failed to save settings");
    return data.data || data;
  },

  async disconnectRepository(repoId: string): Promise<boolean> {
    const res = await apiClient.delete<any>(`/api/repositories/${repoId}`);
    return res.success;
  },
};
