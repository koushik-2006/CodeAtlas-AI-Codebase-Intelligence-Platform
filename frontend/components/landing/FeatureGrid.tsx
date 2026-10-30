"use client";

import {
  FolderGit2,
  GitBranch,
  FileSearch,
  Bot,
  Eye,
  GitCompare,
  Bug,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Github as GithubIcon } from "@/components/Icons";

const FEATURES = [
  {
    title: "Repository Intelligence",
    eyebrow: "Structure & Symbols",
    desc: "Inspect repository hierarchy, discover entry points, and extract symbols with zero model training on your proprietary code.",
    icon: FolderGit2,
    badge: "AST Indexed",
    badgeColor: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    title: "Architecture Graph",
    eyebrow: "Visual Dependency Map",
    desc: "Visualize caller and callee relationships between files, functions, API routes, and database models in an interactive canvas.",
    icon: GitBranch,
    badge: "Interactive Canvas",
    badgeColor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    title: "Code Explanation",
    eyebrow: "CodeLens Engine",
    desc: "Paste or photograph complex code snippets to break down unfamiliar algorithms, types, and logic flows step-by-step.",
    icon: FileSearch,
    badge: "OCR + Snippet Parser",
    badgeColor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    title: "AI Assistant with Receipts",
    eyebrow: "Grounded In Source Code",
    desc: "Ask natural language questions about your repository and receive answers backed by exact file paths and verified line-range citations.",
    icon: Bot,
    badge: "Verifiable Citations",
    badgeColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Visual Code Explorer",
    eyebrow: "Deep Symbol Navigation",
    desc: "Navigate through abstract syntax tree symbols, function declarations, incoming callers, and linked test assertions.",
    icon: Eye,
    badge: "Symbol Resolution",
    badgeColor: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  {
    title: "Multi-Repository Analysis",
    eyebrow: "Cross-Service Intelligence",
    desc: "Trace shared API contracts, cross-repo dependency hierarchies, and client-server interactions across connected codebases.",
    icon: GitCompare,
    badge: "Cross-Repo Graph",
    badgeColor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  {
    title: "AI Debugger",
    eyebrow: "Root Cause Investigation",
    desc: "Paste stack traces to map failure frames directly to repository files, generate hypotheses, and review automated fix recommendations.",
    icon: Bug,
    badge: "Stack Frame Mapper",
    badgeColor: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  {
    title: "Refactoring & Technical Debt",
    eyebrow: "Impact & Quality Audits",
    desc: "Calculate the blast radius before touching code. Detect circular imports, unused functions, and high-complexity modules.",
    icon: Sparkles,
    badge: "Blast Radius Scoring",
    badgeColor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "GitHub Integration",
    eyebrow: "Secure Read-Only Access",
    desc: "Authorize GitHub with read-only permissions to import repositories without exposing write access or administrative privileges.",
    icon: GithubIcon,
    badge: "Read-Only OAuth",
    badgeColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 scroll-mt-20">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3.5 py-1.5 font-mono text-xs font-bold text-[var(--primary)] shadow-xs">
          <span>FEATURE SHOWCASE</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-[var(--text-primary)]">
          Built for Engineers Who Value Grounded Truth
        </h2>
        <p className="text-base text-[var(--text-secondary)] max-w-2xl mx-auto">
          Every capability in CodeAtlas is engineered to provide deterministic clarity over guesswork, connecting every symbol to verified source files.
        </p>
      </div>

      {/* Bento Feature Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="group relative rounded-2xl sm:rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-xs hover:shadow-md hover:border-[var(--primary)]/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Top Badge and Icon */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono text-[11px] font-bold border ${feature.badgeColor}`}>
                    {feature.badge}
                  </span>
                  <div className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors duration-200">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Eyebrow & Title */}
                <div className="space-y-1">
                  <span className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
                    {feature.eyebrow}
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                    {feature.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>

              {/* Bottom Subtle Indicator */}
              <div className="pt-4 mt-4 border-t border-[var(--border-color)]/60 flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Production Ready
                </span>
                <span className="group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all font-bold">
                  Explore &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
