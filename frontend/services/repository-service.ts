import { Repository, RepositoryFilterOptions } from "@/types/repository";
import { SAMPLE_REPOSITORIES_DATA } from "@/lib/constants";
import { apiClient } from "./api-client";
import { parseGitHubUrl } from "@/lib/github-url-parser";
import { repositoryIndexer } from "./repository-indexer";
import { getStore, saveStore } from "@/lib/demo/store";

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
        (repo.description || "").toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        repo.owner.toLowerCase().includes(filters.searchQuery.toLowerCase());

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
    // 1. Central Store (localStorage persisted)
    if (typeof window !== "undefined") {
      try {
        const store = getStore();
        if (!store.repositories || store.repositories.length === 0) {
          store.repositories = [...SAMPLE_REPOSITORIES_DATA];
          saveStore(store);
        }

        // Auto-repair any previously stuck 35% mock repositories
        let hasRepairs = false;
        for (const repo of store.repositories) {
          if (
            repo.status === "indexing" &&
            repo.progress === 35 &&
            (repo.owner === "you" || repo.owner === "koushik-2006")
          ) {
            // Re-trigger real indexing in background
            const realOwner = repo.owner === "you" ? "koushik-2006" : repo.owner;
            repo.owner = realOwner;
            hasRepairs = true;
            this.reanalyzeRepository(repo.id).catch(() => {});
          }
        }
        if (hasRepairs) {
          saveStore(store);
        }

        return this.applyFilters(store.repositories, filters);
      } catch (err) {
        console.warn("Failed to read repositories from store:", err);
      }
    }

    // 2. Fallback to sample repositories
    return this.applyFilters(this.fallbackRepos, filters);
  }

  async getRepositoryById(id: string): Promise<Repository | null> {
    if (typeof window !== "undefined") {
      try {
        const store = getStore();
        const found = store.repositories.find((r) => r.id === id);
        if (found) return found;
      } catch {}
    }

    try {
      const res = await apiClient.get<Repository>(`/repositories/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {}

    const list = await this.getRepositories();
    return list.find((r) => r.id === id) || this.fallbackRepos.find((r) => r.id === id) || null;
  }

  async addRepository(newRepo: Omit<Repository, "id" | "lastAnalyzed" | "status" | "progress">): Promise<Repository> {
    // Parse name or URL using robust parser
    const parsedName = parseGitHubUrl(newRepo.name);
    const parsedDesc = parseGitHubUrl(newRepo.description || "");
    const parsed = parsedName.valid ? parsedName : parsedDesc;

    const owner = parsed.valid
      ? parsed.owner
      : newRepo.owner && newRepo.owner !== "you"
      ? newRepo.owner
      : "koushik-2006";
    const name = parsed.valid
      ? parsed.repo
      : newRepo.name.includes("/")
      ? newRepo.name.split("/").slice(1).join("/")
      : newRepo.name;
    const repoId = name.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const branch = parsed.branch || (newRepo as any).branch || "main";
    const cloneUrl = parsed.valid ? parsed.htmlUrl : `https://github.com/${owner}/${name}`;

    const created: Repository = {
      id: repoId,
      name,
      owner,
      description: newRepo.description || `GitHub repository https://github.com/${owner}/${name}`,
      visibility: newRepo.visibility || "public",
      language: newRepo.language && newRepo.language !== "auto" ? newRepo.language : "TypeScript",
      lastAnalyzed: "Just now",
      status: "indexing",
      progress: 5,
      symbolCount: newRepo.symbolCount || 0,
      connectionType: newRepo.connectionType || "github",
      branch,
    };

    // Save to Central Store
    if (typeof window !== "undefined") {
      try {
        const store = getStore();
        const existingIdx = store.repositories.findIndex((r) => r.id === repoId);
        if (existingIdx !== -1) {
          store.repositories[existingIdx] = { ...store.repositories[existingIdx], ...created };
        } else {
          store.repositories.unshift(created);
        }
        saveStore(store);
        window.dispatchEvent(new CustomEvent("codeatlas:repositories-changed"));
      } catch (e) {
        console.warn("Failed to persist new repository to store:", e);
      }
    }

    // Trigger REAL Indexing Pipeline in the background
    repositoryIndexer
      .indexRepository(owner, name, {
        branch,
        customRepoId: repoId,
        onProgress: (stage, percent) => {
          if (typeof window !== "undefined") {
            try {
              const store = getStore();
              const target = store.repositories.find((r) => r.id === repoId);
              if (target) {
                target.progress = percent;
                target.status = percent >= 100 ? "ready" : "indexing";
                saveStore(store);
                window.dispatchEvent(new CustomEvent("codeatlas:repositories-changed"));
              }
            } catch {}
          }
        },
      })
      .then((indexed) => {
        if (typeof window !== "undefined") {
          try {
            const store = getStore();
            const idx = store.repositories.findIndex((r) => r.id === repoId);
            if (idx !== -1) {
              store.repositories[idx] = {
                ...store.repositories[idx],
                ...indexed,
                status: "ready",
                progress: 100,
                lastAnalyzed: "Just now",
              };
              saveStore(store);
              window.dispatchEvent(new CustomEvent("codeatlas:repositories-changed"));
            }
          } catch {}
        }
      })
      .catch((err) => {
        console.warn(`Repository indexing failed for ${owner}/${name}:`, err);
        if (typeof window !== "undefined") {
          try {
            const store = getStore();
            const target = store.repositories.find((r) => r.id === repoId);
            if (target) {
              target.status = "error";
              target.progress = 0;
              target.description = `Indexing failed: ${err.message || "Network error"}`;
              saveStore(store);
              window.dispatchEvent(new CustomEvent("codeatlas:repositories-changed"));
            }
          } catch {}
        }
      });

    return created;
  }

  async deleteRepository(id: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      try {
        const store = getStore();
        store.repositories = store.repositories.filter((r) => r.id !== id);
        if (store.repositoryTrees) delete store.repositoryTrees[id];
        if (store.repositoryFiles) delete store.repositoryFiles[id];
        if (store.repositoryDependencies) delete store.repositoryDependencies[id];
        saveStore(store);
        window.dispatchEvent(new CustomEvent("codeatlas:repositories-changed"));
        return true;
      } catch {}
    }

    try {
      await apiClient.delete<any>(`/repositories/${id}`);
    } catch {}

    this.fallbackRepos = this.fallbackRepos.filter((r) => r.id !== id);
    return true;
  }

  async reanalyzeRepository(id: string): Promise<Repository | null> {
    let repo: Repository | null = null;

    if (typeof window !== "undefined") {
      try {
        const store = getStore();
        repo = store.repositories.find((r) => r.id === id) || null;
        if (repo) {
          repo.status = "indexing";
          repo.progress = 10;
          saveStore(store);
          window.dispatchEvent(new CustomEvent("codeatlas:repositories-changed"));
        }
      } catch {}
    }

    if (!repo) {
      repo = this.fallbackRepos.find((r) => r.id === id) || null;
    }

    if (!repo) return null;

    const owner = repo.owner && repo.owner !== "you" ? repo.owner : "koushik-2006";
    const name = repo.name;
    const branch = repo.branch || "main";

    // Run real indexer
    repositoryIndexer
      .indexRepository(owner, name, {
        branch,
        customRepoId: id,
        onProgress: (stage, percent) => {
          if (typeof window !== "undefined") {
            try {
              const store = getStore();
              const target = store.repositories.find((r) => r.id === id);
              if (target) {
                target.progress = percent;
                target.status = percent >= 100 ? "ready" : "indexing";
                saveStore(store);
                window.dispatchEvent(new CustomEvent("codeatlas:repositories-changed"));
              }
            } catch {}
          }
        },
      })
      .then((indexed) => {
        if (typeof window !== "undefined") {
          try {
            const store = getStore();
            const idx = store.repositories.findIndex((r) => r.id === id);
            if (idx !== -1) {
              store.repositories[idx] = {
                ...store.repositories[idx],
                ...indexed,
                status: "ready",
                progress: 100,
                lastAnalyzed: "Just now",
              };
              saveStore(store);
              window.dispatchEvent(new CustomEvent("codeatlas:repositories-changed"));
            }
          } catch {}
        }
      })
      .catch((err) => {
        console.warn("Reanalysis error:", err);
      });

    return repo;
  }
}

export const repositoryService = new RepositoryService();
