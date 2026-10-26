"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { Github } from "@/components/Icons";
import {
  ScanSearch,
  Sparkles,
  ArrowRight,
  Network,
  GitCompare,
  GitPullRequest,
  FolderGit2,
} from "lucide-react";
import { motion } from "framer-motion";

interface QuickActionCardsProps {
  onConnectGitHub?: () => void;
  activeRepoId?: string;
}

export function QuickActionCards({ onConnectGitHub, activeRepoId = "sample-project" }: QuickActionCardsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const ACTIONS = [
    {
      step: "01 — INGEST",
      title: "Connect Repository",
      desc: "Connect a repository to index files, AST symbols, and call relationships.",
      icon: Github,
      badgeColor: isDark ? "bg-[#29D3C2]/15 text-[#29D3C2]" : "bg-[#EAE5FF] text-[#6C4DFF]",
      iconColor: isDark ? "text-[#29D3C2]" : "text-[#1E2022]",
      buttonText: "Connect Repo",
      onClick: onConnectGitHub,
      href: "/repositories",
      isPrimaryAction: true,
    },
    {
      step: "02 — CODELENS",
      title: "Explain Code Snippet",
      desc: "Paste code, upload a screenshot, or extract snippets via camera OCR.",
      icon: ScanSearch,
      badgeColor: isDark ? "bg-[#8B7CFF]/15 text-[#8B7CFF]" : "bg-[#FFE0BF] text-[#E07A00]",
      iconColor: isDark ? "text-[#8B7CFF]" : "text-[#6C4DFF]",
      buttonText: "Open CodeLens",
      href: "/visual-explorer",
    },
    {
      step: "03 — GROUNDED AI",
      title: "Ask AI Assistant",
      desc: "Query the codebase and receive answers grounded in verifiable AST code citations.",
      icon: Sparkles,
      badgeColor: isDark ? "bg-[#2FD6A0]/15 text-[#2FD6A0]" : "bg-[#D7F7EA] text-[#1BA97B]",
      iconColor: isDark ? "text-[#2FD6A0]" : "text-[#1BA97B]",
      buttonText: "Ask Question",
      href: `/assistant?repoId=${activeRepoId}&q=${encodeURIComponent("How does authentication work?")}`,
    },
    {
      step: "04 — TOPOLOGY",
      title: "Explore Architecture",
      desc: "Visualize multi-tier dependency call graphs, API endpoints, and service components.",
      icon: Network,
      badgeColor: isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-cyan-50 text-cyan-700",
      iconColor: isDark ? "text-cyan-400" : "text-cyan-600",
      buttonText: "View City Graph",
      href: `/architecture?repoId=${activeRepoId}`,
    },
    {
      step: "05 — BLAST RADIUS",
      title: "Analyze Change Impact",
      desc: "Evaluate upstream callers and downstream APIs before pushing code commits.",
      icon: GitCompare,
      badgeColor: isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700",
      iconColor: isDark ? "text-amber-400" : "text-amber-600",
      buttonText: "Analyze Impact",
      href: `/change-impact?repoId=${activeRepoId}`,
    },
    {
      step: "06 — PR AUDIT",
      title: "Review Pull Request",
      desc: "Inspect git diffs, detect logic bugs and security flaws, and map test gaps.",
      icon: GitPullRequest,
      badgeColor: isDark ? "bg-rose-500/15 text-rose-400" : "bg-rose-50 text-rose-700",
      iconColor: isDark ? "text-rose-400" : "text-rose-600",
      buttonText: "Review PR #101",
      href: `/code-review?repoId=${activeRepoId}&pr=101`,
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {ACTIONS.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.step} className="h-full">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className={`h-full flex flex-col justify-between rounded-3xl p-6 transition-all duration-200 border ${
                isDark
                  ? "bg-[#0D111B] border-[#242B39] hover:border-[#29D3C2]/50 hover:shadow-[0_0_20px_-5px_rgba(41,211,194,0.15)]"
                  : "bg-white border-[#E8E5F4] shadow-sm hover:shadow-soft"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded-md ${card.badgeColor}`}>
                    {card.step}
                  </span>
                  <div
                    className={`p-2 rounded-xl ${
                      isDark ? "bg-[#0D1117]" : "bg-[#FAF9FF]"
                    } ${card.iconColor}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="mt-4 text-lg font-bold tracking-tight text-[var(--text-primary)]">
                  {card.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)] leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  {card.href.startsWith("/assistant")
                    ? "Grounded AST"
                    : card.href.startsWith("/code-review")
                    ? "PR Intelligence"
                    : "Zero-Trust"}
                </span>

                {card.onClick ? (
                  <button
                    type="button"
                    onClick={card.onClick}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                      isDark
                        ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                        : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
                    }`}
                  >
                    {card.buttonText}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Link
                    href={card.href}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                      isDark
                        ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                        : "bg-[#6C4DFF] text-white hover:bg-[#5838e6]"
                    }`}
                  >
                    {card.buttonText}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
