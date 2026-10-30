"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useRepositories } from "@/hooks/useRepositories";
import { RepositoryFilters } from "@/components/repositories/RepositoryFilters";
import { RepositoryList } from "@/components/repositories/RepositoryList";
import { AddRepositoryDialog } from "@/components/repositories/AddRepositoryDialog";
import { DisconnectRepositoryModal } from "@/components/repositories/DisconnectRepositoryModal";
import { LoadingState } from "@/components/ui/LoadingState";
import { Database, Sparkles } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function RepositoriesPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const {
    repositories,
    loading,
    filters,
    setFilters,
    addRepository,
    deleteRepository,
    reanalyzeRepository,
  } = useRepositories();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [disconnectRepo, setDisconnectRepo] = useState<any | null>(null);

  const handleSearchChange = (searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery }));
  };

  const handleLangFilterChange = (language: string) => {
    setFilters((prev) => ({ ...prev, language }));
  };

  const handleVisibilityFilterChange = (visibility: string) => {
    setFilters((prev) => ({
      ...prev,
      visibility: visibility as "all" | "public" | "private",
    }));
  };

  const handleStatusFilterChange = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status as "all" | "ready" | "indexing" | "pending" | "error",
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      searchQuery: "",
      language: "all",
      visibility: "all",
      status: "all",
    });
  };

  const handleDelete = (id: string) => {
    const target = repositories.find((r) => r.id === id);
    if (target) {
      setDisconnectRepo(target);
    }
  };

  const confirmDisconnect = async (id: string) => {
    await deleteRepository(id);
    setDisconnectRepo(null);
  };

  const handleAddRepo = async (
    name: string,
    url: string,
    method: "github" | "zip" | "url" | "sample",
    options?: { owner?: string; language?: string; visibility?: "public" | "private" }
  ) => {
    await addRepository({
      name,
      owner: options?.owner || "you",
      description: url || "Imported code repository ready for symbol parsing.",
      visibility: options?.visibility || "private",
      language: options?.language || (method === "sample" && name.includes("python") ? "Python" : "TypeScript"),
      symbolCount: 0,
      connectionType: method === "url" ? "git_url" : method === "zip" ? "zip" : method === "sample" ? "sample" : "github",
    });
    setIsAddModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="My Repositories"
        sub="Manage indexed codebases, review symbol maps, and trigger architecture updates."
      >
        <span className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-secondary)] bg-[var(--border-color)]/40 px-2.5 py-1 rounded-lg">
          <Database className="w-3.5 h-3.5 text-[var(--primary)]" />
          {repositories.length} {repositories.length === 1 ? "Repository" : "Repositories"} Connected
        </span>
      </PageHeader>

      <RepositoryFilters
        search={filters.searchQuery}
        onSearchChange={handleSearchChange}
        langFilter={filters.language}
        onLangFilterChange={handleLangFilterChange}
        visibilityFilter={filters.visibility}
        onVisibilityFilterChange={handleVisibilityFilterChange}
        statusFilter={filters.status || "all"}
        onStatusFilterChange={handleStatusFilterChange}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      {loading ? (
        <LoadingState message="Loading indexed repositories from database..." />
      ) : (
        <RepositoryList
          repos={repositories}
          onReanalyze={reanalyzeRepository}
          onDelete={handleDelete}
          onClearFilters={handleClearFilters}
        />
      )}

      <AddRepositoryDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddRepo}
      />

      <DisconnectRepositoryModal
        repo={disconnectRepo}
        isOpen={Boolean(disconnectRepo)}
        onClose={() => setDisconnectRepo(null)}
        onConfirm={confirmDisconnect}
      />
    </div>
  );
}
