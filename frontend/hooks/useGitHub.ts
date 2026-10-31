"use client";
import { isDemoMode } from "@/lib/demo/mock-api";
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api-client";
import { authService } from "@/services/auth-service";
import { isFirebaseConfigured } from "@/lib/firebase";

export interface GitHubAccountStatus {
  connected: boolean;
  username: string | null;
  avatar: string | null;
  scopes: string[];
  connectedAt: string | null;
  isConfigured: boolean;
  isSandbox?: boolean;
  repoCount: number;
}

export interface DiscoveredGitHubRepo {
  id: string;
  name: string;
  fullName: string;
  owner: string;
  ownerAvatar: string;
  description: string;
  visibility: "public" | "private";
  language: string;
  defaultBranch: string;
  url: string;
  stars: number;
  updatedAt: string;
  isArchived: boolean;
  isAlreadyIndexed: boolean;
}

export function useGitHub() {
  const [status, setStatus] = useState<GitHubAccountStatus>({
    connected: false,
    username: null,
    avatar: null,
    scopes: [],
    connectedAt: null,
    isConfigured: true,
    isSandbox: false,
    repoCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [repos, setRepos] = useState<DiscoveredGitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposMeta, setReposMeta] = useState<{
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
    isSandbox: boolean;
    tokenExpired?: boolean;
  }>({
    total: 0,
    page: 1,
    perPage: 25,
    totalPages: 1,
    isSandbox: false,
  });

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      if (typeof window !== "undefined") {
        const ghToken =
          sessionStorage.getItem("codeatlas_github_token") ||
          sessionStorage.getItem("github_access_token");
        const sessionUser = authService.getCurrentUser();

        if (ghToken || sessionUser?.provider === "github") {
          setStatus({
            connected: true,
            username: sessionUser?.name || "GitHub User",
            avatar: sessionUser?.avatar || null,
            scopes: ["read:user", "user:email", "repo"],
            connectedAt: "Active Session",
            isConfigured: true,
            isSandbox: false,
            repoCount: 0,
          });
          return;
        }
      }

      const res = await apiClient.get<any>("/api/auth/github/status");
      const json = res.data || {};
      if (res.success && json) {
        setStatus(json);
      }
    } catch (err) {
      console.warn("Failed to retrieve GitHub status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRepos = useCallback(
    async (params: {
      search?: string;
      visibility?: string;
      language?: string;
      page?: number;
      perPage?: number;
      sort?: string;
    } = {}) => {
      try {
        setReposLoading(true);
        if (typeof window !== "undefined") {
          const ghToken =
            sessionStorage.getItem("codeatlas_github_token") ||
            sessionStorage.getItem("github_access_token");

          if (ghToken) {
            try {
              const res = await fetch(
                `https://api.github.com/user/repos?sort=${params.sort || "updated"}&per_page=${params.perPage || 25}&page=${params.page || 1}`,
                {
                  headers: {
                    Authorization: `Bearer ${ghToken}`,
                    Accept: "application/vnd.github.v3+json",
                  },
                }
              );

              if (res.ok) {
                const list = await res.json();
                if (Array.isArray(list)) {
                  let filtered = list.map((item: any) => ({
                    id: String(item.id),
                    name: item.name,
                    fullName: item.full_name,
                    owner: item.owner?.login || "",
                    ownerAvatar: item.owner?.avatar_url || "",
                    description: item.description || "GitHub repository ready for analysis.",
                    visibility: item.private ? ("private" as const) : ("public" as const),
                    language: item.language || "TypeScript",
                    defaultBranch: item.default_branch || "main",
                    url: item.html_url,
                    stars: item.stargazers_count || 0,
                    updatedAt: item.updated_at,
                    isArchived: Boolean(item.archived),
                    isAlreadyIndexed: false,
                  }));

                  if (params.search) {
                    const q = params.search.toLowerCase();
                    filtered = filtered.filter(
                      (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
                    );
                  }
                  if (params.visibility && params.visibility !== "all") {
                    filtered = filtered.filter((r) => r.visibility === params.visibility);
                  }
                  if (params.language && params.language !== "all") {
                    filtered = filtered.filter((r) => r.language.toLowerCase() === params.language?.toLowerCase());
                  }

                  setRepos(filtered);
                  setReposMeta({
                    total: filtered.length,
                    page: params.page || 1,
                    perPage: params.perPage || 25,
                    totalPages: 1,
                    isSandbox: false,
                  });
                  return;
                }
              }
            } catch (liveErr) {
              console.warn("Direct GitHub repo fetch failed, falling back:", liveErr);
            }
          }
        }

        const searchParams = new URLSearchParams();
        if (params.search) searchParams.set("search", params.search);
        if (params.visibility && params.visibility !== "all") searchParams.set("visibility", params.visibility);
        if (params.language && params.language !== "all") searchParams.set("language", params.language);
        if (params.page) searchParams.set("page", String(params.page));
        if (params.perPage) searchParams.set("per_page", String(params.perPage));
        if (params.sort) searchParams.set("sort", params.sort);

        const res = await apiClient.get<any>(`/api/github/repos?${searchParams.toString()}`);
        const json = res.data || {};
        const repoList = Array.isArray(res.data) ? res.data : json.data;

        if (res.success && Array.isArray(repoList)) {
          setRepos(repoList);
          const meta = json.meta || {};
          setReposMeta({
            total: meta.total || repoList.length,
            page: meta.page || 1,
            perPage: meta.perPage || 25,
            totalPages: meta.totalPages || 1,
            isSandbox: Boolean(meta.isSandbox),
            tokenExpired: Boolean(meta.tokenExpired),
          });
        }
      } catch (err) {
        console.warn("Failed to fetch GitHub repositories:", err);
      } finally {
        setReposLoading(false);
      }
    },
    []
  );

  const connectGitHub = useCallback(async () => {
    setActionLoading(true);
    if (isDemoMode()) {
      setActionLoading(false);
      return;
    }
    if (isFirebaseConfigured) {
      try {
        const res = await authService.loginWithGitHub();
        if (res.success) {
          await refreshStatus();
        }
      } catch (e) {
        console.warn("GitHub login failed:", e);
      } finally {
        setActionLoading(false);
      }
      return;
    }
    const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");
    window.location.href = `${apiBase}/auth/github`;
  }, [refreshStatus]);

  const disconnectGitHub = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("codeatlas_github_token");
        sessionStorage.removeItem("github_access_token");
      }
      try {
        await apiClient.post<any>("/api/auth/github/disconnect");
      } catch {}
      setStatus({
        connected: false,
        username: null,
        avatar: null,
        scopes: [],
        connectedAt: null,
        isConfigured: status.isConfigured,
        repoCount: 0,
      });
      setRepos([]);
      return true;
    } finally {
      setActionLoading(false);
    }
  }, [status.isConfigured]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    loading,
    actionLoading,
    repos,
    reposLoading,
    reposMeta,
    refreshStatus,
    fetchRepos,
    connectGitHub,
    disconnectGitHub,
  };
}
