"use client";

import { Repository } from "@/types/repository";
import { RepositoryCard } from "./RepositoryCard";
import { FolderGit2 } from "lucide-react";

interface RepositoryListProps {
  repos: Repository[];
  onReanalyze: (id: string) => void;
  onDelete: (id: string) => void;
  onClearFilters: () => void;
}

export function RepositoryList({
  repos,
  onReanalyze,
  onDelete,
  onClearFilters,
}: RepositoryListProps) {
  if (repos.length === 0) {
    return (
      <div className="app-card p-12 text-center max-w-lg mx-auto">
        <FolderGit2 className="w-12 h-12 mx-auto text-[var(--text-secondary)]/50 mb-4" />
        <h3 className="text-xl font-bold">No repositories found</h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          No repositories match your filter query. Clear filters or add a new codebase to get started.
        </p>
        <button
          onClick={onClearFilters}
          className="mt-6 px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-color)]"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {repos.map((repo) => (
        <RepositoryCard
          key={repo.id}
          repo={repo}
          onReanalyze={onReanalyze}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
