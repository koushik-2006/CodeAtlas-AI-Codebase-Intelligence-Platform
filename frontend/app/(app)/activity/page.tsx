"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/hooks/useTheme";
import { DbActivityEvent } from "@/types/database";
import { workspaceService } from "@/services/workspace-service";
import Link from "next/link";
import {
  History,
  FolderGit2,
  Sparkles,
  GitBranch,
  GitCompare,
  GitPullRequest,
  Network,
  ScanSearch,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";

function formatRelativeTime(dateString: string): string {
  try {
    const deltaMs = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(deltaMs / (1000 * 60));
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "Recently";
  }
}

export default function ActivityPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activities, setActivities] = useState<DbActivityEvent[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await workspaceService.getActivities(filterType);
      setActivities(data);
    } catch (err) {
      console.warn("Failed to load activity feed:", err);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const getIcon = (type: DbActivityEvent["type"]) => {
    switch (type) {
      case "repo_connected":
      case "repo_disconnected":
        return FolderGit2;
      case "indexing_completed":
      case "indexing_failed":
        return GitBranch;
      case "code_explained":
        return ScanSearch;
      case "question_answered":
        return Sparkles;
      case "architecture_explored":
        return Network;
      case "impact_analyzed":
        return GitCompare;
      case "review_completed":
      case "finding_reviewed":
        return GitPullRequest;
      default:
        return History;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <PageHeader
          title="Recent Activity"
          sub="Complete audit trail of repository indexing, code reviews, change impact analyses, and AI explorations."
        />
        <button
          onClick={loadActivities}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Feed
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 my-6">
        {[
          { id: "all", label: "All Activity" },
          { id: "review_completed", label: "Code Reviews" },
          { id: "impact_analyzed", label: "Change Impact" },
          { id: "question_answered", label: "AI Answers" },
          { id: "architecture_explored", label: "Architecture" },
          { id: "indexing_completed", label: "Ingestion" },
        ].map((f) => {
          const isSelected = filterType === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                isSelected
                  ? isDark
                    ? "bg-[#29D3C2] text-[#070A12] border-[#29D3C2]"
                    : "bg-[#6C4DFF] text-white border-[#6C4DFF]"
                  : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]/20"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Activity Timeline List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-xs text-[var(--text-secondary)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mb-3" />
          Loading audit trail events...
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((act) => {
            const Icon = getIcon(act.type);
            return (
              <div
                key={act.id}
                className={`app-card p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 ${
                  isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className={`p-3 rounded-2xl shrink-0 ${
                        isDark
                          ? "bg-[#111725] text-[#29D3C2] border border-[#242B39]"
                          : "bg-[#EAE5FF] text-[#6C4DFF]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-sm sm:text-base font-bold tracking-tight text-[var(--text-primary)]">
                          {act.title}
                        </h3>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold capitalize ${
                            act.status === "error"
                              ? "bg-red-500/15 text-red-500 border border-red-500/30"
                              : act.status === "warning"
                              ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                              : act.status === "success"
                              ? "bg-green-500/15 text-green-500 border border-green-500/30"
                              : isDark
                              ? "bg-[#29D3C2]/15 text-[#29D3C2]"
                              : "bg-[#EAE5FF] text-[#6C4DFF]"
                          }`}
                        >
                          {act.status}
                        </span>
                        {act.repositoryName && (
                          <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--border-color)]/40 px-2 py-0.5 rounded">
                            {act.repositoryName}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                        {act.description}
                      </p>

                      <span className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={act.href}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 self-start sm:self-auto ${
                      isDark
                        ? "border-[#242B39] text-[#29D3C2] hover:bg-[#111725]"
                        : "border-[#E8E5F4] text-[#6C4DFF] hover:bg-[#FAF9FF]"
                    }`}
                  >
                    {act.linkText || "View Details"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center app-card p-8">
          <History className="w-10 h-10 mx-auto text-[var(--text-secondary)]/40 mb-3" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            No activity found for this filter
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Try switching to &ldquo;All Activity&rdquo; or run an analysis on an indexed codebase.
          </p>
        </div>
      )}
    </div>
  );
}
