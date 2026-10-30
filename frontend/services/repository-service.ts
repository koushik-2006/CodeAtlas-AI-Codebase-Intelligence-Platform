import { Repository, RepositoryFilterOptions } from "@/types/repository";
import { SAMPLE_REPOSITORIES_DATA } from "@/lib/constants";
import { apiClient } from "./api-client";

class RepositoryService {
  private fallbackRepos: Repository[] = [...SAMPLE_REPOSITORIES_DATA];

  async getRepositories(filters?: Partial<RepositoryFilterOptions>): Promise<Repository[]> {
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

    if (!filters) return this.fallbackRepos;

    return this.fallbackRepos.filter((repo) => {
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
    return list.find((r) => r.id === id) || null;
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
