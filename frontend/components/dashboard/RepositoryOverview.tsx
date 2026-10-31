"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { useRepositories } from "@/hooks/useRepositories";
import { FolderGit2, ArrowRight, Plus, ExternalLink, Clock } from "lucide-react";

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

  const recent = repositories.slice(0, 4);

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
                Indexed codebases ready for architecture exploration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAddRepository && (
              <button
                type="button"
                onClick={onAddRepository}
                title="Add new repository"
                className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <Link
              href="/repositories"
              className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-md px-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Repositories List */}
        <div className="mt-4 space-y-2.5">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
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
              return (
                <div
                  key={repo.id}
                  className={`p-3.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                    isDark
                      ? "bg-[#111726]/60 border-[#242B39] hover:border-[#7C5CFC]/40 hover:bg-[#111726]"
                      : "bg-[#F9FAFB] border-[#E8E5F4] hover:border-[#7C5CFC]/40 hover:bg-white shadow-xs"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                        {repo.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-[var(--text-secondary)] bg-[var(--bg-page)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
                        <span>{repo.language}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{repo.lastAnalyzed}</span>
                      </span>
                      <span>&bull;</span>
                      <span>{repo.symbolCount} symbols</span>
                    </div>
                  </div>

                  <Link
                    href={`/repositories/${repo.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors shrink-0 inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  >
                    <span>Open</span>
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
