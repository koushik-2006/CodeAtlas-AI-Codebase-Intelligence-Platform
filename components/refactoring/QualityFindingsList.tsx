"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Wrench,
  ExternalLink,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CodeQualityFinding,
  QualityFindingCategory,
  QualityFindingSeverity,
  RefactoringOperationType,
} from "@/types/refactoring";

interface QualityFindingsListProps {
  findings: CodeQualityFinding[];
  onProposeRefactoring: (finding: CodeQualityFinding) => void;
  onSelectFile?: (filePath: string, lineRange?: { start: number; end: number }) => void;
}

export default function QualityFindingsList({
  findings,
  onProposeRefactoring,
  onSelectFile,
}: QualityFindingsListProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [metricOnly, setMetricOnly] = useState<boolean>(false);

  const filteredFindings = findings.filter((f) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(q);
      const matchFile = f.filePath.toLowerCase().includes(q);
      const matchSymbol = f.symbolName?.toLowerCase().includes(q) || false;
      if (!matchTitle && !matchFile && !matchSymbol) return false;
    }

    if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
    if (severityFilter !== "all" && f.severity !== severityFilter) return false;
    if (metricOnly && !f.isVerifiedMetric) return false;

    return true;
  });

  const getSeverityBadge = (severity: QualityFindingSeverity) => {
    switch (severity) {
      case "critical":
        return <Badge variant="coral">Critical</Badge>;
      case "warning":
        return <Badge variant="sun">Warning</Badge>;
      case "info":
        return <Badge variant="cyan">Info</Badge>;
    }
  };

  const getCategoryColor = (cat: QualityFindingCategory) => {
    switch (cat) {
      case "excessive_complexity":
      case "deep_nesting":
        return "text-orange-500";
      case "circular_dependency":
      case "missing_error_handling":
        return "text-red-500";
      case "code_duplication":
      case "repeated_constants":
        return "text-[#F3C969]";
      default:
        return "text-[#29D3C2]";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search findings by symbol, filename, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#29D3C2]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg px-2.5 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[#29D3C2]"
          >
            <option value="all">All Categories</option>
            <option value="excessive_complexity">Excessive Complexity</option>
            <option value="deep_nesting">Deep Nesting</option>
            <option value="unclear_responsibilities">Unclear Responsibilities</option>
            <option value="repeated_constants">Repeated Constants</option>
            <option value="code_duplication">Code Duplication</option>
            <option value="excessive_coupling">Excessive Coupling</option>
            <option value="circular_dependency">Circular Dependency</option>
            <option value="missing_error_handling">Missing Error Handling</option>
            <option value="inconsistent_patterns">Inconsistent Patterns</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg px-2.5 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[#29D3C2]"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <button
            type="button"
            onClick={() => setMetricOnly(!metricOnly)}
            className={`text-xs px-3 py-2 rounded-lg border font-mono transition-colors ${
              metricOnly
                ? "bg-[#29D3C2]/15 text-[#29D3C2] border-[#29D3C2]/40"
                : "bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]"
            }`}
          >
            Verified Metric Only
          </button>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-10 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-[#2FD6A0] mx-auto" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              No Quality Findings Match Filters
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Try adjusting your search criteria, category selection, or severity filters.
            </p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-3 hover:border-[#29D3C2]/40 transition-colors"
            >
              {/* Finding Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold ${getCategoryColor(finding.category)}`}>
                    {finding.categoryLabel}
                  </span>
                  <span className="text-[var(--text-secondary)] text-xs">·</span>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {finding.title}
                  </h4>
                  {getSeverityBadge(finding.severity)}
                  {finding.isVerifiedMetric ? (
                    <Badge variant="mint">Verified Metric (AST)</Badge>
                  ) : (
                    <Badge variant="brand">Pattern Heuristic</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onProposeRefactoring(finding)}
                    className="gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Propose Refactoring
                  </Button>
                </div>
              </div>

              {/* Source Reference & Metric Threshold */}
              <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-secondary)] flex-wrap">
                <button
                  type="button"
                  onClick={() => onSelectFile?.(finding.filePath, finding.lineRange)}
                  className="hover:text-[#29D3C2] flex items-center gap-1 font-semibold text-[var(--text-primary)]"
                >
                  <span>{finding.filePath}</span>
                  {finding.lineRange && (
                    <span className="text-[#29D3C2]">
                      :{finding.lineRange.start}-{finding.lineRange.end}
                    </span>
                  )}
                  {finding.symbolName && (
                    <span className="text-[var(--text-secondary)]">
                      ({finding.symbolName})
                    </span>
                  )}
                </button>

                {finding.metricValue && (
                  <span className="bg-[var(--bg-card-hover)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                    Measurement: <strong className="text-[var(--text-primary)]">{finding.metricValue}</strong>
                    {finding.threshold && ` (Threshold: ${finding.threshold})`}
                  </span>
                )}
              </div>

              {/* Supporting Evidence */}
              {finding.supportingEvidence.length > 0 && (
                <div className="bg-[var(--bg-card-hover)]/60 rounded-lg p-3 text-xs space-y-1">
                  <div className="font-semibold text-[var(--text-primary)] font-mono text-[11px]">
                    Supporting Evidence:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[var(--text-secondary)]">
                    {finding.supportingEvidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rationale and Suggested Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Why It Matters: </span>
                  <span className="text-[var(--text-secondary)]">{finding.impactRationale}</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--text-primary)]">Recommended Next Action: </span>
                  <span className="text-[var(--text-secondary)]">{finding.suggestedAction}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
