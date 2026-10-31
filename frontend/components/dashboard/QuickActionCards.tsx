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
      desc: "Index code repositories, extract AST symbols, and parse cross-file call relationships.",
      icon: Github,
      tint: "bg-[#7C5CFC]/10 text-[#7C5CFC] border-[#7C5CFC]/20",
      buttonText: "Connect Repo",
      onClick: onConnectGitHub,
      href: "/repositories",
    },
    {
      step: "02 — CODELENS",
      title: "Visual Code Explorer",
      desc: "Paste code snippets, upload screenshots, or extract source code via OCR.",
      icon: ScanSearch,
      tint: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      buttonText: "Open CodeLens",
      href: "/visual-explorer",
    },
    {
      step: "03 — GROUNDED AI",
      title: "Ask AI Assistant",
      desc: "Query the codebase and receive verified answers with clickable file and line citations.",
      icon: Sparkles,
      tint: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      buttonText: "Ask Question",
      href: `/assistant?repoId=${activeRepoId}&q=${encodeURIComponent("How does authentication work?")}`,
    },
    {
      step: "04 — TOPOLOGY",
      title: "Explore Architecture",
      desc: "Visualize multi-tier dependency graphs, entrypoint callers, and external service contracts.",
      icon: Network,
      tint: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      buttonText: "View City Graph",
      href: `/architecture?repoId=${activeRepoId}`,
    },
    {
      step: "05 — BLAST RADIUS",
      title: "Analyze Change Impact",
      desc: "Calculate upstream dependencies and downstream breakages before deploying changes.",
      icon: GitCompare,
      tint: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      buttonText: "Analyze Impact",
      href: `/change-impact?repoId=${activeRepoId}`,
    },
    {
      step: "06 — PR AUDIT",
      title: "Review Pull Request",
      desc: "Automate code reviews, detect security flaws, and identify untested logic branches.",
      icon: GitPullRequest,
      tint: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      buttonText: "Review PR #101",
      href: `/code-review?repoId=${activeRepoId}&pr=101`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {ACTIONS.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.step}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className={`flex flex-col justify-between rounded-2xl p-5 sm:p-6 transition-all duration-200 border h-full min-h-[200px] ${
              isDark
                ? "bg-[#0D111B] border-[#242B39] hover:border-[#7C5CFC]/50 hover:shadow-[0_0_25px_-5px_rgba(124,92,252,0.18)]"
                : "bg-white border-[#E8E5F4] shadow-sm hover:border-[#7C5CFC]/40 hover:shadow-[0_4px_20px_-4px_rgba(124,92,252,0.12)]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${card.tint}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-mono text-[10px] font-bold text-[var(--text-secondary)] tracking-wider">
                  {card.step}
                </span>
              </div>

              <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
                {card.title}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                {card.desc}
              </p>
            </div>

            <div className="mt-5 flex justify-end pt-2 border-t border-[var(--border-color)]/60">
              {card.onClick ? (
                <button
                  type="button"
                  onClick={card.onClick}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-md px-1 py-0.5"
                >
                  <span>{card.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-md px-1 py-0.5"
                >
                  <span>{card.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
