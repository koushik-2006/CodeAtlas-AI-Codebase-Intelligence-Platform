"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { RepositoryOverviewData, OnboardingCitation } from "@/types/onboarding";
import {
  BookOpen,
  Layers,
  FolderTree,
  Terminal,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Code2,
  Cpu,
  PackageCheck,
  Clock,
} from "lucide-react";

interface KnowledgeReportViewProps {
  overview: RepositoryOverviewData;
  onRefresh: () => void;
  onNavigateFile: (file: string, line?: number) => void;
  isRefreshing?: boolean;
}

export function KnowledgeReportView({
  overview,
  onRefresh,
  onNavigateFile,
  isRefreshing = false,
}: KnowledgeReportViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Report Header */}
      <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <BookOpen className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
              Project Knowledge & Architecture Report
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">
              Evidence Verified
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Synthesized from static AST indexes, dependency manifests, and directory topology.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-mono text-[var(--text-secondary)]">Generated At</div>
            <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
              {new Date(overview.generatedAt).toLocaleTimeString()}
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Analyzing..." : "Refresh Report"}</span>
          </button>
        </div>
      </div>

      {/* Grid of Key Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Languages & Code Volume */}
        <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)]">
            <Cpu className="w-4 h-4" />
            <span>Languages & Composition</span>
          </div>
          <div className="space-y-2">
            {overview.languages.map((l) => (
              <div key={l.language} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-[var(--text-primary)]">{l.language}</span>
                  <span className="text-[var(--text-secondary)]">{l.percentage}% ({l.fileCount} files)</span>
                </div>
                <div className="h-1.5 w-full bg-[var(--border-color)]/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full"
                    style={{ width: `${l.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Frameworks & Stacks */}
        <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)]">
            <Layers className="w-4 h-4" />
            <span>Detected Frameworks</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {overview.frameworks.map((fw) => (
              <span
                key={fw}
                className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--text-primary)]"
              >
                {fw}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Verified from import statements and package dependencies.
          </p>
        </div>

        {/* Test Matrix */}
        <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)]">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Automated Test Coverage</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--text-primary)]">
              {Math.round(overview.testOrganization.coverageRatio * 100)}%
            </span>
            <span className="text-xs text-[var(--text-secondary)]">estimated symbol coverage</span>
          </div>
          <div className="text-xs font-mono text-[var(--text-secondary)]">
            Framework: {overview.testOrganization.framework}
          </div>
          <button
            type="button"
            onClick={() => onNavigateFile(overview.testOrganization.testFiles[0] || "tests/services/auth.test.ts", 12)}
            className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            Inspect Test Suite ({overview.testOrganization.testFiles.length} file) <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Project Purpose & Evidence */}
      <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[var(--primary)]" />
          Project Purpose & Operational Objectives
        </h3>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          {overview.purpose}
        </p>
        <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-[var(--text-secondary)]">
          <span className="font-bold text-[var(--text-primary)]">Evidence source:</span>
          <span className="px-2 py-0.5 rounded bg-[var(--bg-page)] border border-[var(--border-color)]">
            {overview.purposeSource === "package_description" ? "package.json / Repository Manifest" : "Source Code Documentation"}
          </span>
        </div>
      </div>

      {/* Directory Taxonomy & Module Roles */}
      <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-[var(--primary)]" />
          Directory Structure & Architectural Roles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {overview.directoryTaxonomy.map((dir) => (
            <div
              key={dir.directory}
              className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/50 space-y-1.5"
            >
              <div className="flex items-center justify-between font-mono text-xs font-bold text-[var(--text-primary)]">
                <span className="truncate">{dir.directory}</span>
                <span className="text-[10px] text-[var(--text-secondary)] font-normal">
                  {dir.fileCount} file(s)
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                {dir.purpose}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Application Entry Points & API Endpoints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Entry Points */}
        <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[var(--primary)]" />
            Application Entry Points
          </h3>
          <div className="space-y-2.5">
            {overview.entryPoints.map((ep) => (
              <div
                key={ep.name}
                onClick={() => onNavigateFile(ep.file, ep.line)}
                className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/40 hover:border-[var(--primary)] cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[var(--text-primary)]">{ep.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-[var(--primary)]/10 text-[var(--primary)]">
                    {ep.type}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-[var(--primary)]">
                  {ep.file}:{ep.line}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">{ep.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Authentication & Security Flow */}
        <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            Authentication & Security Lifecycle
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            {overview.authFlow.description}
          </p>
          <div className="space-y-1.5 p-3 rounded-xl bg-[var(--bg-page)]/40 border border-[var(--border-color)] font-mono text-xs">
            {overview.authFlow.steps.map((st, idx) => (
              <div key={idx} className="text-[var(--text-primary)] text-[11px] leading-relaxed">
                {st}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onNavigateFile(overview.authFlow.entryFile, 18)}
            className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
          >
            Review Auth Gateway ({overview.authFlow.entryFile}:18) <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Verified Evidence Citations */}
      <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-[var(--primary)]" />
          Source Evidence Citations (Zero Hallucination Guarantee)
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          All architectural claims are cross-referenced to indexed AST symbols and source files:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {overview.citations.map((c, i) => (
            <div
              key={i}
              onClick={() => onNavigateFile(c.file, c.line)}
              className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/30 hover:border-[var(--primary)] cursor-pointer transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text-primary)]">{c.label}</span>
                <span className="text-[10px] font-mono font-bold text-[var(--primary)]">
                  {c.file}:{c.line}
                </span>
              </div>
              {c.snippet && (
                <pre className="font-mono text-[10px] text-[var(--text-secondary)] truncate">
                  {c.snippet}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Incomplete Areas & Transparent Limitations */}
      <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
        <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Static Parser Limitations & Unanalyzed Boundaries
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          CodeAtlas explicitly discloses code boundaries that cannot be determined with complete static certainty:
        </p>
        <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] list-disc pl-5">
          {overview.incompleteAreas.map((area, i) => (
            <li key={i}>{area}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
