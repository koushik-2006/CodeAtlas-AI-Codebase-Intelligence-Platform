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
    if (days < 7) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

  const getEventMeta = (type: DbActivityEvent["type"]) => {
    switch (type) {
      case "repo_connected":
      case "repo_disconnected":
        return { icon: FolderGit2, tint: "bg-[#7C5CFC]/10 text-[#7C5CFC] border-[#7C5CFC]/20" };
      case "indexing_completed":
      case "indexing_failed":
        return { icon: GitBranch, tint: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
      case "code_explained":
        return { icon: ScanSearch, tint: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
      case "question_answered":
        return { icon: Sparkles, tint: "bg-purple-500/10 text-purple-500 border-purple-500/20" };
      case "architecture_explored":
        return { icon: Network, tint: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" };
      case "impact_analyzed":
        return { icon: GitCompare, tint: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
      case "review_completed":
      case "finding_reviewed":
        return { icon: GitPullRequest, tint: "bg-rose-500/10 text-rose-500 border-rose-500/20" };
      default:
        return { icon: History, tint: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
    }
  };

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 transition-all duration-200 ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Recent Activity
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Auditable activity timeline across indexers, reviewers, and queries.
            </p>
          </div>
        </div>

        <Link
          href="/activity"
          className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-md px-1"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-color)]/50 animate-pulse"
            >
              <div className="w-9 h-9 rounded-xl bg-[var(--border-color)] shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-40 bg-[var(--border-color)] rounded" />
                <div className="h-3 w-64 bg-[var(--border-color)]/60 rounded" />
              </div>
              <div className="h-3 w-16 bg-[var(--border-color)]/50 rounded" />
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--text-secondary)] space-y-1">
          <History className="w-7 h-7 mx-auto text-[var(--text-secondary)]/40 mb-2" />
          <p>No recent activity recorded yet.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {activities.map((item) => {
            const { icon: EventIcon, tint } = getEventMeta(item.type);
            const timeAgo = formatRelativeTime(item.timestamp);

            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-150 ${
                  isDark
                    ? "bg-[#111726]/50 border-[#242B39] hover:bg-[#111726] hover:border-[#7C5CFC]/40"
                    : "bg-[#F9FAFB] border-[#E8E5F4] hover:bg-white hover:border-[#7C5CFC]/40 shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${tint}`}>
                    <EventIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-secondary)] shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{timeAgo}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
