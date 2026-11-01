"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Globe,
  Layers,
  Server,
  Database,
  TestTube2,
  ExternalLink,
  AlertTriangle,
  Copy,
  Check,
  FileCode,
  Sparkles,
} from "lucide-react";
import {
  AffectedItem,
  EndpointImpact,
  TestToRerun,
  CoverageGapItem,
  ImpactSeverity,
} from "@/types/impact";
import { Button } from "@/components/ui/Button";

interface ImpactGroupedListsProps {
  affectedItems: AffectedItem[];
  endpoints: EndpointImpact[];
  tests: TestToRerun[];
  gaps: CoverageGapItem[];
  onSelectNode?: (itemId: string) => void;
}

export function ImpactGroupedLists({
  affectedItems,
  endpoints,
  tests,
  gaps,
  onSelectNode,
}: ImpactGroupedListsProps) {
  const [openSections, setOpenSections] = useState({
    direct: true,
    indirect: true,
    endpoints: true,
    crossRepo: true,
    tests: true,
    gaps: true,
  });

  const [copiedTestCmd, setCopiedTestCmd] = useState(false);

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const directItems = affectedItems.filter((i) => i.hop === 1);
  const indirectItems = affectedItems.filter((i) => i.hop >= 2);
  const crossRepoItems = affectedItems.filter((i) => i.hop > 0 && i.type === "cross_repo");

  const combinedTestCommand = tests.map((t) => t.command || `npm test -- ${t.file}`).join(" && ");

  const handleCopyTestCmd = () => {
    if (navigator?.clipboard && combinedTestCommand) {
      navigator.clipboard.writeText(combinedTestCommand);
      setCopiedTestCmd(true);
      setTimeout(() => setCopiedTestCmd(false), 2000);
    }
  };

  const getSeverityBadge = (severity: ImpactSeverity) => {
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
    <div className="space-y-4">
      {/* 1. Direct Impact (Hop 1) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("direct")}
          className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
        >
          <div className="flex items-center gap-2">
            {openSections.direct ? <ChevronDown className="w-4 h-4 text-[#7C5CFC]" /> : <ChevronRight className="w-4 h-4" />}
            <span>Direct Impact (Hop 1 Callers)</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-[#7C5CFC]/15 text-[#7C5CFC]">
              {directItems.length}
            </span>
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-normal">Immediate consumers</span>
        </button>

        {openSections.direct && (
          <div className="p-4 pt-0 divide-y divide-[var(--border-color)]/50">
            {directItems.length === 0 ? (
              <p className="py-3 text-xs text-[var(--text-secondary)] italic">No direct hop 1 callers identified.</p>
            ) : (
              directItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectNode?.(item.id)}
                  className="py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-[var(--bg-card-hover)]/40 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                      <span>{item.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] text-[var(--text-secondary)]">
                        {item.type}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                      {item.repositoryName} • {item.filePath}:{item.line}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 2. Indirect Impact (Hop 2+) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("indirect")}
          className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
        >
          <div className="flex items-center gap-2">
            {openSections.indirect ? <ChevronDown className="w-4 h-4 text-[#7C5CFC]" /> : <ChevronRight className="w-4 h-4" />}
            <span>Indirect Impact (Hop 2+ Transitive)</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-[var(--bg-card-hover)] text-[var(--text-secondary)]">
              {indirectItems.length}
            </span>
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-normal">Downstream ripple effects</span>
        </button>

        {openSections.indirect && (
          <div className="p-4 pt-0 divide-y divide-[var(--border-color)]/50">
            {indirectItems.length === 0 ? (
              <p className="py-3 text-xs text-[var(--text-secondary)] italic">No transitive downstream callers.</p>
            ) : (
              indirectItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectNode?.(item.id)}
                  className="py-3 flex flex-wrap items-center justify-between gap-2 hover:bg-[var(--bg-card-hover)]/40 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                      <span>{item.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] text-[var(--text-secondary)]">
                        Hop {item.hop}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                      {item.repositoryName} • {item.filePath}:{item.line}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. API Endpoints */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("endpoints")}
          className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
        >
          <div className="flex items-center gap-2">
            {openSections.endpoints ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronRight className="w-4 h-4" />}
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Public API Endpoints</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-500/15 text-cyan-400">
              {endpoints.length}
            </span>
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-normal">HTTP routes touched</span>
        </button>

        {openSections.endpoints && (
          <div className="p-4 pt-0 divide-y divide-[var(--border-color)]/50">
            {endpoints.map((ep, idx) => (
              <div key={idx} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {ep.method}
                  </span>
                  <div>
                    <div className="font-bold font-mono text-xs text-[var(--text-primary)]">
                      {ep.path}
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                      {ep.repositoryName || ep.repositoryId} • {ep.file}:{ep.line}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                  Handler: {ep.handlerName || "routeHandler"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Tests to Run */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)]">
          <div
            onClick={() => toggleSection("tests")}
            className="flex items-center gap-2 cursor-pointer font-bold text-sm text-[var(--text-primary)]"
          >
            {openSections.tests ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4" />}
            <TestTube2 className="w-4 h-4 text-emerald-400" />
            <span>Automated Tests to Rerun</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-400">
              {tests.length}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTestCmd}
            className="text-xs gap-1.5 h-7 text-[#7C5CFC]"
          >
            {copiedTestCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedTestCmd ? "Copied Command!" : "Copy Test Command"}</span>
          </Button>
        </div>

        {openSections.tests && (
          <div className="p-4 divide-y divide-[var(--border-color)]/50">
            {tests.map((test, idx) => (
              <div key={idx} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-[var(--text-primary)] font-mono">
                    {test.name}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                    {test.file} • Line {test.line || 1}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {test.status || "needs-update"}
                  </span>
                  <code className="text-[10px] font-mono px-2 py-1 rounded bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                    {test.command || `npm test -- ${test.file}`}
                  </code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Missing Tests (Coverage Gaps) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection("gaps")}
          className="w-full p-4 flex items-center justify-between text-left font-bold text-sm text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
        >
          <div className="flex items-center gap-2">
            {openSections.gaps ? <ChevronDown className="w-4 h-4 text-rose-400" /> : <ChevronRight className="w-4 h-4" />}
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Missing Tests (Coverage Gaps)</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-rose-500/15 text-rose-400">
              {gaps.length}
            </span>
          </div>
          <span className="text-xs text-rose-400 font-semibold">Vulnerable paths</span>
        </button>

        {openSections.gaps && (
          <div className="p-4 pt-0 divide-y divide-[var(--border-color)]/50">
            {gaps.length === 0 ? (
              <p className="py-3 text-xs text-emerald-400 font-semibold">
                ✓ All affected code paths have registered unit test coverage.
              </p>
            ) : (
              gaps.map((gap) => (
                <div key={gap.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-[var(--text-primary)]">
                      {gap.name}
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                      {gap.repositoryName} • {gap.file}:{gap.line}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {gap.reason}
                    </p>
                  </div>

                  <Link
                    href={`/visual-code-explorer?repo=${gap.repositoryId}&file=${encodeURIComponent(gap.file)}&action=test`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/30 hover:bg-[#7C5CFC]/25 transition-colors shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Generate Tests</span>
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

