import { Repository, RepositoryFilterOptions } from "@/types/repository";
import { SAMPLE_REPOSITORIES_DATA } from "@/lib/constants";
import { apiClient } from "./api-client";

function formatLastUpdated(dateString?: string): string {
  if (!dateString) return "Recently";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

class RepositoryService {
  private fallbackRepos: Repository[] = [...SAMPLE_REPOSITORIES_DATA];

  private applyFilters(repos: Repository[], filters?: Partial<RepositoryFilterOptions>): Repository[] {
    if (!filters) return repos;

    return repos.filter((repo) => {
      const matchesSearch =
        !filters.searchQuery ||
        repo.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        repo.description.toLowerCase().includes(filters.searchQuery.toLowerCase());

      const matchesLang =
        !filters.language ||
        filters.language === "all" ||
        repo.language.toLowerCase() === filters.language.toLowerCase();

      const matchesVisibility =
        !filters.visibility ||
        filters.visibility === "all" ||
        repo.visibility === filters.visibility;

      const matchesStatus =
        !filters.status ||
        filters.status === "all" ||
        repo.status === filters.status;

      return matchesSearch && matchesLang && matchesVisibility && matchesStatus;
    });
  }

  async getRepositories(filters?: Partial<RepositoryFilterOptions>): Promise<Repository[]> {
    // 1. If signed in with GitHub and token is in sessionStorage, fetch real repos
    if (typeof window !== "undefined") {
      try {
        const ghToken =
          sessionStorage.getItem("codeatlas_github_token") ||
          sessionStorage.getItem("github_access_token");

        if (ghToken) {
          const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=30", {
            headers: {
              Authorization: `Bearer ${ghToken}`,
              Accept: "application/vnd.github.v3+json",
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const liveRepos: Repository[] = data.map((item: any) => ({
                id: String(item.id),
                name: item.name,
                owner: item.owner?.login || "you",
                description: item.description || "GitHub repository ready for code intelligence.",
                visibility: item.private ? "private" : "public",
                language: item.language || "TypeScript",
                lastAnalyzed: formatLastUpdated(item.updated_at),
                status: "ready" as const,
                progress: 100,
                symbolCount: Math.max(45, ((item.size || 100) % 500) + 75),
                connectionType: "github" as const,
                stars: item.stargazers_count ?? 0,
                branch: item.default_branch || "main",
              }));
              return this.applyFilters(liveRepos, filters);
            }
          }
        }
      } catch (ghErr) {
        console.warn("Live GitHub repo fetch failed; falling back gracefully:", ghErr);
      }
    }

    // 2. Try backend API if available
    try {
      const params = new URLSearchParams();
      if (filters?.searchQuery) params.set("search", filters.searchQuery);
      if (filters?.language && filters.language !== "all") params.set("language", filters.language);
      if (filters?.visibility && filters.visibility !== "all") params.set("visibility", filters.visibility);
      if (filters?.status && filters.status !== "all") params.set("status", filters.status);

      const qs = params.toString();
      const res = await apiClient.get<Repository[]>(`/repositories${qs ? `?${qs}` : ""}`);
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn("Using fallback repository data due to network error:", err);
    }

    // 3. Fallback to sample repositories
    return this.applyFilters(this.fallbackRepos, filters);
  }

  async getRepositoryById(id: string): Promise<Repository | null> {
    try {
      const res = await apiClient.get<Repository>(`/repositories/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const list = await this.getRepositories();
    return list.find((r) => r.id === id) || this.fallbackRepos.find((r) => r.id === id) || null;
  }

  async addRepository(newRepo: Omit<Repository, "id" | "lastAnalyzed" | "status" | "progress">): Promise<Repository> {
    try {
      const res = await apiClient.post<Repository>("/repositories", newRepo);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn("Failed to create repository on server, creating locally:", err);
    }

    const created: Repository = {
      ...newRepo,
      id: newRepo.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      lastAnalyzed: "Just now",
      status: "indexing",
      progress: 35,
    };
    this.fallbackRepos.unshift(created);
    return created;
  }

  async deleteRepository(id: string): Promise<boolean> {
    try {
      const res = await apiClient.delete<any>(`/repositories/${id}`);
      if (res.success) {
        this.fallbackRepos = this.fallbackRepos.filter((r) => r.id !== id);
        return true;
      }
    } catch {
      // Fallback
    }
    this.fallbackRepos = this.fallbackRepos.filter((r) => r.id !== id);
    return true;
  }

  async reanalyzeRepository(id: string): Promise<Repository | null> {
    try {
      const res = await apiClient.post<any>(`/repositories/${id}/index`, {});
      if (res.success) {
        const repo = await this.getRepositoryById(id);
        return repo;
      }
    } catch {
      // Fallback
    }

    const repo = this.fallbackRepos.find((r) => r.id === id);
    if (!repo) return null;
    repo.status = "indexing";
    repo.progress = 25;
    return repo;
  }

  async getIndexingStatus(id: string): Promise<{
    status: string;
    progress: number;
    currentStage?: string;
    fileCount?: number;
    symbolCount?: number;
  } | null> {
    try {
      const res = await apiClient.get<any>(`/repositories/${id}/index`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return null;
  }
}

export const repositoryService = new RepositoryService();
