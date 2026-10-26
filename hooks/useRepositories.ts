"use client";

import { useState, useEffect, useRef } from "react";
import { Repository, RepositoryFilterOptions } from "@/types/repository";
import { repositoryService } from "@/services/repository-service";

export function useRepositories(initialFilters?: Partial<RepositoryFilterOptions>) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RepositoryFilterOptions>({
    searchQuery: initialFilters?.searchQuery || "",
    language: initialFilters?.language || "all",
    visibility: initialFilters?.visibility || "all",
    status: initialFilters?.status || "all",
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadRepositories = async () => {
    const data = await repositoryService.getRepositories(filters);
    setRepositories(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRepositories();
  }, [filters.searchQuery, filters.language, filters.visibility, filters.status]);

  // Polling for active indexing jobs
  useEffect(() => {
    const hasActiveIndexing = repositories.some(
      (r) => r.status === "indexing" || r.status === "pending"
    );

    if (hasActiveIndexing) {
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(async () => {
          const updated = await repositoryService.getRepositories(filters);
          setRepositories(updated);
        }, 1200);
      }
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [repositories, filters]);

  const addRepository = async (repoData: Omit<Repository, "id" | "lastAnalyzed" | "status" | "progress">) => {
    const created = await repositoryService.addRepository(repoData);
    setRepositories((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
    return created;
  };

  const deleteRepository = async (id: string) => {
    await repositoryService.deleteRepository(id);
    setRepositories((prev) => prev.filter((r) => r.id !== id));
  };

  const reanalyzeRepository = async (id: string) => {
    await repositoryService.reanalyzeRepository(id);
    setRepositories((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "indexing", progress: 15 } : r))
    );
  };

  return {
    repositories,
    loading,
    filters,
    setFilters,
    addRepository,
    deleteRepository,
    reanalyzeRepository,
    refresh: loadRepositories,
  };
}
