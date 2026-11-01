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
  Eye,
  EyeOff,
  RotateCcw,
  CheckSquare,
  Square,
  FileCode,
  Tag,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CodeQualityFinding,
  QualityFindingCategory,
  QualityFindingSeverity,
  FindingStatus,
} from "@/types/refactoring";

interface QualityFindingsListProps {
  findings: CodeQualityFinding[];
  onProposeRefactoring: (finding: CodeQualityFinding) => void;
  onIgnoreFinding?: (findingId: string, reason: string) => void;
  onRestoreFinding?: (findingId: string) => void;
  onBulkIgnore?: (findingIds: string[], reason: string) => void;
  onBulkPropose?: (findings: CodeQualityFinding[]) => void;
  onOpenFile?: (filePath: string, lineRange?: { start: number; end: number }) => void;
  initialFilterFile?: string;
}

export default function QualityFindingsList({
  findings,
  onProposeRefactoring,
  onIgnoreFinding,
  onRestoreFinding,
  onBulkIgnore,
  onBulkPropose,
  onOpenFile,
  initialFilterFile,
}: QualityFindingsListProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [fileFilter, setFileFilter] = useState<string>(initialFilterFile || "all");
  const [sortBy, setSortBy] = useState<"severity" | "effort" | "file" | "line">("severity");
  const [groupBy, setGroupBy] = useState<"none" | "file" | "category">("none");

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCodeIds, setExpandedCodeIds] = useState<Set<string>>(new Set());

  // Ignore prompt state
  const [ignoringFindingId, setIgnoringFindingId] = useState<string | null>(null);
  const [ignoreReasonInput, setIgnoreReasonInput] = useState<string>("False positive");
  const [isBulkIgnoring, setIsBulkIgnoring] = useState(false);

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    // Status filter
    const status = f.status || "open";
    if (statusFilter !== "all" && status !== statusFilter) return false;

    // Search query
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(q);
      const matchFile = f.filePath.toLowerCase().includes(q);
      const matchSymbol = f.symbolName?.toLowerCase().includes(q) || false;
      const matchRationale = f.impactRationale.toLowerCase().includes(q);
      if (!matchTitle && !matchFile && !matchSymbol && !matchRationale) return false;
    }

    // Category
    if (categoryFilter !== "all" && f.category !== categoryFilter) return false;

    // Severity (maps warning/high, info/medium, etc.)
    if (severityFilter !== "all") {
      const sev = f.severity.toLowerCase();
      if (severityFilter === "critical" && sev !== "critical") return false;
      if (severityFilter === "high" && sev !== "warning" && sev !== "high") return false;
      if (severityFilter === "medium" && sev !== "info" && sev !== "medium") return false;
      if (severityFilter === "low" && sev !== "low") return false;
    }

    // File
    if (fileFilter !== "all" && f.filePath !== fileFilter) return false;

    return true;
  });

  // Sort findings
  const sortedFindings = [...filteredFindings].sort((a, b) => {
    if (sortBy === "severity") {
      const rank = (s: string) => (s === "critical" ? 4 : s === "warning" || s === "high" ? 3 : s === "info" || s === "medium" ? 2 : 1);
      return rank(b.severity) - rank(a.severity);
    }
    if (sortBy === "effort") {
      return (b.effortHours || 1) - (a.effortHours || 1);
    }
    if (sortBy === "file") {
      return a.filePath.localeCompare(b.filePath);
    }
    if (sortBy === "line") {
      return (a.lineRange?.start || 0) - (b.lineRange?.start || 0);
    }
    return 0;
  });

  // Unique files for dropdown filter
  const uniqueFiles = Array.from(new Set(findings.map((f) => f.filePath)));

  // Bulk selection handlers
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === sortedFindings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedFindings.map((f) => f.id)));
    }
  };

  const handleToggleCode = (id: string) => {
    const next = new Set(expandedCodeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedCodeIds(next);
  };

  const handleConfirmIgnore = (findingId: string) => {
    onIgnoreFinding?.(findingId, ignoreReasonInput);
    setIgnoringFindingId(null);
  };

  const handleConfirmBulkIgnore = () => {
    if (onBulkIgnore && selectedIds.size > 0) {
      onBulkIgnore(Array.from(selectedIds), ignoreReasonInput);
    }
    setIsBulkIgnoring(false);
    setSelectedIds(new Set());
  };

  const getSeverityBadge = (severity: QualityFindingSeverity) => {
    const s = severity.toLowerCase();
    if (s === "critical") return <Badge variant="coral">Critical</Badge>;
    if (s === "warning" || s === "high") return <Badge variant="sun">High</Badge>;
    if (s === "info" || s === "medium") return <Badge variant="cyan">Medium</Badge>;
    return <Badge variant="gray">Low</Badge>;
  };

  const renderFindingCard = (f: CodeQualityFinding) => {
    const isSelected = selectedIds.has(f.id);
    const isCodeExpanded = expandedCodeIds.has(f.id);
    const isIgnored = f.status === "ignored";
    const isFixed = f.status === "fixed";

    return (
      <div
        key={f.id}
        className={`p-4 rounded-xl border transition-all ${
          isSelected
            ? "border-[#7C5CFC] bg-[#7C5CFC]/5"
            : isFixed
            ? "border-emerald-500/20 bg-emerald-500/5 opacity-80"
            : isIgnored
            ? "border-[var(--border-color)] bg-[var(--bg-card)] opacity-60"
            : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[#7C5CFC]/40 shadow-sm"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Checkbox + Title */}
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              onClick={() => handleToggleSelect(f.id)}
              className="mt-0.5 text-[var(--text-secondary)] hover:text-[#7C5CFC] transition-colors"
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-[#7C5CFC]" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm text-[var(--text-primary)]">
                  {f.title}
                </h4>
                {getSeverityBadge(f.severity)}
                <Badge variant="brand">{f.categoryLabel}</Badge>
                {isIgnored && <Badge variant="gray">Ignored: {f.ignoreReason || "Deferred"}</Badge>}
                {isFixed && <Badge variant="mint">Fixed ✓</Badge>}
              </div>

              {/* Location link + Effort */}
              <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)] flex-wrap">
                <button
                  type="button"
                  onClick={() => onOpenFile?.(f.filePath, f.lineRange)}
                  className="text-[#7C5CFC] hover:underline flex items-center gap-1 font-semibold"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  {f.filePath}{f.lineRange ? `:${f.lineRange.start}-${f.lineRange.end}` : ""}
                </button>
                <span>·</span>
                {f.symbolName && (
                  <>
                    <span className="text-[var(--text-primary)] font-semibold">
                      Symbol: {f.symbolName}
                    </span>
                    <span>·</span>
                  </>
                )}
                <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                  <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                  Est. Effort: {f.effortHours || 1.0}h
                </span>
              </div>

              {/* Rationale */}
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed pt-1">
                <span className="font-semibold text-[var(--text-primary)]">Why it matters: </span>
                {f.impactRationale}
              </p>

              {/* Suggested Action */}
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                <span className="font-semibold text-[var(--text-primary)]">Remediation: </span>
                {f.suggestedAction}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isIgnored ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRestoreFinding?.(f.id)}
                className="gap-1 text-xs"
              >
                <RotateCcw className="w-3 h-3" />
                Restore
              </Button>
            ) : isFixed ? (
              <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Resolved
              </span>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIgnoringFindingId(f.id)}
                  className="text-xs hover:text-red-500 hover:border-red-500/40"
                >
                  Ignore
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onProposeRefactoring(f)}
                  className="gap-1.5 text-xs bg-[#7C5CFC] hover:bg-[#6A4BE2] text-white"
                >
                  <Sparkles className="w-3 h-3" />
                  Propose Refactor
                </Button>
              </>
            )}

            <button
              type="button"
              onClick={() => handleToggleCode(f.id)}
              className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-[#7C5CFC] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Toggle Code Snippet"
            >
              {isCodeExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Code Snippet with Highlighted Lines */}
        {isCodeExpanded && f.codeSnippet && (
          <div className="mt-3.5 pt-3 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between pb-1.5 text-[11px] font-mono text-[var(--text-secondary)]">
              <span>Code Preview ({f.filePath})</span>
              <span>Lines {f.lineRange?.start || 1}–{f.lineRange?.end || 15}</span>
            </div>
            <pre className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] font-mono text-[11px] leading-relaxed overflow-x-auto text-[var(--text-primary)] border-l-4 border-l-[#7C5CFC]">
              {f.codeSnippet}
            </pre>
          </div>
        )}

        {/* Ignore Reason Dialog */}
        {ignoringFindingId === f.id && (
          <div className="mt-3 p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2 animate-in fade-in">
            <div className="text-xs font-bold text-[var(--text-primary)]">
              Provide reason for ignoring this finding:
            </div>
            <select
              value={ignoreReasonInput}
              onChange={(e) => setIgnoreReasonInput(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)]"
            >
              <option value="False positive">False positive (Intended architecture pattern)</option>
              <option value="Acceptable trade-off">Acceptable trade-off (Performance optimization)</option>
              <option value="Will fix later">Deferred / Tracked in sprint backlog</option>
              <option value="Legacy code exception">Legacy code exception (Pending decommission)</option>
            </select>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={() => setIgnoringFindingId(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleConfirmIgnore(f.id)}
                className="bg-[#7C5CFC] text-white"
              >
                Confirm Ignore
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search findings by symbol, filename, reason, or pattern..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#7C5CFC]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[#7C5CFC]"
          >
            <option value="open">Status: Open</option>
            <option value="all">Status: All</option>
            <option value="ignored">Status: Ignored</option>
            <option value="fixed">Status: Fixed</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[#7C5CFC]"
          >
            <option value="all">Severity: All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[#7C5CFC]"
          >
            <option value="all">Category: All</option>
            <option value="excessive_complexity">Excessive Complexity</option>
            <option value="deep_nesting">Deep Nesting</option>
            <option value="code_duplication">Code Duplication</option>
            <option value="large_file">Large File</option>
            <option value="too_many_parameters">Too Many Parameters</option>
            <option value="missing_error_handling">Missing Error Handling</option>
            <option value="inconsistent_patterns">Code Smells & TODOs</option>
            <option value="repeated_constants">Magic Numbers</option>
            <option value="missing_test">Missing Tests</option>
          </select>

          {/* File Filter */}
          {uniqueFiles.length > 1 && (
            <select
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[#7C5CFC] max-w-[150px] truncate"
            >
              <option value="all">File: All</option>
              {uniqueFiles.map((f) => (
                <option key={f} value={f}>
                  {f.split("/").pop()}
                </option>
              ))}
            </select>
          )}

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[#7C5CFC]"
          >
            <option value="severity">Sort: Severity</option>
            <option value="effort">Sort: Effort Hours</option>
            <option value="file">Sort: File Path</option>
            <option value="line">Sort: Line Number</option>
          </select>

          {/* Grouping Toggle */}
          <div className="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-hover)] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setGroupBy("none")}
              className={`px-2 py-1 rounded font-medium ${
                groupBy === "none" ? "bg-[var(--bg-card)] text-[#7C5CFC] shadow-xs" : "text-[var(--text-secondary)]"
              }`}
            >
              Flat
            </button>
            <button
              type="button"
              onClick={() => setGroupBy("file")}
              className={`px-2 py-1 rounded font-medium ${
                groupBy === "file" ? "bg-[var(--bg-card)] text-[#7C5CFC] shadow-xs" : "text-[var(--text-secondary)]"
              }`}
            >
              By File
            </button>
            <button
              type="button"
              onClick={() => setGroupBy("category")}
              className={`px-2 py-1 rounded font-medium ${
                groupBy === "category" ? "bg-[var(--bg-card)] text-[#7C5CFC] shadow-xs" : "text-[var(--text-secondary)]"
              }`}
            >
              By Category
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="p-3 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/30 flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#7C5CFC]" />
            <span className="font-bold text-[var(--text-primary)]">
              {selectedIds.size} findings selected
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[#7C5CFC] hover:underline text-[11px] font-semibold ml-2"
            >
              {selectedIds.size === sortedFindings.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkIgnoring(true)}
              className="text-xs"
            >
              Ignore Selected
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const sel = findings.filter((f) => selectedIds.has(f.id));
                if (sel.length > 0) onProposeRefactoring(sel[0]);
              }}
              className="text-xs bg-[#7C5CFC] text-white"
            >
              Propose Refactor
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Ignore Confirmation Modal */}
      {isBulkIgnoring && (
        <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-3">
          <div className="text-xs font-bold text-[var(--text-primary)]">
            Ignore {selectedIds.size} selected findings:
          </div>
          <select
            value={ignoreReasonInput}
            onChange={(e) => setIgnoreReasonInput(e.target.value)}
            className="w-full text-xs p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)]"
          >
            <option value="False positive">False positive (Intended architecture pattern)</option>
            <option value="Acceptable trade-off">Acceptable trade-off (Performance optimization)</option>
            <option value="Will fix later">Deferred / Tracked in sprint backlog</option>
            <option value="Legacy code exception">Legacy code exception (Pending decommission)</option>
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsBulkIgnoring(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmBulkIgnore}
              className="bg-[#7C5CFC] text-white"
            >
              Confirm Bulk Ignore
            </Button>
          </div>
        </div>
      )}

      {/* Findings List (Flat or Grouped) */}
      {sortedFindings.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-12 text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-[#2FD6A0] mx-auto" />
          <h3 className="font-bold text-base text-[var(--text-primary)]">
            No Quality Findings Detected
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            {statusFilter === "open"
              ? "All maintainability rules passed! No open cyclomatic complexity, nesting, or dead-code issues match your filters."
              : "No findings match the current filter criteria."}
          </p>
        </div>
      ) : groupBy === "file" ? (
        // Group by File
        <div className="space-y-6">
          {Array.from(new Set(sortedFindings.map((f) => f.filePath))).map((fPath) => {
            const group = sortedFindings.filter((f) => f.filePath === fPath);
            return (
              <div key={fPath} className="space-y-2">
                <div className="flex items-center justify-between pb-1 text-xs border-b border-[var(--border-color)]">
                  <span className="font-mono font-bold text-[#7C5CFC] flex items-center gap-1.5">
                    <FileCode className="w-4 h-4" />
                    {fPath}
                  </span>
                  <span className="text-[var(--text-secondary)] font-mono text-[11px]">
                    {group.length} finding{group.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {group.map(renderFindingCard)}
                </div>
              </div>
            );
          })}
        </div>
      ) : groupBy === "category" ? (
        // Group by Category
        <div className="space-y-6">
          {Array.from(new Set(sortedFindings.map((f) => f.categoryLabel))).map((catLabel) => {
            const group = sortedFindings.filter((f) => f.categoryLabel === catLabel);
            return (
              <div key={catLabel} className="space-y-2">
                <div className="flex items-center justify-between pb-1 text-xs border-b border-[var(--border-color)]">
                  <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#7C5CFC]" />
                    {catLabel}
                  </span>
                  <span className="text-[var(--text-secondary)] font-mono text-[11px]">
                    {group.length} finding{group.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {group.map(renderFindingCard)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Flat List
        <div className="space-y-2.5">
          {sortedFindings.map(renderFindingCard)}
        </div>
      )}
    </div>
  );
}
