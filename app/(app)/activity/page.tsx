"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";
import {
  History,
  FolderGit2,
  Sparkles,
  GitBranch,
  GitCompare,
  ScanSearch,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Check,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "repo" | "analysis" | "codelens" | "ai" | "impact";
  title: string;
  description: string;
  timestamp: string;
  status: "Completed" | "Verified" | "High Risk" | "Indexed";
  href: string;
  linkText: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    type: "impact",
    title: "Change impact analysis executed",
    description: "Evaluated ripple effects for auth.py:login(). Identified 2 affected API endpoints and 2 unit tests.",
    timestamp: "2 mins ago",
    status: "High Risk",
    href: "/impact",
    linkText: "View Impact Report",
  },
  {
    id: "act-2",
    type: "ai",
    title: "AI Question answered with receipts",
    description: "Answered: 'How does login work?' with verified citations to auth.py:14–18 and test_auth.py:7.",
    timestamp: "8 mins ago",
    status: "Verified",
    href: "/assistant",
    linkText: "Open in Assistant",
  },
  {
    id: "act-3",
    type: "codelens",
    title: "Visual Code Explorer extraction",
    description: "Captured and extracted auth.py function signature from camera screenshot. 18 lines corrected.",
    timestamp: "15 mins ago",
    status: "Completed",
    href: "/visual-code-explorer",
    linkText: "Open CodeLens",
  },
  {
    id: "act-4",
    type: "analysis",
    title: "Architecture graph generated",
    description: "Compiled static AST call graph for my-project with 6 components and 5 dependency edges.",
    timestamp: "24 mins ago",
    status: "Indexed",
    href: "/architecture",
    linkText: "View City Map",
  },
  {
    id: "act-5",
    type: "repo",
    title: "Repository connected: my-project",
    description: "Authorized GitHub repository metadata and initialized background symbol parsing.",
    timestamp: "32 mins ago",
    status: "Completed",
    href: "/repositories",
    linkText: "Manage Repos",
  },
];

export default function ActivityPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [filterType, setFilterType] = useState<string>("all");

  const filteredActivities = ACTIVITIES.filter((act) => {
    if (filterType === "all") return true;
    return act.type === filterType;
  });

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "repo":
        return FolderGit2;
      case "analysis":
        return GitBranch;
      case "codelens":
        return ScanSearch;
      case "ai":
        return Sparkles;
      case "impact":
        return GitCompare;
    }
  };

  return (
    <div>
      <PageHeader
        title="Recent Activity"
        sub="Audit trail of codebase connections, symbol analyses, OCR captures, and AI queries."
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {[
          { id: "all", label: "All Activity" },
          { id: "impact", label: "Change Impact" },
          { id: "ai", label: "AI Answers" },
          { id: "codelens", label: "CodeLens" },
          { id: "analysis", label: "Architecture" },
          { id: "repo", label: "Repositories" },
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
      <div className="space-y-4">
        {filteredActivities.map((act) => {
          const Icon = getIcon(act.type);
          return (
            <div
              key={act.id}
              className={`app-card p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 ${
                isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-2xl shrink-0 ${
                      isDark
                        ? "bg-[#111725] text-[#29D3C2] border border-[#242B39]"
                        : "bg-[#EAE5FF] text-[#6C4DFF]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold tracking-tight">{act.title}</h3>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          act.status === "High Risk"
                            ? "bg-red-500/15 text-red-500 border border-red-500/30"
                            : act.status === "Verified"
                            ? "bg-green-500/15 text-green-500 border border-green-500/30"
                            : isDark
                            ? "bg-[#29D3C2]/15 text-[#29D3C2]"
                            : "bg-[#EAE5FF] text-[#6C4DFF]"
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>

                    <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                      {act.description}
                    </p>

                    <span className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
                      <Clock className="w-3 h-3" />
                      {act.timestamp}
                    </span>
                  </div>
                </div>

                <Link
                  href={act.href}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                    isDark
                      ? "border-[#242B39] text-[#29D3C2] hover:bg-[#111725]"
                      : "border-[#E8E5F4] text-[#6C4DFF] hover:bg-[#FAF9FF]"
                  }`}
                >
                  {act.linkText}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
