"use client";

import React from "react";
import {
  X,
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Equal,
  FolderGit2,
  ShieldAlert,
  FileCode,
  Globe,
  TestTube2,
  AlertTriangle,
} from "lucide-react";
import { SavedImpactAnalysis, ImpactSeverity } from "@/types/impact";
import { Button } from "@/components/ui/Button";

interface ImpactComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisA: SavedImpactAnalysis | null;
  analysisB: SavedImpactAnalysis | null;
}

export function ImpactComparisonModal({
  isOpen,
  onClose,
  analysisA,
  analysisB,
}: ImpactComparisonModalProps) {
  if (!isOpen || !analysisA || !analysisB) return null;

  const scoreDiff = analysisB.riskScore - analysisA.riskScore;
  const filesDiff = (analysisB.summaryCounts?.filesCount || 0) - (analysisA.summaryCounts?.filesCount || 0);
  const endpointsDiff = (analysisB.summaryCounts?.endpointsCount || 0) - (analysisA.summaryCounts?.endpointsCount || 0);
  const testsDiff = (analysisB.summaryCounts?.testsCount || 0) - (analysisA.summaryCounts?.testsCount || 0);

  const getSeverityBadgeClass = (severity: ImpactSeverity) => {
    switch (severity) {
      case "Critical":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "High":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Medium":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 font-bold text-base text-[var(--text-primary)]">
            <GitCompare className="w-5 h-5 text-[#7C5CFC]" />
            <span>Side-by-Side Impact Analysis Comparison</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Risk Differential Summary Banner */}
          <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-[var(--text-secondary)] uppercase font-semibold">
                Risk Delta Assessment
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                {scoreDiff > 0 ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-rose-400" />
                    <span className="text-rose-400">Analysis B has +{scoreDiff} higher risk score</span>
                  </>
                ) : scoreDiff < 0 ? (
                  <>
                    <TrendingDown className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400">Analysis B has {Math.abs(scoreDiff)} lower risk score</span>
                  </>
                ) : (
                  <>
                    <Equal className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-400">Both analyses carry equivalent risk scores</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                Files Diff: <strong className={filesDiff > 0 ? "text-rose-400" : "text-emerald-400"}>{filesDiff > 0 ? `+${filesDiff}` : filesDiff}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                Endpoints Diff: <strong className={endpointsDiff > 0 ? "text-rose-400" : "text-emerald-400"}>{endpointsDiff > 0 ? `+${endpointsDiff}` : endpointsDiff}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                Tests Diff: <strong>{testsDiff > 0 ? `+${testsDiff}` : testsDiff}</strong>
              </div>
            </div>
          </div>

          {/* Two-Column Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column A */}
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div>
                  <span className="text-[10px] font-mono text-[#7C5CFC] uppercase font-bold tracking-wider">
                    Analysis A (Baseline)
                  </span>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] truncate mt-0.5">
                    {analysisA.title}
                  </h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getSeverityBadgeClass(analysisA.riskLevel)}`}>
                  {analysisA.riskLevel} ({analysisA.riskScore}/100)
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Repository:</span>
                  <strong className="text-[var(--text-primary)]">{analysisA.repositoryName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Target File:</span>
                  <strong className="text-[var(--text-primary)]">{analysisA.targetFile}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Target Symbol:</span>
                  <strong className="text-[var(--text-primary)]">{analysisA.targetSymbol || "All symbols"}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Change Type:</span>
                  <strong className="text-[var(--text-primary)]">{analysisA.changeType.replace("_", " ")}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Affected Files:</span>
                  <strong className="text-[var(--text-primary)]">{analysisA.summaryCounts?.filesCount || 0}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Affected Endpoints:</span>
                  <strong className="text-[var(--text-primary)]">{analysisA.summaryCounts?.endpointsCount || 0}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Tests to Rerun:</span>
                  <strong className="text-[var(--text-primary)]">{analysisA.summaryCounts?.testsCount || 0}</strong>
                </div>
              </div>
            </div>

            {/* Column B */}
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                <div>
                  <span className="text-[10px] font-mono text-[#7C5CFC] uppercase font-bold tracking-wider">
                    Analysis B (Comparison)
                  </span>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] truncate mt-0.5">
                    {analysisB.title}
                  </h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getSeverityBadgeClass(analysisB.riskLevel)}`}>
                  {analysisB.riskLevel} ({analysisB.riskScore}/100)
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Repository:</span>
                  <strong className="text-[var(--text-primary)]">{analysisB.repositoryName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Target File:</span>
                  <strong className="text-[var(--text-primary)]">{analysisB.targetFile}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Target Symbol:</span>
                  <strong className="text-[var(--text-primary)]">{analysisB.targetSymbol || "All symbols"}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Change Type:</span>
                  <strong className="text-[var(--text-primary)]">{analysisB.changeType.replace("_", " ")}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Affected Files:</span>
                  <strong className="text-[var(--text-primary)]">{analysisB.summaryCounts?.filesCount || 0}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Affected Endpoints:</span>
                  <strong className="text-[var(--text-primary)]">{analysisB.summaryCounts?.endpointsCount || 0}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-color)]/50">
                  <span className="text-[var(--text-secondary)]">Tests to Rerun:</span>
                  <strong className="text-[var(--text-primary)]">{analysisB.summaryCounts?.testsCount || 0}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Comparison
          </Button>
        </div>
      </div>
    </div>
  );
}

