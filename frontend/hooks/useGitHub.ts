"use client";
import { isDemoMode } from "@/lib/demo/mock-api";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api-client";

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

  const connectGitHub = useCallback(() => {
    setActionLoading(true);
    if (isDemoMode()) {
      setActionLoading(false);
      return;
    }
    const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");
    window.location.href = `${apiBase}/auth/github`;
  }, []);

  const disconnectGitHub = useCallback(async (): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await apiClient.post<any>("/api/auth/github/disconnect");
      if (res.success) {
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
      }
      return false;
    } catch {
      return false;
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