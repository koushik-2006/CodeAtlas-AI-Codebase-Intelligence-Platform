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
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TechnicalDebtOverview } from "@/types/refactoring";

interface TechnicalDebtOverviewProps {
  overview: TechnicalDebtOverview;
  isScanning: boolean;
  onRefreshScan: () => void;
  onSelectHotspot?: (filePath: string, symbolName?: string, lineRange?: { start: number; end: number }) => void;
}

export default function TechnicalDebtOverviewComponent({
  overview,
  isScanning,
  onRefreshScan,
  onSelectHotspot,
}: TechnicalDebtOverviewProps) {
  const [showFormula, setShowFormula] = useState(false);
  const [expandedHotspots, setExpandedHotspots] = useState(false);

  const getRatingBadge = (rating: "A" | "B" | "C" | "D" | "F") => {
    switch (rating) {
      case "A":
        return <Badge variant="mint" className="text-sm px-3 py-1">Grade A · Pristine</Badge>;
      case "B":
        return <Badge variant="cyan" className="text-sm px-3 py-1">Grade B · Minor Debt</Badge>;
      case "C":
        return <Badge variant="sun" className="text-sm px-3 py-1">Grade C · Moderate Debt</Badge>;
      case "D":
        return <Badge variant="coral" className="text-sm px-3 py-1">Grade D · High Debt</Badge>;
      case "F":
        return <Badge variant="coral" className="text-sm px-3 py-1">Grade F · Critical Debt</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#2FD6A0]";
    if (score >= 80) return "text-[#29D3C2]";
    if (score >= 70) return "text-[#F3C969]";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Composite Score & Summary */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] shrink-0">
              <span className={`text-3xl font-extrabold tracking-tight ${getScoreColor(overview.compositeScore)}`}>
                {overview.compositeScore}
              </span>
              <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] mt-0.5">
                Health Score
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  Technical Debt Index
                </h2>
                {getRatingBadge(overview.debtRating)}
                {overview.isStale && (
                  <Badge variant="coral">Stale Indexing</Badge>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl leading-relaxed">
                Aggregated architectural health based on AST cyclomatic complexity, module fan-out coupling,
                cycle DFS analysis, and duplicate code patterns.
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowFormula(!showFormula)}
                  className="text-xs text-[#29D3C2] hover:underline flex items-center gap-1 font-medium"
                >
                  <Info className="w-3.5 h-3.5" />
                  {showFormula ? "Hide Formula" : "View Verified Calculation Formula"}
                </button>
                <span className="text-[var(--text-secondary)] font-mono text-[11px]">
                  Analyzed: {new Date(overview.analyzedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshScan}
              disabled={isScanning}
              className="gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? "Scanning Source..." : "Rescan Repository"}
            </Button>
          </div>
        </div>

        {/* Expandable Formula Explanation */}
        {showFormula && (
          <div className="mt-5 pt-4 border-t border-[var(--border-color)] bg-[var(--bg-card-hover)]/40 p-4 rounded-lg">
            <h4 className="text-xs font-bold font-mono text-[var(--text-primary)] mb-1">
              Deterministic Scoring Formula
            </h4>
            <p className="font-mono text-xs text-[#29D3C2] bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-2 rounded">
              {overview.scoreFormula}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-2">
              Objective measurements are extracted directly from repository AST parse trees and dependency graphs.
              Subjective heuristic findings carry lower penalty weights.
            </p>
          </div>
        )}

        {/* Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[var(--border-color)]">
          <div className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
            <div className="text-[11px] font-mono text-[var(--text-secondary)]">Critical Issues</div>
            <div className="text-xl font-bold text-red-500 mt-1">
              {overview.findingsCount.critical}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
            <div className="text-[11px] font-mono text-[var(--text-secondary)]">Warnings</div>
            <div className="text-xl font-bold text-[#F3C969] mt-1">
              {overview.findingsCount.warning}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
            <div className="text-[11px] font-mono text-[var(--text-secondary)]">Info Suggestions</div>
            <div className="text-xl font-bold text-[#29D3C2] mt-1">
              {overview.findingsCount.info}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
            <div className="text-[11px] font-mono text-[var(--text-secondary)]">Total Findings</div>
            <div className="text-xl font-bold text-[var(--text-primary)] mt-1">
              {overview.findingsCount.total}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Complexity Hotspots & Circular Dependencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hotspots */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Complexity Hotspots ({overview.hotspots.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              AST Cyclomatic &gt; 8
            </span>
          </div>

          <div className="space-y-3">
            {overview.hotspots.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] italic">
                No high-complexity hotspots detected in parsed source files.
              </p>
            ) : (
              overview.hotspots
                .slice(0, expandedHotspots ? undefined : 3)
                .map((h, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectHotspot?.(h.filePath, h.symbolName, h.lineRange)}
                    className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] hover:border-[#29D3C2]/50 cursor-pointer transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-mono text-xs font-bold text-[var(--text-primary)] truncate">
                        {h.symbolName || "Module Top-Level"}
                      </div>
                      <Badge variant={h.complexityScore >= 12 ? "coral" : "sun"}>
                        Complexity {h.complexityScore}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-secondary)]">
                      <span>{h.filePath}:{h.lineRange.start}-{h.lineRange.end}</span>
                      <span>·</span>
                      <span>{h.lineCount} lines</span>
                      <span>·</span>
                      <span>Nesting depth {h.nestingDepth}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {h.rationale}
                    </p>
                  </div>
                ))
            )}

            {overview.hotspots.length > 3 && (
              <button
                type="button"
                onClick={() => setExpandedHotspots(!expandedHotspots)}
                className="w-full py-1.5 text-xs text-center text-[#29D3C2] hover:underline font-medium"
              >
                {expandedHotspots ? "Show Fewer Hotspots" : `Show All ${overview.hotspots.length} Hotspots`}
              </button>
            )}
          </div>
        </div>

        {/* Circular Dependencies */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Circular Dependencies ({overview.circularDependencies.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              AST Graph DFS
            </span>
          </div>

          <div className="space-y-3">
            {overview.circularDependencies.length === 0 ? (
              <div className="p-4 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                No circular import/call cycles detected. Module dependency graph is acyclic.
              </div>
            ) : (
              overview.circularDependencies.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-lg bg-[var(--bg-card-hover)] border border-red-500/20 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {c.description}
                    </span>
                    <Badge variant="coral">{c.severity}</Badge>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px] bg-[var(--bg-card)] p-2 rounded border border-[var(--border-color)]">
                    {c.cycle.map((node, idx) => (
                      <React.Fragment key={idx}>
                        <span className="text-[#29D3C2] font-semibold">{node.split("/").pop()}</span>
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
      </div>

      {/* Module Coupling & Duplicate Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module Coupling */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[#29D3C2]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Module Coupling & Fan-Out
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              AST Call Edges
            </span>
          </div>

          <div className="space-y-2">
            {overview.couplingMetrics.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs"
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
            ))}
          </div>
        </div>

        {/* Duplicate Code Candidates */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[#F3C969]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Duplicate Code Candidates ({overview.duplicateCandidates.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              Token Sequence Match
            </span>
          </div>

          <div className="space-y-3">
            {overview.duplicateCandidates.length === 0 ? (
              <div className="p-4 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
                No significant duplicated blocks (&gt; 5 identical consecutive lines) detected.
              </div>
            ) : (
              overview.duplicateCandidates.map((dup) => (
                <div
                  key={dup.id}
                  className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[var(--text-primary)]">
                      {dup.fileA.split("/").pop()} ↔ {dup.fileB.split("/").pop()}
                    </span>
                    <Badge variant="sun">
                      {dup.lineCount} Lines · {dup.similarityPercentage}% Match
                    </Badge>
                  </div>

                  <pre className="font-mono text-[11px] p-2 rounded bg-[var(--bg-card)] border border-[var(--border-color)] overflow-x-auto text-[var(--text-secondary)]">
                    {dup.duplicateSnippet}
                  </pre>

                  <p className="text-xs text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">Suggested Action: </span>
                    {dup.suggestedConsolidation}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
