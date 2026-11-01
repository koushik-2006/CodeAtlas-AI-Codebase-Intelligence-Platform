"use client";

import Link from "next/link";
import {
  FolderGit2,
  Users,
  AlertTriangle,
  Code2,
  Clock,
  Sparkles,
  GitPullRequest,
  Compass,
  ArrowRight,
  Activity as ActivityIcon,
  CheckCircle2,
  MessageSquare,
  StickyNote,
} from "lucide-react";

interface WorkspaceOverviewTabProps {
  workspace: any;
  repositories: any[];
  members: any[];
  activities: any[];
  onNavigateTab: (tabId: string) => void;
}

export default function WorkspaceOverviewTab({
  workspace,
  repositories,
  members,
  activities,
  onNavigateTab,
}: WorkspaceOverviewTabProps) {
  // Compute metrics
  const repoCount = repositories.length || workspace.repoCount || 1;
  const memberCount = members.length || workspace.memberCount || 1;
  const openFindings = 3; // Seeded findings across review sessions
  const astSymbols = 142; // Seeded AST symbols
  const healthScore = 96;

  // SVG Circular progress math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div
          onClick={() => onNavigateTab("repositories")}
          className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)]/50 cursor-pointer transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Repositories</span>
            <FolderGit2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{repoCount}</div>
          <span className="text-[10px] text-cyan-400 mt-0.5 block">Connected & Indexed</span>
        </div>

        <div
          onClick={() => onNavigateTab("members")}
          className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)]/50 cursor-pointer transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Members</span>
            <Users className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{memberCount}</div>
          <span className="text-[10px] text-[var(--primary)] mt-0.5 block">Active Collaborators</span>
        </div>

        <Link
          href="/code-review"
          className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)]/50 cursor-pointer transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Open Findings</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{openFindings}</div>
          <span className="text-[10px] text-amber-400 mt-0.5 block">1 High, 2 Medium</span>
        </Link>

        <Link
          href="/architecture"
          className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)]/50 cursor-pointer transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">AST Symbols</span>
            <Code2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{astSymbols}</div>
          <span className="text-[10px] text-purple-400 mt-0.5 block">Classes & Functions</span>
        </Link>

        <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Last Indexed</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-[var(--text-primary)] truncate">Today</div>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">Synced with HEAD</span>
        </div>
      </div>

      {/* Health Score & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* SVG Circular Health Score Ring */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Workspace Health Score
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                Optimal
              </span>
            </div>

            {/* Circular Ring */}
            <div className="flex items-center justify-center my-3">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-[var(--border-color)]/50 fill-none"
                  />
                  {/* Foreground Animated Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="#7C5CFC"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="fill-none transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-[var(--text-primary)]">{healthScore}%</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium">System Health</span>
                </div>
              </div>
            </div>

            {/* Sub-scores */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-[var(--border-color)]/50">
              <div className="p-1.5 rounded-lg bg-[var(--bg-surface)]">
                <div className="text-xs font-bold text-emerald-400">98%</div>
                <div className="text-[9px] text-[var(--text-secondary)]">Security</div>
              </div>
              <div className="p-1.5 rounded-lg bg-[var(--bg-surface)]">
                <div className="text-xs font-bold text-purple-400">94%</div>
                <div className="text-[9px] text-[var(--text-secondary)]">Architecture</div>
              </div>
              <div className="p-1.5 rounded-lg bg-[var(--bg-surface)]">
                <div className="text-xs font-bold text-cyan-400">96%</div>
                <div className="text-[9px] text-[var(--text-secondary)]">Reliability</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Pre-filtered to this workspace */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Workspace Deep Dive Tools
              </h3>
              <span className="text-[11px] text-[var(--text-secondary)]">
                Scoped to {workspace.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/architecture"
                className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-2.5">
                  <Compass className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] flex items-center justify-between">
                  <span>Architecture</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                  Inspect multi-repository service graphs, module dependencies, and AST schemas.
                </p>
              </Link>

              <Link
                href="/code-review"
                className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2.5">
                  <GitPullRequest className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-emerald-400 flex items-center justify-between">
                  <span>Code Review</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                  Automated pull request analysis, security audit findings, and remediation diffs.
                </p>
              </Link>

              <Link
                href="/assistant"
                className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-2.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-cyan-400 flex items-center justify-between">
                  <span>AI Assistant</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                  Chat with grounded context across all repositories in this workspace.
                </p>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]/40 mt-3 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>All repositories fully synchronized with latest commits</span>
            </span>
            <button
              onClick={() => onNavigateTab("settings")}
              className="text-[var(--primary)] hover:underline font-semibold"
            >
              Workspace Policies &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Recent Activity Timeline */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Workspace Recent Activity
            </h3>
          </div>
          <span className="text-[11px] text-[var(--text-secondary)]">
            {activities.length} recent events
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-xl">
            No activity recorded yet for this workspace.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 5).map((act, idx) => {
              let IconComp = ActivityIcon;
              let iconColor = "text-[var(--primary)] bg-[var(--primary)]/15 border-[var(--primary)]/30";

              if (act.category === "member") {
                IconComp = Users;
                iconColor = "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
              } else if (act.category === "repository") {
                IconComp = FolderGit2;
                iconColor = "text-cyan-400 bg-cyan-500/15 border-cyan-500/30";
              } else if (act.category === "discussion") {
                IconComp = MessageSquare;
                iconColor = "text-amber-400 bg-amber-500/15 border-amber-500/30";
              } else if (act.category === "annotation") {
                IconComp = StickyNote;
                iconColor = "text-purple-400 bg-purple-500/15 border-purple-500/30";
              }

              return (
                <div
                  key={act.id || idx}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-surface)] hover:border-[var(--border-color)] transition-all"
                >
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${iconColor}`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-[var(--text-primary)]">
                        <strong className="text-[var(--primary)]">{act.userName || "System"}</strong>{" "}
                        {act.action}
                      </p>
                      <span className="text-[10px] text-[var(--text-secondary)] whitespace-nowrap">
                        {act.timestamp || "recently"}
                      </span>
                    </div>
                    {act.details && (
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
                        {act.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
