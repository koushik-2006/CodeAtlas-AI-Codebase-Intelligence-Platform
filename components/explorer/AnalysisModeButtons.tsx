"use client";

import { useTheme } from "@/hooks/useTheme";
import { Sparkles, GitBranch, FolderGit2 } from "lucide-react";

import { useRepositories } from "@/hooks/useRepositories";

interface AnalysisModeButtonsProps {
  disabled: boolean;
  selectedRepo: string;
  onRepoChange: (repo: string) => void;
  onExplainCode: () => void;
  onExplainWorkflow: () => void;
}

export function AnalysisModeButtons({
  disabled,
  selectedRepo,
  onRepoChange,
  onExplainCode,
  onExplainWorkflow,
}: AnalysisModeButtonsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { repositories } = useRepositories();

  return (
    <div className="p-6 border-t border-[var(--border-color)] space-y-4">
      {/* Repository selector for Workflow Tracing */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-[var(--primary)]" />
          <span className="font-bold text-[var(--text-primary)]">Target Repository:</span>
          <select
            value={selectedRepo}
            onChange={(e) => onRepoChange(e.target.value)}
            className={`py-1 px-2.5 rounded-lg text-xs font-semibold border outline-none cursor-pointer ${
              isDark
                ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                : "bg-white border-[#E5E5E0] text-[#1E2022]"
            }`}
          >
            {repositories.length > 0 ? (
              repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name} ({repo.status === "ready" ? `${repo.symbolCount || 0} symbols` : repo.status})
                </option>
              ))
            ) : (
              <option value="sample-project">sample-project (Indexed)</option>
            )}
            <option value="none">— No repository selected —</option>
          </select>
        </div>

        <span className="text-[11px] font-mono text-[var(--text-secondary)]">
          {selectedRepo === "sample-project"
            ? "5 files · AST indexed"
            : "Requires connected repository"}
        </span>
      </div>

      {/* Distinct Action Buttons */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Action A: Explain This Code */}
        <button
          type="button"
          onClick={onExplainCode}
          disabled={disabled}
          className={`p-3.5 rounded-2xl font-bold text-left transition-all border disabled:opacity-40 disabled:cursor-not-allowed group ${
            isDark
              ? "bg-[#161B22] border-[#30363D] text-[#F3F5FA] hover:border-[#29D3C2] hover:bg-[#1C2330]"
              : "bg-[#FAF9FF] border-[#E8E5F4] text-[#19143D] hover:border-[#6C4DFF] hover:bg-white"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-[var(--text-primary)]">
              Action A: Explain This Code
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed pl-8">
            Standalone snippet analysis (summary, line breakdown, functions, complexity).
          </p>
        </button>

        {/* Action B: Explain Complete Workflow */}
        <button
          type="button"
          onClick={onExplainWorkflow}
          disabled={disabled}
          className={`p-3.5 rounded-2xl font-bold text-left transition-all border disabled:opacity-40 disabled:cursor-not-allowed group ${
            isDark
              ? "bg-[#111725] border-[#242B39] text-[#F3F5FA] hover:border-[#8B7CFF] hover:bg-[#161F32]"
              : "bg-[#19143D] text-white hover:bg-[#251e59]"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg bg-[#8B7CFF]/20 text-[#8B7CFF] flex items-center justify-center">
              <GitBranch className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold">
              Action B: Trace Workflow
            </span>
          </div>
          <p className="text-[11px] opacity-80 leading-relaxed pl-8">
            Match against repository AST & render end-to-end call path with source links.
          </p>
        </button>
      </div>
    </div>
  );
}
