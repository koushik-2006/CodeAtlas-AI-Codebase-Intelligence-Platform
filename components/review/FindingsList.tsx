"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { ReviewFinding, FindingStatus } from "@/types/review";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Send,
  Search,
  Filter,
  Sparkles,
} from "lucide-react";
import { FindingDiscussionPanel } from "./FindingDiscussionPanel";

interface FindingsListProps {
  findings: ReviewFinding[];
  repositoryId: string;
  reviewSessionId?: string;
  onUpdateStatus: (findingId: string, status: FindingStatus, reason?: string) => void;
  onPublishComment?: (finding: ReviewFinding) => void;
}

export function FindingsList({
  findings,
  repositoryId,
  reviewSessionId,
  onUpdateStatus,
  onPublishComment,
}: FindingsListProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopy = (finding: ReviewFinding) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(
        `[${finding.severity.toUpperCase()}] ${finding.title}\nFile: ${finding.file}:${finding.line || 1}\n\n${finding.description}\n\nRemediation: ${finding.suggestedRemediation}`
      );
      setCopiedId(finding.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filter findings
  const queryLower = searchQuery.toLowerCase().trim();
  const filteredFindings = findings.filter((f) => {
    const matchesSev = severityFilter === "all" || f.severity === severityFilter;
    const matchesCat = categoryFilter === "all" || f.category === categoryFilter;
    const matchesQ =
      !queryLower ||
      f.title.toLowerCase().includes(queryLower) ||
      f.description.toLowerCase().includes(queryLower) ||
      f.file.toLowerCase().includes(queryLower);

    return matchesSev && matchesCat && matchesQ;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/25";
      case "warning":
        return "bg-amber-500/10 text-amber-500 border-amber-500/25";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/25";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
          isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium border outline-none ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                  : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
              }`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className={`py-1 px-2.5 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
              isDark
                ? "bg-[#0A0F19] border-[#30363D] text-[#E6EDF3]"
                : "bg-white border-[#E5E5E0] text-[#1E2022]"
            }`}
          >
            <option value="all">All Severities ({findings.length})</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`py-1 px-2.5 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
              isDark
                ? "bg-[#0A0F19] border-[#30363D] text-[#E6EDF3]"
                : "bg-white border-[#E5E5E0] text-[#1E2022]"
            }`}
          >
            <option value="all">All Categories</option>
            <option value="security">Security</option>
            <option value="logic">Logic</option>
            <option value="test-gap">Test Gaps</option>
            <option value="architecture">Architecture</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div
          className={`p-8 rounded-2xl border text-center ${
            isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          <CheckCircle2 className="w-8 h-8 text-teal-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-[var(--text-primary)]">
            No Findings Match Filters
          </h4>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            All code reviews in this scope have clean evaluations or findings have been filtered out.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => {
            const isExpanded = expandedIds[finding.id] !== false;
            const isDismissed = finding.status === "dismissed";
            const isReviewed = finding.status === "reviewed";

            return (
              <div
                key={finding.id}
                className={`rounded-2xl border transition-all overflow-hidden shadow-xs ${
                  isDismissed ? "opacity-60" : ""
                } ${isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"}`}
              >
                {/* Header */}
                <div
                  onClick={() => toggleExpand(finding.id)}
                  className={`p-4 flex items-start justify-between gap-3 cursor-pointer border-b ${
                    isDark ? "border-[#242B39]" : "border-[#E8E5F4]"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {getSeverityIcon(finding.severity)}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${getSeverityBadge(
                            finding.severity
                          )}`}
                        >
                          {finding.severity}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--border-color)]/50 text-[var(--text-secondary)] font-bold uppercase">
                          {finding.category}
                        </span>
                        {isReviewed && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-500 font-bold">
                            ✓ Reviewed
                          </span>
                        )}
                        {isDismissed && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-500/10 text-gray-500 font-bold">
                            Dismissed
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] leading-snug">
                        {finding.title}
                      </h4>
                      <p className="font-mono text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {finding.file} {finding.line ? `:${finding.line}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 space-y-3.5 text-xs">
                    {/* Description */}
                    <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
                      {finding.description}
                    </p>

                    {/* Code Snippet */}
                    {finding.codeSnippet && (
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase block mb-1">
                          Source Context
                        </span>
                        <pre
                          className={`p-3 rounded-xl overflow-x-auto font-mono text-[11px] leading-5 border ${
                            isDark
                              ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA]"
                              : "bg-[#FAF9FF] border-[#E8E5F4] text-[#19143D]"
                          }`}
                        >
                          {finding.codeSnippet}
                        </pre>
                      </div>
                    )}

                    {/* Why It Matters */}
                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                      <strong className="text-amber-600 dark:text-amber-400 font-mono text-[10px] uppercase block mb-0.5">
                        Why this matters:
                      </strong>
                      <span className="text-[var(--text-secondary)]">{finding.whyItMatters}</span>
                    </div>

                    {/* Suggested Remediation */}
                    <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 text-xs">
                      <strong className="text-teal-600 dark:text-teal-400 font-mono text-[10px] uppercase block mb-0.5">
                        Suggested Remediation:
                      </strong>
                      <span className="text-[var(--text-secondary)] font-mono text-[11px]">
                        {finding.suggestedRemediation}
                      </span>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Copy button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(finding)}
                          className="px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
                        >
                          {copiedId === finding.id ? (
                            <Check className="w-3 h-3 text-teal-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === finding.id ? "Copied" : "Copy"}</span>
                        </button>

                        {/* Open in Viewer */}
                        <Link
                          href={`/repositories/${repositoryId}?file=${encodeURIComponent(
                            finding.file
                          )}&line=${finding.line || 1}`}
                          className="px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Source</span>
                        </Link>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Publish to GitHub comment */}
                        {onPublishComment && (
                          <button
                            type="button"
                            onClick={() => onPublishComment(finding)}
                            className="px-2.5 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-[11px] font-bold text-[var(--primary)] hover:bg-purple-500/20 flex items-center gap-1 transition-colors"
                            title="Preview and publish comment to GitHub pull request"
                          >
                            <Send className="w-3 h-3" />
                            <span>Comment to PR</span>
                          </button>
                        )}

                        {/* Status buttons */}
                        {finding.status !== "reviewed" ? (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(finding.id, "reviewed")}
                            className="px-2.5 py-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-colors"
                          >
                            Mark Reviewed
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(finding.id, "open")}
                            className="px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            Reopen
                          </button>
                        )}

                        {finding.status !== "dismissed" && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateStatus(
                                finding.id,
                                "dismissed",
                                "Dismissed by reviewer during audit"
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-gray-500/30 text-[11px] font-bold text-gray-500 hover:bg-gray-500/10 transition-colors"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Phase 14: Collaborative Finding Discussion & Status Panel */}
                    <FindingDiscussionPanel
                      repositoryId={repositoryId}
                      reviewSessionId={reviewSessionId || "rev_sample_pr101"}
                      findingId={finding.id}
                      findingTitle={finding.title}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
