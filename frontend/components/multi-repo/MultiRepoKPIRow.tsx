"use client";

import React from "react";
import {
  Layers,
  GitFork,
  Package,
  Repeat,
  AlertTriangle,
  Globe,
  ArrowUpRight,
} from "lucide-react";

export type MultiRepoTab =
  | "dependencies"
  | "shared-libraries"
  | "duplicates"
  | "api-contracts"
  | "impact"
  | "search";

interface MultiRepoKPIRowProps {
  summary: {
    reposAnalyzed: number;
    crossRepoDependencies: number;
    sharedLibrariesCount: number;
    duplicateCodeBlocks: number;
    versionConflictsCount: number;
    crossServiceAPICalls: number;
  };
  activeTab: MultiRepoTab;
  onSelectTab: (tab: MultiRepoTab, options?: { showConflictsOnly?: boolean }) => void;
}

export function MultiRepoKPIRow({ summary, activeTab, onSelectTab }: MultiRepoKPIRowProps) {
  const cards = [
    {
      id: "repos",
      label: "Repos Analyzed",
      value: summary.reposAnalyzed,
      subtext: "Active in scope",
      icon: Layers,
      color: "text-[#7C5CFC]",
      bg: "bg-[#7C5CFC]/10",
      targetTab: "dependencies" as MultiRepoTab,
    },
    {
      id: "deps",
      label: "Cross-Repo Dependencies",
      value: summary.crossRepoDependencies,
      subtext: "Packages & APIs",
      icon: GitFork,
      color: "text-[#29D3C2]",
      bg: "bg-[#29D3C2]/10",
      targetTab: "dependencies" as MultiRepoTab,
    },
    {
      id: "libs",
      label: "Shared Libraries",
      value: summary.sharedLibrariesCount,
      subtext: "NPM, PyPI & Go",
      icon: Package,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      targetTab: "shared-libraries" as MultiRepoTab,
    },
    {
      id: "duplicates",
      label: "Duplicate Code Blocks",
      value: summary.duplicateCodeBlocks,
      subtext: "Consolidation targets",
      icon: Repeat,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      targetTab: "duplicates" as MultiRepoTab,
    },
    {
      id: "conflicts",
      label: "Version Conflicts",
      value: summary.versionConflictsCount,
      subtext: summary.versionConflictsCount > 0 ? "Drift detected" : "All aligned",
      icon: AlertTriangle,
      color: summary.versionConflictsCount > 0 ? "text-amber-500" : "text-emerald-500",
      bg: summary.versionConflictsCount > 0 ? "bg-amber-500/10" : "bg-emerald-500/10",
      targetTab: "shared-libraries" as MultiRepoTab,
      showConflictsOnly: true,
      highlight: summary.versionConflictsCount > 0,
    },
    {
      id: "apis",
      label: "Cross-Service API Calls",
      value: summary.crossServiceAPICalls,
      subtext: "HTTP route contracts",
      icon: Globe,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      targetTab: "api-contracts" as MultiRepoTab,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeTab === card.targetTab;

        return (
          <div
            key={card.id}
            onClick={() => onSelectTab(card.targetTab, { showConflictsOnly: card.showConflictsOnly })}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
              isActive
                ? "bg-[#FFFFFF] dark:bg-[#0D111A] border-[#7C5CFC] shadow-md ring-1 ring-[#7C5CFC]/30"
                : "bg-[#FFFFFF] dark:bg-[#0D111A] border-[#EAE6FD] dark:border-[#1E2638] hover:border-[#7C5CFC]/40 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#8E95A8] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="mt-3">
              <div className="text-2xl font-extrabold text-[#19143D] dark:text-[#F3F5FA] tracking-tight">
                {card.value}
              </div>
              <div className="text-xs font-semibold text-[#19143D] dark:text-[#F3F5FA] mt-0.5 truncate">
                {card.label}
              </div>
              <div className="text-[11px] text-[#8E95A8] mt-0.5 truncate">
                {card.subtext}
              </div>
            </div>

            {card.highlight && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

