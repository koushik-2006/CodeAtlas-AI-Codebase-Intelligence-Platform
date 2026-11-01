"use client";

import React, { useState, useEffect } from "react";
import { ReviewFinding, FindingStatus } from "@/types/review";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Search,
  Sparkles,
  ExternalLink,
  Wrench,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FindingsListProps {
  findings: ReviewFinding[];
  repositoryId: string;
  pullRequestId?: string;
  onUpdateStatus: (findingId: string, status: FindingStatus, reason?: string) => void;
  onApplySuggestion?: (findingId: string, suggestionDiff?: string) => void;
  onJumpToDiff?: (file: string, line: number) => void;
  onOpenDiscussion?: (finding: ReviewFinding) => void;
  className?: string;
}

export function FindingsList({
  findings,
  repositoryId,
  pullRequestId,
  onUpdateStatus,
  onApplySuggestion,
  onJumpToDiff,
  onOpenDiscussion,
  className = "",
}: FindingsListProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dismissModalFinding, setDismissModalFinding] = useState<ReviewFinding | null>(null);
  const [dismissReason, setDismissReason] = useState<string>("");
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Group findings into categories
  const queryLower = searchQuery.toLowerCase().trim();
  const safeFindings = findings || [];

  const filteredFindings = safeFindings.filter((f) => {
    const matchesSev = severityFilter === "all" || f.severity === severityFilter;
    const matchesCat =
      categoryFilter === "all" ||
      f.category.toLowerCase() === categoryFilter.toLowerCase() ||
      (categoryFilter === "test-gap" && f.category === "test-gap");
    const matchesQ =
      !queryLower ||
      f.title.toLowerCase().includes(queryLower) ||
      f.description.toLowerCase().includes(queryLower) ||
      f.file.toLowerCase().includes(queryLower);

    return matchesSev && matchesCat && matchesQ;
  });

  // Keyboard navigation: j (next), k (prev)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        setFocusedIndex((prev) => Math.min(prev + 1, Math.max(0, filteredFindings.length - 1)));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredFindings.length]);

  const handleCopy = (finding: ReviewFinding) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(
        `[${finding.severity.toUpperCase()}] ${finding.title}\nFile: ${finding.file}:${
          finding.line || 1
        }\n\n${finding.description}\n\nSuggested Fix:\n${finding.suggestedRemediation}`
      );
      setCopiedId(finding.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleConfirmDismiss = () => {
    if (!dismissModalFinding) return;
    onUpdateStatus(dismissModalFinding.id, "dismissed", dismissReason || "Dismissed by reviewer");
    setDismissModalFinding(null);
    setDismissReason("");
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
      case "warning":
        return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
      default:
        return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  const categories = [
    { id: "all", label: "All Categories", count: safeFindings.length },
    { id: "security", label: "Security", count: safeFindings.filter((f) => f.category === "security").length },
    { id: "bug", label: "Bugs & Logic", count: safeFindings.filter((f) => f.category === "bug" || f.category === "logic").length },
    { id: "performance", label: "Performance", count: safeFindings.filter((f) => f.category === "performance").length },
    { id: "test-gap", label: "Test Gaps", count: safeFindings.filter((f) => f.category === "test-gap").length },
    { id: "maintainability", label: "Maintainability", count: safeFindings.filter((f) => f.category === "maintainability").length },
    { id: "style", label: "Style & Quality", count: safeFindings.filter((f) => f.category === "style").length },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              categoryFilter === cat.id
                ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[#7C5CFC]/50"
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                categoryFilter === cat.id ? "bg-white/20 text-white" : "bg-[var(--bg-card-hover)] text-[var(--text-secondary)]"
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings by title, file, or keyword..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="p-1.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <span className="hidden sm:inline-block text-[11px] font-mono text-[var(--text-secondary)]">
            Tip: Use <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] border border-[var(--border-color)]">j</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] border border-[var(--border-color)]">k</kbd> to navigate
          </span>
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
          <h4 className="font-bold text-sm text-[var(--text-primary)]">Zero findings match filter</h4>
          <p className="text-xs text-[var(--text-secondary)]">
            Try adjusting your severity or category filters above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding, idx) => {
            const isFocused = idx === focusedIndex;
            const isDismissed = finding.status === "dismissed";
            const isAccepted = finding.status === "accepted" || !!finding.accepted;

            return (
              <div
                key={finding.id}
                id={`finding-${finding.id}`}
                className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
                  isFocused
                    ? "ring-2 ring-[#7C5CFC] border-[#7C5CFC] bg-[var(--bg-card)] shadow-md"
                    : isDismissed
                    ? "opacity-50 bg-[var(--bg-card)] border-[var(--border-color)]"
                    : "bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[#7C5CFC]/50 shadow-xs"
                }`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getSeverityBadge(finding.severity)}`}>
                      {finding.severity.toUpperCase()}
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] uppercase">
                      {finding.category}
                    </span>

                    {finding.isLocalCheck && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                        Local Check
                      </span>
                    )}

                    {isAccepted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Accepted
                      </span>
                    )}

                    {isDismissed && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        Dismissed ({finding.dismissReason || "Rejected"})
                      </span>
                    )}

                    <h3 className="font-bold text-sm text-[var(--text-primary)]">
                      {finding.title}
                    </h3>
                  </div>

                  {/* File:Line link */}
                  <button
                    type="button"
                    onClick={() => onJumpToDiff?.(finding.file, finding.line || 1)}
                    className="font-mono text-xs font-semibold text-[#7C5CFC] hover:underline flex items-center gap-1 shrink-0"
                    title="Jump to diff line"
                  >
                    <span>
                      {finding.file}:{finding.line || 1}
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Explanation */}
                <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                  {finding.description}
                </p>

                {/* Why it matters */}
                {finding.whyItMatters && (
                  <div className="p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    <strong className="text-[var(--text-primary)]">Why it matters: </strong>
                    {finding.whyItMatters}
                  </div>
                )}

                {/* Suggested Fix Mini-Diff */}
                {finding.suggestionDiff && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[var(--text-secondary)]">
                      <span>Suggested Fix:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onApplySuggestion?.(finding.id, finding.suggestionDiff)}
                        disabled={isAccepted}
                        className="text-[11px] h-6 px-2.5 text-[#7C5CFC] gap-1 hover:border-[#7C5CFC]"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>{isAccepted ? "Suggestion Applied" : "Apply Suggestion"}</span>
                      </Button>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 font-mono text-xs border border-[var(--border-color)] overflow-x-auto whitespace-pre leading-relaxed">
                      {finding.suggestionDiff.split("\n").map((sLine, sIdx) => {
                        const isAdd = sLine.startsWith("+");
                        const isDel = sLine.startsWith("-");
                        return (
                          <div
                            key={sIdx}
                            className={
                              isAdd
                                ? "text-emerald-400 bg-emerald-950/30 px-1"
                                : isDel
                                ? "text-rose-400 bg-rose-950/30 px-1"
                                : "text-[var(--text-secondary)]"
                            }
                          >
                            {sLine}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-[var(--border-color)]/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateStatus(finding.id, "accepted")}
                      disabled={isAccepted}
                      className="text-xs h-7 px-3 text-emerald-400 gap-1 hover:border-emerald-500"
                    >
                      <Check className="w-3 h-3" />
                      <span>Accept</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDismissModalFinding(finding)}
                      disabled={isDismissed}
                      className="text-xs h-7 px-3 text-rose-400 gap-1 hover:border-rose-500"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Dismiss</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenDiscussion?.(finding)}
                      className="text-xs h-7 px-3 text-[var(--text-primary)] gap-1 hover:border-[#7C5CFC]"
                    >
                      <MessageSquare className="w-3 h-3 text-[#7C5CFC]" />
                      <span>Discuss</span>
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(finding)}
                    className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] inline-flex items-center gap-1 font-mono"
                    title="Copy finding details"
                  >
                    {copiedId === finding.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dismiss Finding Modal */}
      {dismissModalFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                Dismiss Finding
              </h3>
              <button
                type="button"
                onClick={() => setDismissModalFinding(null)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Please provide a brief justification for dismissing{" "}
              <strong className="text-[var(--text-primary)]">{dismissModalFinding.title}</strong>:
            </p>

            <textarea
              rows={3}
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="e.g. False positive, tested in separate end-to-end integration suite, acceptable risk for this sprint..."
              className="w-full p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDismissModalFinding(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDismiss}
                className="bg-rose-500 hover:bg-rose-600 text-white text-xs"
              >
                Confirm Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
