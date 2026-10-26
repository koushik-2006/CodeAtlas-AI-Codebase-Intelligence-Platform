"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { DbActivityEvent } from "@/types/database";
import { workspaceService } from "@/services/workspace-service";
import {
  History,
  FolderGit2,
  GitBranch,
  ScanSearch,
  Sparkles,
  GitCompare,
  GitPullRequest,
  Network,
  ArrowRight,
  Clock,
  Loader2,
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

export function RecentActivityPanel() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activities, setActivities] = useState<DbActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await workspaceService.getActivities(undefined, undefined, 5);
      setActivities(data);
    } catch (err) {
      console.warn("Failed to load dashboard activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

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
    <section
      className={`rounded-3xl border p-6 sm:p-7 transition-all duration-200 ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-sm"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-[var(--primary)]" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Recent Activity
          </h2>
          <span className="font-mono text-[10px] uppercase font-bold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-2 py-0.5 rounded-md">
            Audit Log
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/activity"
            className="font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            Full Audit Trail <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
                isDark ? "bg-[#0A0F19] border-[#242B39]" : "bg-[#FAF9FF] border-[#E8E5F4]"
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[var(--border-color)]/50 animate-pulse shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="w-36 h-3 rounded bg-[var(--border-color)]/60 animate-pulse" />
                <div className="w-56 h-2.5 rounded bg-[var(--border-color)]/40 animate-pulse" />
              </div>
              <div className="w-12 h-3 rounded bg-[var(--border-color)]/40 animate-pulse" />
            </div>
          ))}
        </div>
      ) : activities.length > 0 ? (
        <div className="mt-4 space-y-3">
          {activities.map((item) => {
            const Icon = getIcon(item.type);
            return (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                  isDark
                    ? "bg-[#0A0F19] border-[#242B39] hover:bg-[#111725]/60 hover:border-[#29D3C2]/40"
                    : "bg-[#FAF9FF] border-[#E8E5F4] hover:bg-white hover:border-[#6C4DFF]/30"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isDark
                        ? "bg-[#161B22] text-[#29D3C2]"
                        : "bg-white text-[#6C4DFF] border border-[#E5E5E0]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={item.href}
                        className="text-xs sm:text-sm font-bold text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
                      >
                        {item.title}
                      </Link>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full capitalize ${
                          item.status === "success"
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : item.status === "warning"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : item.status === "error"
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            : isDark
                            ? "bg-[#29D3C2]/15 text-[#29D3C2]"
                            : "bg-[#EAE5FF] text-[#6C4DFF]"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-[var(--text-secondary)]">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={item.href}
                  className={`shrink-0 p-1.5 rounded-lg border text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors ${
                    isDark ? "border-[#30363D]" : "border-[#E5E5E0]"
                  }`}
                  title={item.linkText || "View details"}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center">
          <History className="w-8 h-8 mx-auto text-[var(--text-secondary)]/40 mb-2" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            No activity recorded yet
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
            Repository connections, symbol parsing, questions, and PR reviews will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
