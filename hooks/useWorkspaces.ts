"use client";

import { useState, useEffect, useCallback } from "react";
import { DbWorkspace, WorkspaceRole } from "@/types/workspace";

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
      const res = await fetch("/api/workspaces");
      const json = await res.json();
      if (json.success && json.data?.workspaces) {
        const list: WorkspaceItem[] = json.data.workspaces;
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
        setError(json.error || "Failed to load workspaces");
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
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "Failed to create workspace");
    }
    await fetchWorkspaces();
    if (json.data?.id) {
      setActiveWorkspaceId(json.data.id);
    }
    return json.data;
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
