import { GlobalSearchResponse } from "@/types/search";
import { DbActivityEvent, DbNotification, DbUserSettings } from "@/types/database";

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

    const res = await fetch(`/api/search?${params.toString()}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Search failed");
    return data.data;
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

    const res = await fetch(`/api/activity?${params.toString()}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to load activities");
    return data.data || [];
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
    const res = await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to log activity");
    return data.data;
  },

  async getNotifications(): Promise<{ notifications: DbNotification[]; unreadCount: number }> {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to load notifications");
    return data.data;
  },

  async markNotificationRead(id?: string, all: boolean = false): Promise<boolean> {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, all }),
    });
    const data = await res.json();
    return data.success;
  },

  async getSettings(): Promise<WorkspaceSettingsData> {
    const res = await fetch("/api/settings");
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to load settings");
    return data.data;
  },

  async updateSettings(
    settings?: Partial<DbUserSettings>,
    profile?: { name?: string; email?: string; role?: string }
  ): Promise<any> {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings, profile }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to save settings");
    return data.data;
  },

  async disconnectRepository(repoId: string): Promise<boolean> {
    const res = await fetch(`/api/repositories/${repoId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return data.success;
  },
};
