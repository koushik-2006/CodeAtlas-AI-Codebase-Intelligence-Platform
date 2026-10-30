"use client";

import React from "react";
import { GitFork, Layers, RefreshCw, CheckSquare, Square, Shield, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MultiRepoSummary } from "@/types/multi-repo";

interface MultiRepoHeaderProps {
  repositories: MultiRepoSummary[];
  selectedRepoIds: string[];
  onToggleRepo: (repoId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function MultiRepoHeader({
  repositories,
  selectedRepoIds,
  onToggleRepo,
  onSelectAll,
  onClearAll,
  isLoading,
  onRefresh,
}: MultiRepoHeaderProps) {
  const staleCount = repositories.filter((r) => r.isStale).length;

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#F4F0FF] dark:bg-[#1E1A38] text-[#6C4DFF] dark:text-[#A78BFA]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] tracking-tight">
                Multi-Repository Intelligence & Cross-Discovery
              </h1>
              <p className="text-sm text-[#6E6A8A] dark:text-[#8E95A8] mt-0.5">
                Explore inter-project dependencies, unified code search, reusable duplicate detection, and cross-repo impact analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Repository Scope Selector Bar */}
      <div className="mt-6 pt-5 border-t border-[#EAE6FD] dark:border-[#1E2638]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E6A8A] dark:text-[#8E95A8]">
              Active Scope:
            </span>
            <Badge variant="brand" className="text-xs font-medium">
              {selectedRepoIds.length} of {repositories.length} Repositories Selected
            </Badge>
            {staleCount > 0 && (
              <Badge variant="coral" className="text-xs font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {staleCount} Stale Index
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="text-xs font-semibold text-[#6C4DFF] dark:text-[#29D3C2] hover:underline"
            >
              Select All
            </button>
            <span className="text-[#6E6A8A] dark:text-[#8E95A8] text-xs">·</span>
            <button
              onClick={onClearAll}
              className="text-xs font-semibold text-[#6E6A8A] dark:text-[#8E95A8] hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Repository Pills */}
        <div className="flex flex-wrap gap-2">
          {repositories.map((repo) => {
            const isSelected = selectedRepoIds.includes(repo.id);
            return (
              <button
                key={repo.id}
                onClick={() => onToggleRepo(repo.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  isSelected
                    ? "bg-[#6C4DFF]/10 dark:bg-[#29D3C2]/10 border-[#6C4DFF] dark:border-[#29D3C2] text-[#6C4DFF] dark:text-[#29D3C2] shadow-sm"
                    : "bg-[#F7F5FE] dark:bg-[#141926] border-[#EAE6FD] dark:border-[#242B3D] text-[#6E6A8A] dark:text-[#8E95A8] hover:border-[#D1C9FC]"
                }`}
              >
                {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                <span className="font-semibold">{repo.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({repo.revision})</span>
                {repo.isStale && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Index older than 24h" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
