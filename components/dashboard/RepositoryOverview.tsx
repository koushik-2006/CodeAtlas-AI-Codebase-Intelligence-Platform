"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { useRepositories } from "@/hooks/useRepositories";
import { Repository } from "@/types/repository";
import {
  FolderGit2,
  Lock,
  Unlock,
  ExternalLink,
  Plus,
  ScanSearch,
  ArrowRight,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";

interface RepositoryOverviewProps {
  onAddRepository?: () => void;
}

export function RepositoryOverview({ onAddRepository }: RepositoryOverviewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { repositories: liveRepos, loading } = useRepositories();
  const [showSampleData, setShowSampleData] = useState(true);

  const repos: Repository[] = showSampleData ? liveRepos : [];

  return (
    <section
      className={`rounded-3xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-sm"
      }`}
    >
      <div>
        {/* Header bar: Title, View All & Demo Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Your Repositories
            </h2>
            {showSampleData && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-2 py-0.5 rounded-md">
                Live Data ({repos.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setShowSampleData(!showSampleData)}
              className="text-[11px] font-mono font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline transition-colors"
            >
              {showSampleData ? "Preview Empty State" : "Show Repositories"}
            </button>
            <Link
              href="/repositories"
              className="font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Repositories List OR Empty State */}
        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border ${
                  isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-[#FAF9FF] border-[#E8E5F4]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-[var(--border-color)]/50 animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="w-32 h-3.5 rounded bg-[var(--border-color)]/60 animate-pulse" />
                      <div className="w-48 h-2.5 rounded bg-[var(--border-color)]/40 animate-pulse" />
                    </div>
                  </div>
                  <div className="w-16 h-6 rounded bg-[var(--border-color)]/50 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : repos.length > 0 ? (
          <div className="mt-4 space-y-3">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isDark
                    ? "bg-[#0D111B] border-[#242B39] hover:border-[#29D3C2]/50 hover:bg-[#111725]/60"
                    : "bg-[#FAF9FF] border-[#E8E5F4] hover:border-[#6C4DFF]/40 hover:bg-white"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isDark
                        ? "bg-[#161B22] text-[#29D3C2]"
                        : "bg-white text-[#6C4DFF] border border-[#E5E5E0]"
                    }`}
                  >
                    <FolderGit2 className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/repositories/${repo.id}`}
                        className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors truncate"
                      >
                        {repo.name}
                      </Link>
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase px-2 py-0.5 rounded-full font-bold ${
                          repo.visibility === "private"
                            ? isDark
                              ? "bg-[#8B7CFF]/15 text-[#8B7CFF]"
                              : "bg-[#EAE5FF] text-[#6C4DFF]"
                            : isDark
                            ? "bg-[#29D3C2]/15 text-[#29D3C2]"
                            : "bg-[#D7F7EA] text-[#1BA97B]"
                        }`}
                      >
                        {repo.visibility === "private" ? (
                          <Lock className="w-2.5 h-2.5" />
                        ) : (
                          <Unlock className="w-2.5 h-2.5" />
                        )}
                        {repo.visibility}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-mono text-[var(--text-secondary)]">
                      <span>{repo.owner}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                        {repo.language}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {repo.lastAnalyzed}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      repo.status === "ready"
                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}
                  >
                    {repo.status === "ready" ? "Indexed" : `Indexing (${repo.progress}%)`}
                  </span>

                  <Link
                    href={`/repositories/${repo.id}`}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      isDark
                        ? "border-[#30363D] text-[#29D3C2] hover:bg-[#161B22]"
                        : "border-[#E5E5E0] text-[#6C4DFF] hover:bg-white shadow-xs"
                    }`}
                  >
                    Open
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Polished Empty State */
          <div className="mt-6 py-8 px-4 text-center">
            <div className="relative mx-auto w-32 h-24 mb-4">
              <svg viewBox="0 0 160 110" className="w-full h-full">
                <polygon
                  points="80,10 150,50 80,90 10,50"
                  fill={isDark ? "#161B22" : "#FFFFFF"}
                  stroke={isDark ? "#30363D" : "#E5E5E0"}
                  strokeWidth="1.5"
                />
                <polygon
                  points="80,90 150,50 150,60 80,100 10,60 10,50"
                  fill={isDark ? "#0D1117" : "#EAE5FF"}
                />
                <rect x="65" y="32" width="14" height="22" rx="2" fill="#6C4DFF" opacity="0.85" />
                <rect x="85" y="24" width="16" height="30" rx="2" fill="#29D3C2" opacity="0.85" />
                <rect x="52" y="42" width="12" height="16" rx="2" fill="#FFE08A" opacity="0.85" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Your codebase journey starts here.
            </h3>
            <p className="mt-1.5 text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
              Connect a repository to explore files, relationships, and workflows.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onAddRepository}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isDark
                    ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                    : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Repository
              </button>
              <Link
                href="/visual-explorer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
              >
                <ScanSearch className="w-3.5 h-3.5" />
                Explore CodeLens
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-3.5 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
        <span>AST Call Graph Engine v2.4</span>
        <span>Deterministic offline parsing</span>
      </div>
    </section>
  );
}
