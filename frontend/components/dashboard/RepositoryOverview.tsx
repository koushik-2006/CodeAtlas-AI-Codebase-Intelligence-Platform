"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { useRepositories } from "@/hooks/useRepositories";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { getStore } from "@/lib/demo/store";
import { FolderGit2, ArrowRight, Plus, ExternalLink, Clock, CheckCircle2, Loader2 } from "lucide-react";

interface RepositoryOverviewProps {
  onAddRepository?: () => void;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178C6",
  JavaScript: "#F7DF1E",
  Python: "#3776AB",
  Go: "#00ADD8",
  Rust: "#DEA584",
  HTML: "#E34F26",
  CSS: "#1572B6",
};

export function RepositoryOverview({ onAddRepository }: RepositoryOverviewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { repositories, loading } = useRepositories();
  const { activeWorkspace } = useWorkspaces();

  const [storeData, setStoreData] = useState(() => {
    try {
      return getStore();
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        setStoreData(getStore());
      } catch {}
    };

    if (typeof window !== "undefined") {
      window.addEventListener("codeatlas:repositories-changed", handleUpdate);
      window.addEventListener("codeatlas:workspace-changed", handleUpdate);
      return () => {
        window.removeEventListener("codeatlas:repositories-changed", handleUpdate);
        window.removeEventListener("codeatlas:workspace-changed", handleUpdate);
      };
    }
  }, []);

  const recent = useMemo(() => {
    let filteredRepos = repositories;
    if (activeWorkspace?.id && storeData?.workspaceRepositories?.[activeWorkspace.id]) {
      const linkedRepoIds = new Set(
        storeData.workspaceRepositories[activeWorkspace.id].map((r: any) => r.repositoryId)
      );
      const matched = repositories.filter((r) => linkedRepoIds.has(r.id));
      if (matched.length > 0) {
        filteredRepos = matched;
      }
    }
    return filteredRepos.slice(0, 5);
  }, [repositories, activeWorkspace, storeData]);

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 h-full ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-sm"
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Recent Repositories
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                5 newest indexed codebases ready for architecture exploration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAddRepository && (
              <button
                type="button"
                onClick={onAddRepository}
                title="Add new repository"
                aria-label="Add new repository"
                className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <Link
              href="/repositories"
              aria-label="View all repositories"
              className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-md px-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Repositories List (5 newest) */}
        <div className="mt-4 space-y-2.5">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[var(--border-color)]/50 animate-pulse flex items-center justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-[var(--border-color)] rounded" />
                  <div className="h-3 w-48 bg-[var(--border-color)]/60 rounded" />
                </div>
                <div className="h-7 w-16 bg-[var(--border-color)] rounded-lg" />
              </div>
            ))
          ) : recent.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-secondary)] space-y-2">
              <FolderGit2 className="w-8 h-8 mx-auto text-[var(--text-secondary)]/40" />
              <p>No repositories connected yet.</p>
              {onAddRepository && (
                <button
                  type="button"
                  onClick={onAddRepository}
                  className="font-bold text-[var(--primary)] hover:underline"
                >
                  Connect your first repository
                </button>
              )}
            </div>
          ) : (
            recent.map((repo) => {
              const dotColor = LANG_COLORS[repo.language] || "#7C5CFC";
              const isIndexing = repo.status === "indexing" || repo.status === "pending";

              return (
                <div
                  key={repo.id}
                  className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                    isDark
                      ? "bg-[#111726]/60 border-[#242B39] hover:border-[#7C5CFC]/50 hover:bg-[#111726]"
                      : "bg-[#F9FAFB] border-[#E8E5F4] hover:border-[#7C5CFC]/40 hover:bg-white shadow-2xs"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/repositories/${repo.id}`}
                        className="text-xs sm:text-sm font-bold text-[var(--text-primary)] hover:text-[var(--primary)] truncate transition-colors focus-visible:outline-none focus-visible:underline"
                      >
                        {repo.name}
                      </Link>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-[var(--text-secondary)] bg-[var(--bg-page)] px-1.5 py-0.5 rounded border border-[var(--border-color)] shrink-0">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
                        <span>{repo.language}</span>
                      </span>

                      {/* Health / Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          isIndexing
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}
                      >
                        {isIndexing ? (
                          <>
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>Indexing</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Ready</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Last indexed: {repo.lastAnalyzed || "Recently"}</span>
                      </span>
                      <span>&bull;</span>
                      <span>{repo.symbolCount || 18} AST symbols</span>
                    </div>
                  </div>

                  <Link
                    href={`/repositories/${repo.id}`}
                    aria-label={`Open repository ${repo.name}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors shrink-0 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  >
                    <span>Explore</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
