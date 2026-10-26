"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { ReviewSession } from "@/types/review";
import {
  ShieldAlert,
  TestTube2,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface ReviewImpactSidebarProps {
  session: ReviewSession;
  repositoryId: string;
  isAnalyzing: boolean;
  onReRunReview: () => void;
  isSecurityReviewOnly: boolean;
  onToggleSecurityReview: () => void;
}

export function ReviewImpactSidebar({
  session,
  repositoryId,
  isAnalyzing,
  onReRunReview,
  isSecurityReviewOnly,
  onToggleSecurityReview,
}: ReviewImpactSidebarProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const criticalFindings = session.findings.filter((f) => f.severity === "critical");
  const testGaps = session.relatedTests.filter((t) => t.coverageStatus === "untested");

  return (
    <aside className="space-y-4">
      {/* Review Actions Card */}
      <div
        className={`app-card p-4 rounded-2xl border transition-all ${
          isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            AI Review Controls
          </span>
          <span className="text-[10px] font-mono text-[var(--text-secondary)]">
            PR #{session.pullRequestNumber}
          </span>
        </div>

        {/* Executive Summary */}
        <div className="my-3">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
            {session.summary}
          </p>
        </div>

        {/* Security Review Mode Toggle */}
        <div className="pt-2 border-t border-[var(--border-color)] space-y-2">
          <label className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] cursor-pointer text-xs">
            <span className="font-bold text-[var(--text-primary)]">Security Focus Mode</span>
            <input
              type="checkbox"
              checked={isSecurityReviewOnly}
              onChange={onToggleSecurityReview}
              className="rounded accent-[var(--primary)] cursor-pointer"
            />
          </label>

          <button
            type="button"
            onClick={onReRunReview}
            disabled={isAnalyzing}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              isDark
                ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                : "bg-[#6C4DFF] text-white hover:bg-[#5b3ee0]"
            } disabled:opacity-50`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
            <span>{isAnalyzing ? "Analyzing Pull Request..." : "Re-Run AI Review"}</span>
          </button>
        </div>
      </div>

      {/* Potentially Affected Architecture Components */}
      <div
        className={`app-card p-4 rounded-2xl border transition-all ${
          isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)] mb-3">
          <span className="font-mono text-xs font-bold uppercase text-[var(--text-primary)] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
            Affected Blast Radius ({session.affectedComponents.length})
          </span>
          <Link
            href={`/architecture?repo=${repositoryId}`}
            className="text-[10px] font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
          >
            View Graph &rarr;
          </Link>
        </div>

        {session.affectedComponents.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] italic">
            No external upstream callers affected by this diff.
          </p>
        ) : (
          <div className="space-y-2">
            {session.affectedComponents.slice(0, 5).map((comp, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-[var(--text-primary)] truncate max-w-[170px]">
                    {comp.name}
                  </span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--border-color)]/60 text-[var(--text-secondary)] font-bold">
                    {comp.type}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                  {comp.reason}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Tests & Test Gap Alert */}
      <div
        className={`app-card p-4 rounded-2xl border transition-all ${
          isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)] mb-3">
          <span className="font-mono text-xs font-bold uppercase text-[var(--text-primary)] flex items-center gap-1.5">
            <TestTube2 className="w-3.5 h-3.5 text-teal-500" />
            Test Suite Impact ({session.relatedTests.length})
          </span>
        </div>

        {testGaps.length > 0 && (
          <div className="p-2.5 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-600 dark:text-amber-400 block font-bold">
                {testGaps.length} Test Gap(s) Detected
              </strong>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Modified functions have no associated unit test coverage in the index.
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {session.relatedTests.map((t, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] flex items-center justify-between text-xs"
            >
              <div className="truncate min-w-0 pr-2">
                <span className="font-mono font-bold text-[var(--text-primary)] block truncate">
                  {t.name}
                </span>
                <span className="font-mono text-[10px] text-[var(--text-secondary)] block truncate">
                  {t.file}
                </span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                  t.coverageStatus === "untested"
                    ? "bg-amber-500/10 text-amber-500"
                    : t.status === "needs-update"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-teal-500/10 text-teal-500"
                }`}
              >
                {t.coverageStatus === "untested"
                  ? "Untested"
                  : t.status === "needs-update"
                  ? "Needs Update"
                  : "Passing"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
