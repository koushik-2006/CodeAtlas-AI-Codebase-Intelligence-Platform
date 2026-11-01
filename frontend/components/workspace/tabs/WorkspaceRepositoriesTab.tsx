"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderGit2,
  Plus,
  RefreshCw,
  Trash2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { apiClient } from "@/services/api-client";

interface WorkspaceRepositoriesTabProps {
  workspaceId: string;
  repositories: any[];
  canManage: boolean;
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export default function WorkspaceRepositoriesTab({
  workspaceId,
  repositories,
  canManage,
  onRefresh,
  showToast,
}: WorkspaceRepositoriesTabProps) {
  const [reindexingRepoId, setReindexingRepoId] = useState<string | null>(null);
  const [reindexProgress, setReindexProgress] = useState<number>(0);

  // Add repo modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [allAvailableRepos, setAllAvailableRepos] = useState<any[]>([]);
  const [selectedRepoToAdd, setSelectedRepoToAdd] = useState("");
  const [customRepoName, setCustomRepoName] = useState("");
  const [customRepoUrl, setCustomRepoUrl] = useState("");
  const [addingRepo, setAddingRepo] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Remove repo confirmation state
  const [removingRepo, setRemovingRepo] = useState<any | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const handleOpenAddModal = async () => {
    try {
      setAddModalOpen(true);
      setAddError(null);
      const res = await apiClient.get<any>("/api/repositories");
      const repos = res.data?.repositories || res.data || [];
      if (Array.isArray(repos)) {
        // Exclude repos already in workspace
        const existingIds = new Set(repositories.map((r) => r.id));
        const filtered = repos.filter((r) => !existingIds.has(r.id));
        setAllAvailableRepos(filtered);
        if (filtered.length > 0) {
          setSelectedRepoToAdd(filtered[0].id);
        }
      }
    } catch (err: any) {
      console.error("Failed to load available repositories:", err);
    }
  };

  const handleAddRepositorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAddingRepo(true);
      setAddError(null);

      const repoId = selectedRepoToAdd || customRepoName.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
      const res = await apiClient.post<any>(`/api/workspaces/${workspaceId}/repositories`, {
        repositoryId: repoId,
        customName: customRepoName.trim() || undefined,
        customUrl: customRepoUrl.trim() || undefined,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to add repository to workspace");
      }

      showToast(`Repository added to workspace!`);
      setAddModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setAddError(err.message || "Failed to add repository");
    } finally {
      setAddingRepo(false);
    }
  };

  const handleReindex = async (repo: any) => {
    try {
      setReindexingRepoId(repo.id);
      setReindexProgress(15);

      await new Promise((r) => setTimeout(r, 250));
      setReindexProgress(45);
      await new Promise((r) => setTimeout(r, 300));
      setReindexProgress(80);

      const res = await apiClient.post<any>(`/api/workspaces/${workspaceId}/repositories`, {
        repositoryId: repo.id,
        action: "reindex",
      });

      setReindexProgress(100);
      await new Promise((r) => setTimeout(r, 200));

      if (res.success) {
        showToast(`Repository "${repo.name}" AST indexing completed (100%)!`);
        onRefresh();
      } else {
        alert(res.message || "Failed to reindex repository");
      }
    } catch (err: any) {
      alert(err.message || "Reindexing failed");
    } finally {
      setReindexingRepoId(null);
      setReindexProgress(0);
    }
  };

  const handleRemoveSubmit = async () => {
    if (!removingRepo) return;
    try {
      setRemoveLoading(true);
      const res = await apiClient.delete<any>(
        `/api/workspaces/${workspaceId}/repositories?repositoryId=${removingRepo.id}`
      );
      if (res.success) {
        showToast(`Removed "${removingRepo.name}" from workspace`);
        setRemovingRepo(null);
        onRefresh();
      } else {
        alert(res.message || "Failed to remove repository");
      }
    } catch (err: any) {
      alert(err.message || "Failed to remove repository");
    } finally {
      setRemoveLoading(false);
    }
  };

