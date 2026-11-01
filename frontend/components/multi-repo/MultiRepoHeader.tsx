"use client";

import React, { useState } from "react";
import {
  GitFork,
  Layers,
  RefreshCw,
  Check,
  ChevronDown,
  Building2,
  FolderGit2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MultiRepoSummary } from "@/types/multi-repo";

interface MultiRepoHeaderProps {
  repositories: MultiRepoSummary[];
  selectedRepoIds: string[];
  onToggleRepo: (repoId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  workspaces: Array<{ id: string; name: string; isPersonal?: boolean }>;
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
  isAnalyzing: boolean;
  analysisProgress: number; // 0 - 100
  onReanalyze: () => void;
  lastAnalyzedTime?: string;
}

export function MultiRepoHeader({
  repositories,
  selectedRepoIds,
  onToggleRepo,
  onSelectAll,
  onClearAll,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  isAnalyzing,
  analysisProgress,
  onReanalyze,
  lastAnalyzedTime,
}: MultiRepoHeaderProps) {
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isRepoPickerOpen, setIsRepoPickerOpen] = useState(false);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || {
    id: "ws_team_demo",
    name: "Acme Engineering",
  };

  const staleCount = repositories.filter((r) => r.isStale).length;

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-xl bg-[#F4F0FF] dark:bg-[#1E1A38] text-[#7C5CFC] dark:text-[#A78BFA] shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] tracking-tight">
                Multi-Repository Intelligence
              </h1>
              <Badge variant="brand" className="text-xs">
                Cross-Project AST
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
              Analyze cross-codebase dependencies, detect shared library version drift, eliminate duplicated code, and inspect inter-service API contracts.
            </p>
          </div>
        </div>

        {/* Workspace Switcher & Re-Analyze Action */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Workspace Selector */}
          <div className="relative">
            <button
              onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs font-semibold text-[#19143D] dark:text-[#F3F5FA] hover:border-[#7C5CFC]/50 transition-colors"
              title="Filter by workspace"
            >
              <Building2 className="w-3.5 h-3.5 text-[#7C5CFC]" />
              <span className="max-w-[140px] truncate">{activeWs.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8E95A8]" />
            </button>

            {isWorkspaceDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsWorkspaceDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] shadow-xl py-1 z-50">
                  <div className="px-3 py-2 text-[11px] font-semibold text-[#8E95A8] uppercase tracking-wider border-b border-[#EAE6FD] dark:border-[#1E2638]">
                    Select Workspace Scope
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        onSelectWorkspace(ws.id);
                        setIsWorkspaceDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors ${
                        ws.id === activeWorkspaceId
                          ? "bg-[#F4F0FF] dark:bg-[#1E1A38] text-[#7C5CFC] font-semibold"
                          : "text-[#19143D] dark:text-[#F3F5FA] hover:bg-[#F7F5FE] dark:hover:bg-[#141926]"
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.id === activeWorkspaceId && <Check className="w-3.5 h-3.5 text-[#7C5CFC]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Re-analyze Button with Animated Progress */}
          <Button
            variant="primary"
            size="sm"
            onClick={onReanalyze}
            disabled={isAnalyzing || repositories.length === 0}
            className="flex items-center gap-2 px-4 shadow-sm relative overflow-hidden"
          >
            {isAnalyzing && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            )}
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
            <span>{isAnalyzing ? `Analyzing (${analysisProgress}%)` : "Re-analyze"}</span>
          </Button>
        </div>
      </div>

      {/* Repository Scope Selector Bar */}
      <div className="pt-4 border-t border-[#EAE6FD] dark:border-[#1E2638]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E6A8A] dark:text-[#8E95A8]">
              Scope:
            </span>
            <Badge variant="brand" className="text-xs font-medium">
              Analyzing {selectedRepoIds.length} of {repositories.length} Repositories
            </Badge>
            {staleCount > 0 && (
              <Badge variant="coral" className="text-xs font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {staleCount} Stale Index
              </Badge>
            )}
            {lastAnalyzedTime && (
              <span className="text-[11px] text-[#8E95A8] ml-2 hidden sm:inline">
                Last analyzed: {lastAnalyzedTime}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="text-xs font-semibold text-[#7C5CFC] hover:underline cursor-pointer"
            >
              Select All
            </button>
            <span className="text-[#6E6A8A] dark:text-[#8E95A8] text-xs">·</span>
            <button
              onClick={onClearAll}
              className="text-xs font-semibold text-[#6E6A8A] dark:text-[#8E95A8] hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Repository Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {repositories.map((repo) => {
            const isSelected = selectedRepoIds.includes(repo.id);
            return (
              <button
                key={repo.id}
                onClick={() => onToggleRepo(repo.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#F4F0FF] dark:bg-[#1E1A38] border-[#7C5CFC] text-[#7C5CFC] dark:text-[#A78BFA] font-bold shadow-sm"
                    : "bg-[#FAFAFE] dark:bg-[#141926] border-[#EAE6FD] dark:border-[#242B3D] text-[#6E6A8A] dark:text-[#8E95A8] hover:border-[#7C5CFC]/40"
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>{repo.name}</span>
                {isSelected && <Check className="w-3 h-3 text-[#7C5CFC]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
