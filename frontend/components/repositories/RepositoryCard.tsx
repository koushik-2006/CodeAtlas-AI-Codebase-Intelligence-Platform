"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { Repository } from "@/types/repository";
import { RepositoryStatus } from "./RepositoryStatus";
import {
  FolderGit2,
  Lock,
  Unlock,
  Clock,
  ExternalLink,
  GitBranch,
  RotateCw,
  Trash2,
} from "lucide-react";

interface RepositoryCardProps {
  repo: Repository;
  onReanalyze: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RepositoryCard({ repo, onReanalyze, onDelete }: RepositoryCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`app-card p-6 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 border ${
        isDark ? "bg-[var(--bg-card)] border-[var(--border-color)]" : "bg-white border-[#E5E5E0]"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-xl ${
                isDark ? "bg-[var(--primary)]/15 text-[var(--primary)]" : "bg-[#FAF9FF] text-[#6C4DFF]"
              }`}
            >
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/repositories/${repo.id}`}
                  className="text-lg font-bold hover:text-[var(--primary)] transition-colors"
                >
                  {repo.name}
                </Link>
                <span
                  className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full ${
                    repo.visibility === "private"
                      ? isDark
                        ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                        : "bg-[#EAE5FF] text-[#6C4DFF]"
                      : isDark
                      ? "bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]"
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
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {repo.owner}
              </span>
            </div>
          </div>

          <RepositoryStatus status={repo.status} progress={repo.progress} />
        </div>

        <p className="mt-3.5 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          {repo.description}
        </p>

        {/* Indexing Progress Indicator */}
        {repo.status === "indexing" && (
          <div className="mt-3">
            <div className="h-1.5 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                style={{ width: `${repo.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Meta & Actions */}
      <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-[var(--text-secondary)] font-mono text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
            {repo.language}
          </span>
          <span>{repo.symbolCount} symbols</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {repo.lastAnalyzed}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/repositories/${repo.id}`}
            className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Open in Code Explorer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/architecture"
            className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="View Architecture Map"
          >
            <GitBranch className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => onReanalyze(repo.id)}
            className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Re-analyze repository"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(repo.id)}
            className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-red-500 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
            title="Remove repository"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
