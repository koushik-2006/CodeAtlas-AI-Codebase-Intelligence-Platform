"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderGit2,
  FileCode,
  Layers,
  ShieldAlert,
  Gauge,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from "lucide-react";
import { useRepositories } from "@/hooks/useRepositories";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useTheme } from "@/hooks/useTheme";
import { getStore } from "@/lib/demo/store";

interface SparklineProps {
  points: string;
  color: string;
  width?: number;
  height?: number;
}

function Sparkline({ points, color, width = 64, height = 24 }: SparklineProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function DashboardKPIRow() {
  const { repositories, loading: reposLoading } = useRepositories();
  const { activeWorkspace } = useWorkspaces();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Reactive store state for findings, debt, and health
  const [storeData, setStoreData] = useState(() => {
    try {
      return getStore();
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStoreUpdate = () => {
      try {
        setStoreData(getStore());
      } catch {}
    };

    if (typeof window !== "undefined") {
      window.addEventListener("codeatlas:repositories-changed", handleStoreUpdate);
      window.addEventListener("codeatlas:workspace-changed", handleStoreUpdate);
      return () => {
        window.removeEventListener("codeatlas:repositories-changed", handleStoreUpdate);
        window.removeEventListener("codeatlas:workspace-changed", handleStoreUpdate);
      };
    }
  }, []);

  const metrics = useMemo(() => {
    // Determine active workspace repositories
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

    const reposCount = filteredRepos.length || 3;
    let symbols = 0;
    filteredRepos.forEach((r) => {
      symbols += r.symbolCount || 18;
    });
    if (symbols === 0) symbols = 4820;

    // Files: approximate 36 per repo + base
    const totalFiles = reposCount * 36 + 48;

    // Open findings count from store review sessions + debt
    let openFindingsCount = 0;
    if (storeData?.reviewSessions) {
      Object.values(storeData.reviewSessions).forEach((session: any) => {
        if (session.findings) {
          openFindingsCount += session.findings.filter((f: any) => f.status === "open").length;
        }
      });
    }
    if (storeData?.debtOverviews) {
      Object.values(storeData.debtOverviews).forEach((overview: any) => {
        openFindingsCount += (overview.criticalFindingsCount || 0) + (overview.warningFindingsCount || 0);
      });
    }
    if (openFindingsCount === 0) openFindingsCount = 6;

    // Debt score
    const debtOverview = storeData?.debtOverviews?.["sample-project"];
    const debtScore = debtOverview?.grade ? `${debtOverview.grade} (${debtOverview.totalDebtHours || 18.5}h)` : "B+ (18.5h)";

    // System health
    const healthStatus = storeData?.systemHealth?.status === "healthy" ? "99.98%" : "99.90%";

    return {
      totalRepos: reposCount,
      totalFiles,
      totalSymbols: symbols > 500 ? symbols : 4820,
      openFindings: openFindingsCount,
      techDebt: debtScore,
      systemHealth: healthStatus,
    };
  }, [repositories, activeWorkspace, storeData]);

  const cards = [
    {
      id: "kpi-repos",
      label: "Repositories",
      value: reposLoading ? "..." : String(metrics.totalRepos),
      trend: "+2 this week",
      trendType: "up" as const,
      icon: FolderGit2,
      href: "/repositories",
      tint: "bg-[#7C5CFC]/10 text-[#7C5CFC] border-[#7C5CFC]/20",
      sparkColor: "#7C5CFC",
      sparkline: "0,18 8,16 16,20 24,14 32,15 40,9 48,11 56,4 64,2",
    },
    {
      id: "kpi-files",
      label: "Files indexed",
      value: reposLoading ? "..." : metrics.totalFiles.toLocaleString(),
      trend: "+14% vs last week",
      trendType: "up" as const,
      icon: FileCode,
      href: "/repositories",
      tint: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      sparkColor: "#3B82F6",
      sparkline: "0,20 8,19 16,14 24,17 32,12 40,8 48,10 56,5 64,2",
    },
    {
      id: "kpi-symbols",
      label: "AST symbols",
      value: reposLoading ? "..." : metrics.totalSymbols.toLocaleString(),
      trend: "100% verified",
      trendType: "up" as const,
      icon: Layers,
      href: "/architecture",
      tint: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      sparkColor: "#10B981",
      sparkline: "0,18 8,15 16,16 24,11 32,12 40,6 48,8 56,3 64,2",
    },
    {
      id: "kpi-findings",
      label: "Open findings",
      value: String(metrics.openFindings),
      trend: "-3 resolved today",
      trendType: "good-down" as const,
      icon: ShieldAlert,
      href: "/code-review",
      tint: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      sparkColor: "#F59E0B",
      sparkline: "0,4 8,6 16,10 24,8 32,14 40,12 48,18 56,16 64,20",
    },
    {
      id: "kpi-debt",
      label: "Tech-debt score",
      value: metrics.techDebt,
      trend: "+4.2% quality",
      trendType: "up" as const,
      icon: Gauge,
      href: "/refactoring",
      tint: "bg-violet-500/10 text-violet-500 border-violet-500/20",
      sparkColor: "#8B5CF6",
      sparkline: "0,19 8,21 16,15 24,13 32,11 40,8 48,7 56,5 64,3",
    },
    {
      id: "kpi-health",
      label: "System health",
      value: metrics.systemHealth,
      trend: "0 incidents",
      trendType: "neutral" as const,
      icon: Activity,
      href: "/system-health",
      tint: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      sparkColor: "#06B6D4",
      sparkline: "0,6 8,5 16,6 24,5 32,5 40,6 48,5 56,5 64,5",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.id}
            href={card.href}
            aria-label={`${card.label}: ${card.value}, click to view details`}
            className={`group rounded-2xl border p-4 sm:p-4.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between ${
              isDark
                ? "bg-[#0D111B] border-[#242B39] hover:border-[#7C5CFC]/60 hover:shadow-[0_4px_20px_-4px_rgba(124,92,252,0.15)]"
                : "bg-white border-[#E8E5F4] shadow-2xs hover:border-[#7C5CFC]/40 hover:shadow-[0_4px_16px_-4px_rgba(124,92,252,0.12)]"
            }`}
          >
            <div>
              {/* Top row: Icon + Sparkline */}
              <div className="flex items-center justify-between gap-2">
                <div className={`p-2 rounded-xl border ${card.tint} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <Sparkline points={card.sparkline} color={card.sparkColor} width={56} height={20} />
              </div>

              {/* Value and Label */}
              <div className="mt-3.5">
                <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
                  {card.value}
                </div>
                <p className="mt-0.5 text-xs font-medium text-[var(--text-secondary)] truncate">
                  {card.label}
                </p>
              </div>
            </div>

            {/* Bottom trend row */}
            <div className="mt-3 pt-2.5 border-t border-[var(--border-color)]/60 flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1">
                {card.trendType === "up" && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
                {card.trendType === "good-down" && (
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
                {card.trendType === "neutral" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                )}
                <span className="truncate">{card.trend}</span>
              </span>
              <span className="text-[10px] text-[var(--primary)] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                &rarr;
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
