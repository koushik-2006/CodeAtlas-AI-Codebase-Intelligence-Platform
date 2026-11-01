"use client";

import React from "react";
import {
  Bot,
  Plus,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  Play,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export type AgentFilterTab =
  | "all"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

interface AgentWorkspaceHeaderProps {
  stats: {
    running: number;
    waitingApproval: number;
    completedToday: number;
    successRate: number;
  };
  activeTab: AgentFilterTab;
  onSelectTab: (tab: AgentFilterTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: "newest" | "oldest";
  onSortChange: (sort: "newest" | "oldest") => void;
  selectedRepo: string;
  onSelectRepo: (repo: string) => void;
  repositories: Array<{ id: string; name: string }>;
  onNewRun: () => void;
  onOpenPolicy: () => void;
}

export function AgentWorkspaceHeader({
  stats,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedRepo,
  onSelectRepo,
  repositories,
  onNewRun,
  onOpenPolicy,
}: AgentWorkspaceHeaderProps) {
  const tabs: Array<{ id: AgentFilterTab; label: string; count?: number; variant?: "brand" | "coral" | "mint" }> = [
    { id: "all", label: "All Runs" },
    { id: "running", label: "Running", count: stats.running, variant: "brand" },
    { id: "awaiting_approval", label: "Needs approval", count: stats.waitingApproval, variant: "coral" },
    { id: "completed", label: "Completed", count: stats.completedToday, variant: "mint" },
    { id: "failed", label: "Failed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20 shrink-0 shadow-sm">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#19143D] dark:text-[#F3F5FA]">
                Agent Workspace
              </h1>
              <Badge variant="brand" className="text-xs">
                Autonomous CI Pipeline
              </Badge>
              {stats.waitingApproval > 0 && (
                <Badge variant="coral" className="text-xs animate-pulse">
                  {stats.waitingApproval} Waiting for Approval
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
              Multi-step AI engineering tasks executed with repository AST context, real diff generation, and strict human authorization gates.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={onOpenPolicy}
            className="flex items-center gap-2 text-xs border-[#EAE6FD] dark:border-[#242B3D] text-[#19143D] dark:text-[#F3F5FA]"
          >
            <ShieldCheck className="w-4 h-4 text-[#7C5CFC]" />
            <span>Policies</span>
          </Button>

          <Button
            variant="primary"
            onClick={onNewRun}
            className="flex items-center gap-2 text-xs bg-[#7C5CFC] hover:bg-[#6A4BE8] text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Agent Run</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Row (Running, Waiting for approval, Completed today, Success rate) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] shadow-xs">
          <div className="flex items-center justify-between text-[#6E6A8A] dark:text-[#8E95A8] text-xs font-medium">
            <span>Running</span>
            <span className="p-1.5 rounded-lg bg-[#7C5CFC]/10 text-[#7C5CFC]">
              <Play className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] font-mono">
              {stats.running}
            </span>
            {stats.running > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Active
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] shadow-xs">
          <div className="flex items-center justify-between text-[#6E6A8A] dark:text-[#8E95A8] text-xs font-medium">
            <span>Waiting for approval</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] font-mono">
              {stats.waitingApproval}
            </span>
            {stats.waitingApproval > 0 && (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Action required
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] shadow-xs">
          <div className="flex items-center justify-between text-[#6E6A8A] dark:text-[#8E95A8] text-xs font-medium">
            <span>Completed today</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] font-mono">
              {stats.completedToday}
            </span>
            <span className="text-[11px] font-medium text-[#6E6A8A] dark:text-[#8E95A8]">
              Verified patches
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] shadow-xs">
          <div className="flex items-center justify-between text-[#6E6A8A] dark:text-[#8E95A8] text-xs font-medium">
            <span>Success rate</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] font-mono">
              {stats.successRate}%
            </span>
            <span className="text-[11px] font-medium text-[#6E6A8A] dark:text-[#8E95A8]">
              Automated tests
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-[#EAE6FD] dark:border-[#1E2638] gap-1 pb-px no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-[#7C5CFC] text-[#7C5CFC] dark:text-[#A78BFA]"
                    : "border-transparent text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#19143D] dark:hover:text-[#F3F5FA]"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      tab.variant === "coral"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
                        : tab.variant === "mint"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                        : "bg-[#7C5CFC]/15 text-[#7C5CFC] dark:text-[#A78BFA]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search, Repo Filter, and Sort */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E95A8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search runs by title, repo, or symbol..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#242B3D] text-[#19143D] dark:text-[#F3F5FA] placeholder-[#8E95A8] outline-none focus:border-[#7C5CFC]"
            />
          </div>

          <select
            value={selectedRepo}
            onChange={(e) => onSelectRepo(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#242B3D] text-[#19143D] dark:text-[#F3F5FA] outline-none focus:border-[#7C5CFC]"
          >
            <option value="all">All Repositories</option>
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as "newest" | "oldest")}
            className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#242B3D] text-[#19143D] dark:text-[#F3F5FA] outline-none focus:border-[#7C5CFC]"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>
    </div>
  );
}
