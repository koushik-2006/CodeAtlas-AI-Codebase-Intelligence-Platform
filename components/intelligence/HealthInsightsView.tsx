"use client";

import { useTheme } from "@/hooks/useTheme";
import { RepositoryHealthScore, HealthInsight } from "@/types/health-insights";
import {
  Activity,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  GitBranch,
  Layers,
  TestTube2,
  FileCode,
} from "lucide-react";

interface HealthInsightsViewProps {
  healthScore: RepositoryHealthScore;
  onDismissInsight: (insightId: string) => void;
  onNavigateFile: (file: string, line?: number) => void;
}

export function HealthInsightsView({
  healthScore,
  onDismissInsight,
  onNavigateFile,
}: HealthInsightsViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20">High Risk</span>;
      case "medium":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">Medium Impact</span>;
      case "low":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">Maintainability</span>;
      default:
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-purple-500/10 text-purple-500 border border-purple-500/20">Info</span>;
    }
  };

  const activeInsights = healthScore.insights.filter((i) => !i.isDismissed);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Overview Metric Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Health Score */}
        <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-green-500" />
              Overall Architecture Health
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[var(--text-primary)]">
              {healthScore.overallScore}
            </span>
            <span className="text-xs font-mono text-[var(--text-secondary)]">/ 100</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Static stability score based on coupling, test linkage, and cycle freedom.
          </p>
        </div>

        {/* Modularity Score */}
        <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[var(--primary)]" />
              Modularity & Separation
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[var(--text-primary)]">
              {healthScore.modularityScore}
            </span>
            <span className="text-xs font-mono text-[var(--text-secondary)]">/ 100</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Evaluates module boundaries, clean DAG dependencies, and export scopes.
          </p>
        </div>

        {/* Test Coverage Linkage */}
        <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <TestTube2 className="w-4 h-4 text-purple-500" />
              Verified Test Linkage
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[var(--text-primary)]">
              {Math.round(healthScore.testCoverageRatio * 100)}%
            </span>
            <span className="text-xs font-mono text-[var(--text-secondary)]">of core symbols tested</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Direct test relationships mapped from test suites to exported functions.
          </p>
        </div>
      </div>

      {/* Structural Insights List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Detected Architectural Insights ({activeInsights.length} Active)
          </h3>
          <span className="text-xs text-[var(--text-secondary)] font-mono">
            {healthScore.insights.length - activeInsights.length} Dismissed
          </span>
        </div>

        {activeInsights.length > 0 ? (
          <div className="space-y-3.5">
            {activeInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--primary)] transition-all shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {insight.title}
                    </span>
                    {getSeverityBadge(insight.severity)}
                    {insight.isHeuristic ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[var(--border-color)] text-[var(--text-secondary)]">
                        Heuristic Suggestion
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">
                        Measured Fact
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onDismissInsight(insight.id)}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors self-end sm:self-auto"
                    title="Dismiss insight"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </button>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {insight.description}
                </p>

                {/* Evidence & Metric Callout */}
                <div className="p-3 rounded-xl bg-[var(--bg-page)]/50 border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[var(--text-secondary)]">{insight.evidence.metricLabel}: </span>
                    <strong className="text-[var(--primary)]">{insight.evidence.metricValue}</strong>
                    <span className="text-[var(--text-secondary)] ml-2">({insight.evidence.detail})</span>
                  </div>

                  {insight.evidence.file !== "repository" && (
                    <button
                      type="button"
                      onClick={() => onNavigateFile(insight.evidence.file, insight.evidence.line)}
                      className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>{insight.evidence.file}{insight.evidence.line ? `:${insight.evidence.line}` : ""}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="text-xs text-[var(--text-primary)] flex items-center gap-1.5 pt-1">
                  <span className="font-bold text-[var(--primary)]">Action:</span>
                  <span>{insight.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              All Architectural Insights Resolved
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              No active coupling, test gap, or complexity warnings detected in the current repository index.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
