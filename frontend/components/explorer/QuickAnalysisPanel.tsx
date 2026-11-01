"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  CodeMetricSummary,
  analyzeSnippetOffline,
} from "@/lib/demo/explorer-engine";
import {
  Cpu,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  GitBranch,
} from "lucide-react";

interface QuickAnalysisPanelProps {
  code: string;
  language: string;
  onSelectLine?: (line: number) => void;
  onOpenFlowchart?: () => void;
}

export function QuickAnalysisPanel({
  code,
  language,
  onSelectLine,
  onOpenFlowchart,
}: QuickAnalysisPanelProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const metrics: CodeMetricSummary = analyzeSnippetOffline(code, language);

  const gradeColors: Record<string, string> = {
    A: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    B: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    C: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    D: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    F: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-white border-[#E8E5F4]"
      }`}
    >
      {/* Header bar */}
      <div
        className="p-3.5 flex items-center justify-between cursor-pointer border-b border-[var(--border-color)] bg-[var(--bg-page)]/40 select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">
            Client-Side Quick Analysis
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
            Offline Safe
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            Grade:
          </span>
          <span
            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
              gradeColors[metrics.complexityGrade] || gradeColors.B
            }`}
          >
            {metrics.complexityGrade} (CC: {metrics.cyclomaticComplexity})
          </span>
          <button
            type="button"
            aria-label="Toggle Quick Analysis"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 text-xs">
          {/* Key Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] block">
                Total / Code
              </span>
              <span className="text-sm font-extrabold text-[var(--text-primary)]">
                {metrics.totalLines}{" "}
                <span className="text-[11px] font-normal text-[var(--text-secondary)]">
                  / {metrics.codeLines} LOC
                </span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] block">
                Blank / Comment
              </span>
              <span className="text-sm font-extrabold text-[var(--text-primary)]">
                {metrics.blankLines}{" "}
                <span className="text-[11px] font-normal text-[var(--text-secondary)]">
                  / {metrics.commentLines}
                </span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] block">
                Functions / Classes
              </span>
              <span className="text-sm font-extrabold text-[var(--text-primary)]">
                {metrics.functions.length}{" "}
                <span className="text-[11px] font-normal text-[var(--text-secondary)]">
                  / {metrics.classes.length}
                </span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
              <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] block">
                Language (Detect)
              </span>
              <span className="text-sm font-extrabold text-[var(--primary)] capitalize truncate block">
                {metrics.language}{" "}
                <span className="text-[10px] font-normal text-[var(--text-secondary)]">
                  ({Math.round(metrics.confidence * 100)}%)
                </span>
              </span>
            </div>
          </div>

          {/* Warnings & Alerts: Long functions / TODOs */}
          {(metrics.longFunctions.length > 0 || metrics.todos.length > 0) && (
            <div className="space-y-2">
              {metrics.longFunctions.map((lf, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[11px]">
                      High Function Length Alert: `{lf.name}` ({lf.lines} lines)
                    </span>
                    <p className="text-[10px] opacity-90">
                      Functions longer than 30 lines often introduce cognitive overhead. Consider modular decomposition.
                    </p>
                  </div>
                </div>
              ))}

              {metrics.todos.map((td, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono text-[11px] truncate">
                      Line {td.line}: {td.text}
                    </span>
                  </div>
                  {onSelectLine && (
                    <button
                      type="button"
                      onClick={() => onSelectLine(td.line)}
                      className="text-[10px] font-mono underline hover:text-white shrink-0"
                    >
                      Jump to line
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Symbols breakdown & Quick links */}
          {metrics.functions.length > 0 && (
            <div>
              <span className="text-[11px] font-mono uppercase font-bold text-[var(--text-secondary)] mb-1.5 block">
                Declared Functions & Callables:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {metrics.functions.map((fn, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectLine?.(fn.line)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
                  >
                    <FileCode className="w-3 h-3 text-[var(--primary)]" />
                    <span>{fn.name}()</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      :L{fn.line}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Flowchart action */}
          {onOpenFlowchart && (
            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)]">
                Offline control flow graph ready
              </span>
              <button
                type="button"
                onClick={onOpenFlowchart}
                className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>View Control Flow</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
