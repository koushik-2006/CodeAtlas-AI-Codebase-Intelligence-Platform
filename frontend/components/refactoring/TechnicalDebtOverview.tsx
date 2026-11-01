"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Flame,
  GitFork,
  Repeat,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  FileCode,
  ArrowRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Layers,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TechnicalDebtOverview, TopFileToFix, ComplexityHotspot } from "@/types/refactoring";

interface TechnicalDebtOverviewProps {
  overview: TechnicalDebtOverview;
  isScanning: boolean;
  onRefreshScan: () => void;
  onSelectHotspot?: (filePath: string, symbolName?: string, lineRange?: { start: number; end: number }) => void;
  onSelectRepo?: (repoId: string) => void;
  onSelectFile?: (filePath: string) => void;
  onProposeFromFile?: (filePath: string, repoId: string, symbolName?: string) => void;
}

export default function TechnicalDebtOverviewComponent({
  overview,
  isScanning,
  onRefreshScan,
  onSelectHotspot,
  onSelectRepo,
  onSelectFile,
  onProposeFromFile,
}: TechnicalDebtOverviewProps) {
  const [showFormula, setShowFormula] = useState(false);
  const [hoveredScatterPoint, setHoveredScatterPoint] = useState<ComplexityHotspot | null>(null);

  const score = overview.compositeScore ?? overview.overallScore ?? 84;
  const grade = overview.debtRating || "B";
  const effortHours = overview.totalDebtHours || 14.5;

  const getRatingBadge = (rating: "A" | "B" | "C" | "D" | "F") => {
    switch (rating) {
      case "A":
        return <Badge variant="mint" className="text-xs px-2.5 py-0.5">Grade A · Pristine</Badge>;
      case "B":
        return <Badge variant="cyan" className="text-xs px-2.5 py-0.5">Grade B · Minor Debt</Badge>;
      case "C":
        return <Badge variant="sun" className="text-xs px-2.5 py-0.5">Grade C · Moderate Debt</Badge>;
      case "D":
        return <Badge variant="coral" className="text-xs px-2.5 py-0.5">Grade D · High Debt</Badge>;
      case "F":
        return <Badge variant="coral" className="text-xs px-2.5 py-0.5">Grade F · Critical Debt</Badge>;
    }
  };

  const getScoreColor = (sc: number) => {
    if (sc >= 90) return "text-[#2FD6A0]";
    if (sc >= 80) return "text-[#7C5CFC]";
    if (sc >= 70) return "text-[#F3C969]";
    return "text-red-500";
  };

  const getScoreStroke = (sc: number) => {
    if (sc >= 90) return "#2FD6A0";
    if (sc >= 80) return "#7C5CFC";
    if (sc >= 70) return "#F3C969";
    return "#EF4444";
  };

  // Ring SVG constants
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  // Chart data
  const historicalScans = overview.historicalScans || [];
  const categories = overview.categories || [];
  const hotspots = overview.hotspots || [];
  const topFiles = overview.topFilesToFix || [];
  const perRepo = overview.perRepoDebt || [];

  return (
    <div className="space-y-6">
      {/* Top Banner: Composite Score Ring, Letter Grade & KPI Cards */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Ring + Summary */}
          <div className="flex items-center gap-6">
            {/* SVG Ring Progress */}
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-[var(--bg-card-hover)]"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={getScoreStroke(score)}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-2xl font-black tracking-tight ${getScoreColor(score)}`}>
                  {score}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Grade {grade}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {overview.repositoryName || "Workspace Technical Debt"}
                </h2>
                {getRatingBadge(grade)}
                {overview.isStale && <Badge variant="coral">Stale Indexing</Badge>}
              </div>

              <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-xl leading-relaxed">
                Objective maintainability index computed locally across indexed AST parse trees,
                cyclomatic decision boundaries, modular fan-out coupling, and code duplication.
              </p>

              <div className="flex items-center gap-4 mt-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => setShowFormula(!showFormula)}
                  className="text-xs text-[#7C5CFC] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Info className="w-3.5 h-3.5" />
                  {showFormula ? "Hide Formula" : "View Scoring Formula"}
                </button>
                <span className="text-[var(--text-secondary)] font-mono text-[11px]">
                  Last scanned: {new Date(overview.analyzedAt || Date.now()).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshScan}
              disabled={isScanning}
              className="gap-2 border-[var(--border-color)] hover:border-[#7C5CFC]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-[#7C5CFC]" : ""}`} />
              {isScanning ? "Analyzing Codebase..." : "Re-scan Repository"}
            </Button>
          </div>
        </div>

        {/* Expandable Deterministic Formula */}
        {showFormula && (
          <div className="mt-5 pt-4 border-t border-[var(--border-color)] bg-[var(--bg-card-hover)]/50 p-4 rounded-xl animate-in fade-in">
            <h4 className="text-xs font-bold font-mono text-[var(--text-primary)] mb-1">
              Deterministic Scoring Formula
            </h4>
            <p className="font-mono text-xs text-[#7C5CFC] bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-2 rounded-lg">
              {overview.scoreFormula || "Score = 100 - (12 × Critical + 4 × Warning + 1.5 × Info + 0.5 × Low)"}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Penalties are weighted strictly by operational risk: critical errors and cyclic couplings carry the heaviest
              deductions, while formatting and minor comments have minimal impact.
            </p>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[var(--border-color)]">
          <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
            <div className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#7C5CFC]" />
              Remediation Effort
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)] mt-1">
              {effortHours} <span className="text-xs font-normal text-[var(--text-secondary)]">hours</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
            <div className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Critical Issues
            </div>
            <div className="text-xl font-bold text-red-500 mt-1">
              {overview.findingsCount?.critical || 0}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
            <div className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F3C969]" />
              High / Warnings
            </div>
            <div className="text-xl font-bold text-[#F3C969] mt-1">
              {overview.findingsCount?.warning || 0}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
            <div className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7C5CFC]" />
              Total Open Findings
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)] mt-1">
              {overview.findingsCount?.total || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Per-Repository Table (when in workspace or multi-repo view) */}
      {perRepo.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Repository Health Breakdown
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Click any repository row to isolate findings and proposals for that project.
              </p>
            </div>
            <Badge variant="brand">{perRepo.length} Repositories</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-mono">
                  <th className="pb-2 font-semibold">Repository</th>
                  <th className="pb-2 font-semibold">Debt Score</th>
                  <th className="pb-2 font-semibold">Grade</th>
                  <th className="pb-2 font-semibold">Open Findings</th>
                  <th className="pb-2 font-semibold">Remediation Effort</th>
                  <th className="pb-2 font-semibold">Trend vs Last Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {perRepo.map((r) => (
                  <tr
                    key={r.repositoryId}
                    onClick={() => onSelectRepo?.(r.repositoryId)}
                    className="hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 font-bold text-[var(--text-primary)] group-hover:text-[#7C5CFC] flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      {r.repositoryName}
                    </td>
                    <td className="py-2.5 font-mono font-bold">
                      <span className={getScoreColor(r.score)}>{r.score}</span> / 100
                    </td>
                    <td className="py-2.5">
                      <Badge variant={r.grade === "A" ? "mint" : r.grade === "B" ? "cyan" : "coral"}>
                        {r.grade}
                      </Badge>
                    </td>
                    <td className="py-2.5 font-mono">
                      {r.findingsCount} issues ({r.criticalCount} crit, {r.warningCount} warn)
                    </td>
                    <td className="py-2.5 font-mono text-[var(--text-secondary)]">
                      {r.effortHours} hrs
                    </td>
                    <td className="py-2.5">
                      {r.trend > 0 ? (
                        <span className="text-[#2FD6A0] flex items-center gap-1 font-semibold">
                          <TrendingUp className="w-3 h-3" /> +{r.trend} pts
                        </span>
                      ) : r.trend < 0 ? (
                        <span className="text-red-500 flex items-center gap-1 font-semibold">
                          <TrendingDown className="w-3 h-3" /> {r.trend} pts
                        </span>
                      ) : (
                        <span className="text-[var(--text-secondary)]">→ stable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts Grid: Categories (Bar) & Trend (Line) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7C5CFC]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Findings by Category
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              AST Classification
            </span>
          </div>

          <div className="space-y-3">
            {categories.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] italic">No category data available.</p>
            ) : (
              categories.map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                      {cat.label}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                      {cat.count} issues ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-[var(--bg-card-hover)] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        cat.severity === "critical"
                          ? "bg-red-500"
                          : cat.severity === "warning" || cat.severity === "high"
                          ? "bg-[#F3C969]"
                          : "bg-[#7C5CFC]"
                      }`}
                      style={{ width: `${Math.max(8, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 8-Scan Historical Trend Line Chart */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2FD6A0]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Debt Trend (Last 8 Scans)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              Score History
            </span>
          </div>

          {/* Inline SVG Line Chart */}
          <div className="relative pt-2">
            <svg className="w-full h-44 overflow-visible" viewBox="0 0 320 120">
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#7C5CFC" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              <line x1="0" y1="20" x2="320" y2="20" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.6" />
              <line x1="0" y1="60" x2="320" y2="60" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.6" />
              <line x1="0" y1="100" x2="320" y2="100" stroke="var(--border-color)" strokeDasharray="3 3" opacity="0.6" />

              {/* Compute coordinates for 8 points */}
              {(() => {
                if (historicalScans.length < 2) return null;
                const points = historicalScans.map((s, idx) => {
                  const x = (idx / (historicalScans.length - 1)) * 300 + 10;
                  // Map score 60-100 to y 100-15
                  const y = 105 - ((s.score - 55) / 45) * 85;
                  return { x, y, ...s };
                });

                const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
                const areaD = `${pathD} L ${points[points.length - 1].x} 115 L ${points[0].x} 115 Z`;

                return (
                  <>
                    <path d={areaD} fill="url(#trendGrad)" />
                    <path d={pathD} fill="none" stroke="#7C5CFC" strokeWidth="2.5" strokeLinecap="round" />
                    {points.map((p, idx) => (
                      <g key={idx} className="cursor-pointer group">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={idx === points.length - 1 ? 4.5 : 3.5}
                          className="fill-[#7C5CFC] stroke-[var(--bg-card)] stroke-2 group-hover:r-6 transition-all"
                        />
                        <text
                          x={p.x}
                          y={p.y - 7}
                          textAnchor="middle"
                          className="text-[9px] font-mono fill-[var(--text-secondary)] font-bold group-hover:fill-[var(--text-primary)]"
                        >
                          {p.score}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] font-mono text-[var(--text-secondary)] mt-2">
              {historicalScans.map((s, idx) => (
                <span key={idx} className="truncate max-w-[40px] text-center">
                  {s.dateLabel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hotspots Scatter Plot & Top 5 Files to Fix First */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotspots Scatter Plot (x = complexity, y = size) */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Hotspots Scatter (Complexity vs Size)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              Click bubble to filter
            </span>
          </div>

          <div className="relative pt-2">
            <svg className="w-full h-52 overflow-visible bg-[var(--bg-card-hover)]/30 rounded-xl p-3 border border-[var(--border-color)]/60" viewBox="0 0 320 150">
              {/* Axes */}
              <line x1="25" y1="130" x2="310" y2="130" stroke="var(--border-color)" strokeWidth="1" />
              <line x1="25" y1="10" x2="25" y2="130" stroke="var(--border-color)" strokeWidth="1" />

              <text x="310" y="142" textAnchor="end" className="text-[9px] font-mono fill-[var(--text-secondary)]">
                Complexity →
              </text>
              <text x="30" y="15" textAnchor="start" className="text-[9px] font-mono fill-[var(--text-secondary)]">
                ↑ Lines of Code
              </text>

              {/* Bubbles */}
              {hotspots.map((h, i) => {
                // Map complexity (0-30) to x (35-290)
                const cx = 35 + Math.min(255, (h.complexityScore / 30) * 255);
                // Map lines (0-500) to y (120-25)
                const cy = 120 - Math.min(95, (h.lineCount / 450) * 95);
                const r = Math.max(5, Math.min(14, 4 + h.complexityScore / 2));
                const isHovered = hoveredScatterPoint?.filePath === h.filePath;

                return (
                  <g
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredScatterPoint(h)}
                    onMouseLeave={() => setHoveredScatterPoint(null)}
                    onClick={() => {
                      onSelectFile?.(h.filePath);
                      onSelectHotspot?.(h.filePath, h.symbolName, h.lineRange);
                    }}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={h.complexityScore >= 12 ? "#EF4444" : h.complexityScore >= 8 ? "#F3C969" : "#7C5CFC"}
                      fillOpacity={isHovered ? 0.9 : 0.65}
                      stroke="var(--bg-card)"
                      strokeWidth="2"
                      className="transition-all hover:scale-125"
                    />
                    <text
                      x={cx}
                      y={cy - r - 2}
                      textAnchor="middle"
                      className="text-[9px] font-mono fill-[var(--text-primary)] font-bold pointer-events-none"
                    >
                      {h.filePath.split("/").pop()}
                    </text>
                  </g>
                );
              })}
            </svg>

            {hoveredScatterPoint && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] space-y-0.5 animate-in fade-in">
                <div className="font-bold flex items-center justify-between">
                  <span>{hoveredScatterPoint.filePath}</span>
                  <Badge variant={hoveredScatterPoint.complexityScore >= 12 ? "coral" : "sun"}>
                    Complexity {hoveredScatterPoint.complexityScore}
                  </Badge>
                </div>
                <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                  {hoveredScatterPoint.lineCount} lines · Symbol: {hoveredScatterPoint.symbolName || "Module"}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] truncate">
                  {hoveredScatterPoint.rationale}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Files to Fix First */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#7C5CFC]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Top 5 Files to Fix First
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              Ranked by Risk
            </span>
          </div>

          <div className="space-y-2.5">
            {topFiles.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] italic">
                No high-risk files flagged for priority remediation.
              </p>
            ) : (
              topFiles.map((tf, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[#7C5CFC]/60 transition-all flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[var(--text-primary)] truncate">
                        {tf.filePath}
                      </span>
                      <Badge variant={tf.primarySeverity === "critical" ? "coral" : "sun"}>
                        {tf.findingCount} issues · {tf.totalEffortHours}h
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">
                      {tf.reason}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onProposeFromFile?.(tf.filePath, tf.repositoryId)}
                    className="shrink-0 text-xs px-2.5 py-1 gap-1 text-[#7C5CFC] hover:border-[#7C5CFC]"
                  >
                    <Wrench className="w-3 h-3" />
                    Propose Fix
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Deep-Dive Architectural Cards: Circular Dependencies & Module Coupling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circular Dependencies */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Circular Dependencies ({overview.circularDependencies?.length || 0})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              AST Graph DFS
            </span>
          </div>

          <div className="space-y-3">
            {(!overview.circularDependencies || overview.circularDependencies.length === 0) ? (
              <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2FD6A0]" />
                <span>No circular import cycles detected. Dependency graph is acyclic.</span>
              </div>
            ) : (
              overview.circularDependencies.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-red-500/25 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--text-primary)]">
                      {c.description}
                    </span>
                    <Badge variant="coral">{c.severity}</Badge>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px] bg-[var(--bg-card)] p-2 rounded-lg border border-[var(--border-color)]">
                    {c.cycle.map((node, idx) => (
                      <React.Fragment key={idx}>
                        <span className="text-[#7C5CFC] font-semibold">{node.split("/").pop()}</span>
                        {idx < c.cycle.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-[var(--text-secondary)] shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    <span className="font-semibold text-[var(--text-primary)]">Decoupling advice: </span>
                    {c.suggestedDecoupling}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Module Coupling */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[#7C5CFC]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Module Coupling & Fan-Out
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              AST Call Edges
            </span>
          </div>

          <div className="space-y-2">
            {(!overview.couplingMetrics || overview.couplingMetrics.length === 0) ? (
              <p className="text-xs text-[var(--text-secondary)] italic">No coupling metrics calculated.</p>
            ) : (
              overview.couplingMetrics.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-mono font-semibold text-[var(--text-primary)] truncate">
                      {m.modulePath}
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
                      Fan-Out: {m.fanOut} · Fan-In: {m.fanIn} · Coupling Ratio: {m.couplingRatio.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    {m.isHighCoupling ? (
                      <Badge variant="coral">High Coupling</Badge>
                    ) : (
                      <Badge variant="mint">Balanced</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