  const getLanguageColor = (lang: string) => {
    switch (lang?.toLowerCase()) {
      case "typescript":
        return "#3178C6";
      case "python":
        return "#3572A5";
      case "go":
        return "#00ADD8";
      case "rust":
        return "#DEA584";
      case "javascript":
        return "#F7DF1E";
      default:
        return "#7C5CFC";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)]/60 pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">Connected Repositories</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Repositories indexed for architecture analysis, symbol search, and AI pull request review.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Repository</span>
          </button>
        )}
      </div>

      {/* Repositories List */}
      {repositories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-10 text-center bg-[var(--bg-card)]/40">
          <FolderGit2 className="w-10 h-10 text-[var(--text-secondary)]/60 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
            No repositories connected to this workspace
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
            Connect code repositories to begin multi-repo architecture discovery and automated code reviews.
          </p>
          {canManage && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary)]/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Repository</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repositories.map((repo) => {
            const isReindexing = reindexingRepoId === repo.id;
            const lang = repo.language || "TypeScript";
            const langColor = getLanguageColor(lang);

            return (
              <div
                key={repo.id}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 hover:border-[var(--border-color)]/90 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                      <div>
                        <Link
                          href={`/repositories/${repo.id}`}
                          className="font-bold text-sm text-[var(--text-primary)] hover:text-[var(--primary)] hover:underline flex items-center gap-1.5"
                        >
                          <span>{repo.name}</span>
                          <ExternalLink className="w-3 h-3 text-[var(--text-secondary)]" />
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: langColor }}
                            />
                            {lang}
                          </span>
                          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                            branch: {repo.defaultBranch || "main"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Healthy
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
                    {repo.description || "Core repository module providing scalable services and domain logic."}
                  </p>

                  {/* Indexing status & progress */}
                  <div className="py-2.5 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]/50 mb-4">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-[var(--text-secondary)] font-medium">
                        {isReindexing ? "Indexing symbols & AST..." : "Indexing Complete"}
                      </span>
                      <span className="font-mono text-cyan-400 font-semibold">
                        {isReindexing ? `${reindexProgress}%` : "100%"}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isReindexing ? "bg-cyan-400" : "bg-emerald-400"
                        }`}
                        style={{ width: `${isReindexing ? reindexProgress : 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--text-secondary)]">
                      <span>Symbols: 142 detected</span>
                      <span>Last indexed: {repo.lastIndexedAt || "Today"}</span>
                    </div>
                  </div>
                </div>

                {/* Repository Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]/40">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReindex(repo)}
                      disabled={isReindexing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--border-color)]/30 text-xs text-[var(--text-primary)] font-medium transition-colors disabled:opacity-50"
                      title="Re-run AST indexing on this repository"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? "animate-spin text-cyan-400" : ""}`} />
                      <span>{isReindexing ? "Indexing..." : "Re-index"}</span>
                    </button>

                    {canManage && (
                      <button
                        onClick={() => setRemovingRepo(repo)}
                        className="p-1.5 rounded-xl border border-transparent hover:border-red-500/30 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove repository from workspace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <Link
                    href={`/repositories/${repo.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    <span>View Repository</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Repository Modal */}
      {addModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-6 relative">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Connect Repository</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Add a repository to this workspace for indexing and code analysis.
                </p>
              </div>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddRepositorySubmit} className="space-y-4">
              {allAvailableRepos.length > 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                    Select Existing Repository
                  </label>
                  <select
                    value={selectedRepoToAdd}
                    onChange={(e) => setSelectedRepoToAdd(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    {allAvailableRepos.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.language || "TypeScript"})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                  All standard demo repositories are already added to this workspace. You can import a new custom repository below:
                </div>
              )}

              {/* Custom Repo Option */}
              <div className="pt-2 border-t border-[var(--border-color)]/50 space-y-3">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                  Or Import Custom Repository
                </span>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Repository Name
                  </label>
                  <input
                    type="text"
                    value={customRepoName}
                    onChange={(e) => setCustomRepoName(e.target.value)}
                    placeholder="e.g. backend-api, payments-service"
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    GitHub Clone URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={customRepoUrl}
                    onChange={(e) => setCustomRepoUrl(e.target.value)}
                    placeholder="https://github.com/organization/repo"
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)]/60">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingRepo || (!selectedRepoToAdd && !customRepoName.trim())}
                  className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary)]/90 disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-[var(--primary)]/20"
                >
                  {addingRepo && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Connect Repository</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Repository Confirmation Modal */}
      {removingRepo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[var(--bg-card)] shadow-2xl p-6 relative">
            <button
              onClick={() => setRemovingRepo(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-400">Remove Repository</h3>
                <p className="text-xs text-[var(--text-secondary)]">From this workspace</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Are you sure you want to remove <strong className="text-[var(--text-primary)] font-mono">{removingRepo.name}</strong> from this workspace? The underlying repository data remains intact.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)]/60">
              <button
                type="button"
                onClick={() => setRemovingRepo(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveSubmit}
                disabled={removeLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-red-600/20"
              >
                {removeLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Remove Repository</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
