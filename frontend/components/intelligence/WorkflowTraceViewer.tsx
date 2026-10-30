"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { WorkflowTraceData, AvailableWorkflowEntryPoint, WorkflowStep } from "@/types/workflow-trace";
import {
  GitFork,
  ArrowDown,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  ExternalLink,
  Code2,
  Sparkles,
} from "lucide-react";

interface WorkflowTraceViewerProps {
  trace: WorkflowTraceData;
  availableEntryPoints: AvailableWorkflowEntryPoint[];
  selectedEntryPoint: string;
  onSelectEntryPoint: (entryPoint: string) => void;
  onNavigateFile: (file: string, line: number) => void;
  isLoading?: boolean;
}

export function WorkflowTraceViewer({
  trace,
  availableEntryPoints,
  selectedEntryPoint,
  onSelectEntryPoint,
  onNavigateFile,
  isLoading = false,
}: WorkflowTraceViewerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getStepTypeBadge = (type: string) => {
    switch (type) {
      case "ui_event":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">UI Event</span>;
      case "service":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">Core Service</span>;
      case "validation":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">Validation Guard</span>;
      case "test":
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-purple-500/10 text-purple-500 border border-purple-500/20">Test Assertion</span>;
      default:
        return <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[var(--border-color)] text-[var(--text-secondary)]">Function</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header & Entry Point Selector */}
      <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <GitFork className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
                Architectural Workflow Trace Explorer
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Follow static cross-file invocation paths from entry points through services to test assertions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-[var(--text-secondary)] shrink-0">Entry Point:</label>
            <select
              value={selectedEntryPoint}
              onChange={(e) => onSelectEntryPoint(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            >
              {availableEntryPoints.map((ep) => (
                <option key={ep.id} value={ep.name}>
                  {ep.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Verification Summary */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono border-t border-[var(--border-color)]/60 text-[var(--text-secondary)]">
          <div>
            <span className="text-[var(--text-primary)] font-bold">Total Steps: </span>
            {trace.totalSteps}
          </div>
          <div>
            <span className="text-[var(--text-primary)] font-bold">Verified Edge Ratio: </span>
            <span className="text-green-500 font-bold">{Math.round(trace.verifiedRatio * 100)}% AST Proven</span>
          </div>
          <div>
            <span className="text-[var(--text-primary)] font-bold">Target File: </span>
            {trace.entryPoint.file}
          </div>
        </div>
      </div>

      {/* Visual Workflow Steps Chain */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-[var(--primary)] before:via-cyan-500 before:to-purple-500">
        {trace.steps.map((step, idx) => (
          <div key={step.entityId} className="relative group">
            {/* Step Marker Node */}
            <div className="absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--primary)] text-[10px] font-mono font-extrabold flex items-center justify-center text-[var(--primary)] shadow-sm">
              {step.stepNumber}
            </div>

            {/* Step Card */}
            <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--primary)] transition-all shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm font-extrabold text-[var(--text-primary)]">
                    {step.name}
                  </span>
                  {getStepTypeBadge(step.type)}
                  {step.relationshipToPrev && idx > 0 && (
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--bg-page)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                      {step.relationshipToPrev}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateFile(step.file, step.line)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline shrink-0"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{step.file}:{step.line}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {step.notes}
              </p>

              {/* Code Snippet Box */}
              {step.codeSnippet && (
                <div className="relative rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-page)]/80">
                  <div className="px-3 py-1.5 border-b border-[var(--border-color)]/60 text-[10px] font-mono text-[var(--text-secondary)] flex justify-between">
                    <span>{step.file}</span>
                    <span>Lines {step.line}–{step.endLine || step.line + 4}</span>
                  </div>
                  <pre className="p-3 font-mono text-xs overflow-x-auto text-[var(--text-primary)] leading-snug">
                    {step.codeSnippet}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Disclosures & Limitations Alert */}
      <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-2">
        <h4 className="text-xs font-bold text-amber-500 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Static Analysis & Boundary Disclosures
        </h4>
        <ul className="text-xs text-[var(--text-secondary)] space-y-1 list-disc pl-5">
          {trace.limitations.map((lim, i) => (
            <li key={i}>{lim}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
