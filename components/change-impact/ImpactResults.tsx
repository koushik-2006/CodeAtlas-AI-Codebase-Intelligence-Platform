"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import {
  ShieldAlert,
  Globe,
  TestTube2,
  ExternalLink,
  Layers,
  ArrowRight,
  Network,
  AlertTriangle,
  Info,
  CheckCircle2,
  Component,
  Database,
  FileCode,
} from "lucide-react";
import { ChangeImpactResult, AffectedComponent } from "@/types/impact";

interface ImpactResultsProps {
  result: ChangeImpactResult;
  repositoryId?: string;
}

export function ImpactResults({ result, repositoryId = "sample-project" }: ImpactResultsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selectedAffectedId, setSelectedAffectedId] = useState<string | null>(null);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Metric Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Risk Card */}
        <div
          className={`app-card p-5 ${
            result.riskLevel === "High"
              ? isDark
                ? "bg-[#FF5A5F]/10 border-[#FF5A5F]/40"
                : "bg-[#FFE0E3] border-[#FF9A9C]"
              : isDark
              ? "bg-[#F3C969]/10 border-[#F3C969]/40"
              : "bg-[#FFF0BF] border-[#FFE08A]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
              IMPACT SEVERITY
            </span>
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black">{result.riskLevel} Risk</span>
            <span className="font-mono text-xs text-[var(--text-secondary)] font-bold">
              Score {result.riskScore}/100
            </span>
          </div>
        </div>

        {/* Affected Endpoints */}
        <div
          className={`app-card p-5 ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
            AFFECTED APIS
          </span>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
            {result.affectedEndpoints.length} Routes
          </p>
        </div>

        {/* Affected Callers */}
        <div
          className={`app-card p-5 ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
            DIRECT CALLERS
          </span>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
            {result.directlyDependent.length} Components
          </p>
        </div>

        {/* Tests to Re-Run */}
        <div
          className={`app-card p-5 ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">
            TESTS TO RE-RUN
          </span>
          <p className="mt-3 text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
            {result.testsToRerun.length} Suites
          </p>
        </div>
      </div>

      {/* Visual Impact DAG */}
      <div
        className={`app-card p-6 border shadow-sm ${
          isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)] mb-4">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Visual Impact Propagation Graph
            </h3>
          </div>
          <Link
            href={`/architecture?repo=${repositoryId}`}
            className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
          >
            <span>Explore in Full Architecture Graph</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* SVG Propagation Visualizer */}
        <div className="p-4 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)] overflow-x-auto">
          <div className="min-w-[650px] flex items-center justify-between gap-4 py-2">
            {/* Box 1: Modified Target Symbol */}
            <div className="p-3.5 rounded-2xl border-2 border-red-500 bg-red-500/10 min-w-[170px] text-center">
              <span className="font-mono text-[9px] uppercase font-bold text-red-500 block">
                MODIFIED TARGET
              </span>
              <h4 className="font-bold text-xs mt-1 text-[var(--text-primary)] truncate">
                {result.symbol}
              </h4>
              <p className="font-mono text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                {result.file}
              </p>
            </div>

            <ArrowRight className="w-5 h-5 text-red-500 shrink-0" />

            {/* Box 2: Direct Callers */}
            <div className="space-y-2 flex-1 max-w-[200px]">
              <span className="font-mono text-[10px] uppercase font-bold text-[var(--text-secondary)] block text-center">
                DIRECT CALLERS
              </span>
              {result.directlyDependent.map((dep) => (
                <Link
                  key={dep.id}
                  href={`/repositories/${repositoryId}?file=${encodeURIComponent(dep.file)}&line=${dep.line || 1}`}
                  className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] block hover:border-[var(--primary)] transition-all text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)] truncate">{dep.name}</span>
                    <span className="text-[9px] font-mono font-bold text-red-500">{dep.severity}</span>
                  </div>
                  <p className="font-mono text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                    {dep.file}:{dep.line}
                  </p>
                </Link>
              ))}
            </div>

            <ArrowRight className="w-5 h-5 text-amber-500 shrink-0" />

            {/* Box 3: Downstream & Tests */}
            <div className="space-y-2 flex-1 max-w-[200px]">
              <span className="font-mono text-[10px] uppercase font-bold text-[var(--text-secondary)] block text-center">
                DOWNSTREAM & TESTS
              </span>
              {result.downstreamAffected.map((down) => (
                <div
                  key={down.id}
                  className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)] truncate">{down.name}</span>
                    <span className="text-[9px] font-mono font-bold text-amber-500">{down.severity}</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                    {down.relationship}
                  </p>
                </div>
              ))}
              {result.testsToRerun.map((t, idx) => (
                <Link
                  key={idx}
                  href={`/repositories/${repositoryId}?file=${encodeURIComponent(t.file)}&line=${t.line || 1}`}
                  className="p-2 rounded-xl border border-teal-500/30 bg-teal-500/5 block text-xs hover:border-teal-500 transition-colors"
                >
                  <span className="font-bold text-teal-600 dark:text-teal-400 block truncate">{t.name}</span>
                  <span className="font-mono text-[9px] text-[var(--text-secondary)]">{t.file}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categorized Impact Breakdown (All 5 Categories) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category 1 & 2: Directly Dependent Callers & Downstream */}
        <div
          className={`app-card p-6 space-y-5 ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          {/* 1. Directly Dependent Components */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)]">
                <Component className="w-4 h-4 text-[var(--primary)]" />
                Directly Dependent Callers
              </h4>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {result.directlyDependent.length} found
              </span>
            </div>

            <div className="space-y-2">
              {result.directlyDependent.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)]">{item.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(item.severity)}`}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                      {item.reason}
                    </p>
                  </div>

                  <Link
                    href={`/repositories/${repositoryId}?file=${encodeURIComponent(item.file)}&line=${item.line || 1}`}
                    className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--primary)] hover:underline shrink-0"
                  >
                    <span>{item.file}:{item.line}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Potentially Affected Downstream Components */}
          {result.downstreamAffected.length > 0 && (
            <div className="pt-4 border-t border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)]">
                  <Layers className="w-4 h-4 text-amber-500" />
                  Potentially Affected Downstream
                </h4>
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  {result.downstreamAffected.length} services
                </span>
              </div>

              <div className="space-y-2">
                {result.downstreamAffected.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-[var(--text-primary)]">{item.name}</span>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {item.reason}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-[var(--text-secondary)] shrink-0">
                      {item.relationship}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category 3, 4, 5: APIs, Tests, Review Required & Recommendation */}
        <div
          className={`app-card p-6 space-y-5 ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          {/* 3. Related APIs */}
          {result.affectedEndpoints.length > 0 && (
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)] mb-3">
                <Globe className="w-4 h-4 text-blue-500" />
                Related Network APIs
              </h4>
              <div className="space-y-2">
                {result.affectedEndpoints.map((ep, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold text-[10px]">
                        {ep.method}
                      </span>
                      <span className="font-bold text-[var(--text-primary)]">{ep.path}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                      {ep.file}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Related Tests to Re-Run */}
          <div className="pt-4 border-t border-[var(--border-color)]">
            <h4 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)] mb-3">
              <TestTube2 className="w-4 h-4 text-teal-500" />
              Related Tests to Re-Run
            </h4>
            <div className="space-y-2">
              {result.testsToRerun.map((t, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{t.name}</span>
                    <span className="font-mono text-[10px] text-[var(--text-secondary)] block">
                      {t.file}:{t.line}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      t.status === "needs-update"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-emerald-500/10 text-emerald-500"
                    }`}
                  >
                    {t.status === "needs-update" ? "Action Required" : "Passing"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Recommendation Callout & Limitations */}
          <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
            <div className="p-3.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)]">
              <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wide block mb-1">
                AI Engineering Recommendation
              </span>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {result.recommendation}
              </p>
            </div>

            {result.limitationsNote && (
              <div className="flex items-start gap-2 text-[11px] text-[var(--text-secondary)] p-2">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Coverage Scope:</strong> {result.limitationsNote}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
