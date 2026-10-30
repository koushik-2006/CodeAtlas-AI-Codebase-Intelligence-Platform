"use client";

import React from "react";
import {
  PieChart,
  Package,
  Layers,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Info,
  Server,
  Repeat,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { TechnologyInsightsSummary } from "@/types/multi-repo";

interface TechnologyInsightsViewProps {
  insights: TechnologyInsightsSummary | null;
  isLoading: boolean;
}

export function TechnologyInsightsView({ insights, isLoading }: TechnologyInsightsViewProps) {
  if (isLoading) {
    return (
      <div className="p-12 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-[#6C4DFF] dark:border-[#29D3C2] border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-[#6E6A8A] dark:text-[#8E95A8]">
          Aggregating organization-wide technology insights and dependency metrics...
        </p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="p-8 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
        <p className="text-sm font-medium text-[#19143D] dark:text-[#F3F5FA]">
          No technology insights available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] font-medium">Index Coverage</span>
            <ShieldCheck className="w-4 h-4 text-[#2FD6A0]" />
          </div>
          <div className="text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] mt-1">
            {insights.indexingCoveragePercentage}%
          </div>
          <div className="text-[11px] text-[#8E95A8] mt-0.5">
            {insights.indexedRepositories} of {insights.totalRepositories} repos indexed
          </div>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] font-medium">Stale Repositories</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] mt-1">
            {insights.staleRepositories}
          </div>
          <div className="text-[11px] text-[#8E95A8] mt-0.5">
            Older than 24h
          </div>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] font-medium">Internal Libraries</span>
            <Package className="w-4 h-4 text-[#6C4DFF] dark:text-[#29D3C2]" />
          </div>
          <div className="text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] mt-1">
            {insights.internalLibrariesCount}
          </div>
          <div className="text-[11px] text-[#8E95A8] mt-0.5">
            Inter-repo contracts
          </div>
        </div>

        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] font-medium">Duplicate Candidates</span>
            <Repeat className="w-4 h-4 text-[#F3C969]" />
          </div>
          <div className="text-2xl font-bold text-[#19143D] dark:text-[#F3F5FA] mt-1">
            {insights.duplicateCandidateCount}
          </div>
          <div className="text-[11px] text-[#8E95A8] mt-0.5">
            Opportunities for reuse
          </div>
        </div>
      </div>

      {/* Two Column: Languages and Top Dependencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Languages in Use */}
        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA] flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#6C4DFF] dark:text-[#29D3C2]" />
            Programming Languages Distribution
          </h4>

          <div className="space-y-3">
            {insights.languages.map((lang, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#19143D] dark:text-[#F3F5FA]">
                    {lang.name}
                  </span>
                  <span className="text-[#8E95A8] font-mono">
                    {lang.percentage}% ({lang.repoCount} repo{lang.repoCount > 1 ? "s" : ""})
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F7F5FE] dark:bg-[#141926] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#6C4DFF] dark:bg-[#29D3C2]"
                    style={{ width: `${lang.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Dependencies */}
        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#6C4DFF] dark:text-[#29D3C2]" />
            Shared & Repeated Dependencies
          </h4>

          <div className="space-y-3">
            {insights.topDependencies.map((dep, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#19143D] dark:text-[#F3F5FA]">
                      {dep.name}
                    </span>
                    {dep.isInternal ? (
                      <Badge variant="brand" className="text-[10px]">Internal Library</Badge>
                    ) : (
                      <Badge variant="cyan" className="text-[10px]">Third-Party</Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-[#8E95A8] mt-1">
                    Versions in use: {dep.versions.join(", ")}
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-[#6C4DFF] dark:text-[#29D3C2]">
                  {dep.repoCount} repo{dep.repoCount > 1 ? "s" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="p-4 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] text-xs text-[#6E6A8A] dark:text-[#8E95A8] flex items-start gap-2.5">
        <Info className="w-4 h-4 text-[#6C4DFF] dark:text-[#29D3C2] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#19143D] dark:text-[#F3F5FA]">
            Documented Methodology & Scope Notice:
          </span>{" "}
          {insights.methodologyNotice}
        </div>
      </div>
    </div>
  );
}
