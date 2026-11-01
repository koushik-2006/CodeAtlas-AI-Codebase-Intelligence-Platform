"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  FileCode,
  Globe,
  FolderGit2,
  TestTube2,
  AlertTriangle,
  Download,
  Share2,
  Check,
  Printer,
  Sparkles,
  GitPullRequest,
  Network,
  MessageSquare,
} from "lucide-react";
import { ChangeImpactResult, ImpactSeverity } from "@/types/impact";
import { Button } from "@/components/ui/Button";
import { impactService } from "@/services/impact-service";

interface ImpactSummaryBarProps {
  result: ChangeImpactResult;
  onCreatePrChecklist: () => void;
  className?: string;
}

export function ImpactSummaryBar({
  result,
  onCreatePrChecklist,
  className = "",
}: ImpactSummaryBarProps) {
  const [copiedShare, setCopiedShare] = useState(false);
  const [prChecklistCreated, setPrChecklistCreated] = useState(false);

  const counts = result.summaryCounts || {
    filesCount: result.affectedItems?.length || 1,
    symbolsCount: 3,
    endpointsCount: result.affectedEndpoints.length,
    reposCount: 1,
    testsCount: result.testsToRerun.length,
    gapsCount: result.coverageGaps?.length || 0,
    directCount: 1,
    indirectCount: 1,
  };

  const getSeverityStyle = (severity: ImpactSeverity) => {
    switch (severity) {
      case "Critical":
        return {
          bg: "bg-rose-500/15 border-rose-500/30 text-rose-400",
          ring: "text-rose-500",
          badge: "bg-rose-500 text-white",
        };
      case "High":
        return {
          bg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
          ring: "text-amber-500",
          badge: "bg-amber-500 text-white",
        };
      case "Medium":
        return {
          bg: "bg-blue-500/15 border-blue-500/30 text-blue-400",
          ring: "text-blue-500",
          badge: "bg-blue-500 text-white",
        };
      default:
        return {
          bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
          ring: "text-emerald-500",
          badge: "bg-emerald-500 text-white",
        };
    }
  };

  const styles = getSeverityStyle(result.riskLevel);

  const handleExportMarkdown = () => {
    const md = impactService.exportMarkdown(result);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CodeAtlas_Impact_${result.repositoryId}_${result.file.replace(/[^a-zA-Z0-9]/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleCreateChecklist = () => {
    onCreatePrChecklist();
    setPrChecklistCreated(true);
    setTimeout(() => setPrChecklistCreated(false), 3000);
  };

  const assistantQuestion = `What is the blast radius and architectural risk of modifying ${result.file}${result.symbol ? `:${result.symbol}` : ""} in ${result.repositoryName || result.repositoryId}?`;

  return (
    <div
      className={`bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 ${className}`}
    >
      {/* Top: Risk Badge + Metric Counts */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Risk Badge with Score */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border font-mono font-black ${styles.bg}`}
          >
            <span className="text-lg leading-none font-black">{result.riskScore}</span>
            <span className="text-[9px] uppercase tracking-wider opacity-80 mt-0.5">Score</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${styles.badge}`}>
                {result.riskLevel} Risk
              </span>
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                {result.changeType?.replace("_", " ") || "Behavior change"}
              </span>
            </div>
            <h2 className="text-base font-bold text-[var(--text-primary)] mt-1">
              Blast Radius: {result.file}
              {result.symbol && <span className="text-[#7C5CFC]">:{result.symbol}</span>}
            </h2>
          </div>
        </div>

        {/* Metric Counts Grid */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-center min-w-[70px]">
            <span className="block text-base font-black text-[var(--text-primary)]">
              {counts.filesCount}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Files</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-center min-w-[70px]">
            <span className="block text-base font-black text-cyan-400">
              {counts.endpointsCount}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">APIs</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-center min-w-[70px]">
            <span className="block text-base font-black text-[#7C5CFC]">
              {counts.reposCount}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Repos</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-center min-w-[70px]">
            <span className="block text-base font-black text-emerald-400">
              {counts.testsCount}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Tests</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-center min-w-[70px]">
            <span className={`block text-base font-black ${counts.gapsCount > 0 ? "text-rose-400" : "text-[var(--text-primary)]"}`}>
              {counts.gapsCount}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Gaps</span>
          </div>
        </div>
      </div>

      {/* Bottom: Action Buttons */}
      <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/architecture?repo=${result.repositoryId}&level=files&node=file-${result.file.replace(/[^a-zA-Z0-9]/g, "-")}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/30 hover:bg-[#7C5CFC]/25 transition-colors"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Show on Architecture Graph</span>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateChecklist}
            className="text-xs gap-1.5 h-8 text-[var(--text-primary)]"
          >
            {prChecklistCreated ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <GitPullRequest className="w-3.5 h-3.5 text-[#7C5CFC]" />
            )}
            <span>{prChecklistCreated ? "Checklist Added to PR!" : "Create PR Checklist"}</span>
          </Button>

          <Link
            href={`/assistant?q=${encodeURIComponent(assistantQuestion)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#7C5CFC] hover:text-[#7C5CFC] transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ask Assistant About Change</span>
          </Link>
        </div>

        {/* Right Actions: Export */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintPdf}
            className="text-xs gap-1.5 h-8"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMarkdown}
            className="text-xs gap-1.5 h-8 text-[#7C5CFC]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

