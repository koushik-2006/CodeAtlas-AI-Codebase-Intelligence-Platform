"use client";

import { useState, useEffect, useCallback } from "react";
import { DbWorkspace, WorkspaceRole } from "@/types/workspace";
import { apiClient } from "@/services/api-client";

export type WorkspaceItem = DbWorkspace & {
  userRole: WorkspaceRole;
  memberCount: number;
  repoCount: number;
};

const STORAGE_KEY = "codeatlas_active_workspace_id";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get<any>("/api/workspaces");
      const json = res.data || {};
      if (res.success && json.workspaces) {
        const list: WorkspaceItem[] = json.workspaces;
        setWorkspaces(list);

        // Resolve active workspace from local storage or default to first team workspace / personal
        const savedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        const exists = list.find((w) => w.id === savedId);

        if (exists) {
          setActiveWorkspaceIdState(exists.id);
        } else if (list.length > 0) {
          // Prefer team workspace first, else personal
          const preferred = list.find((w) => !w.isPersonal) || list[0];
          setActiveWorkspaceIdState(preferred.id);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, preferred.id);
          }
        }
      } else {
        setError(json.error || res.message || "Failed to load workspaces");
      }
    } catch (err: any) {
      console.error("useWorkspaces fetch error:", err);
      setError(err.message || "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const setActiveWorkspaceId = useCallback((id: string) => {
    setActiveWorkspaceIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null;

  const createWorkspace = async (name: string, description?: string) => {
    const res = await apiClient.post<any>("/api/workspaces", { name, description });
    const json = res.data || {};
    if (!res.success) {
      throw new Error(json.error || res.message || "Failed to create workspace");
    }
    await fetchWorkspaces();
    const created = json.data || json;
    if (created?.id) {
      setActiveWorkspaceId(created.id);
    }
    return created;
  };

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
    loading,
    error,
    refreshWorkspaces: fetchWorkspaces,
    createWorkspace,
  };
}
