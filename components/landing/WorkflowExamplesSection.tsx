"use client";

import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";
import { Compass, Database, GitCompare, GitPullRequest, ArrowRight } from "lucide-react";

export function WorkflowExamplesSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const workflows = [
    {
      title: "Onboarding into a 50k-Line Monorepo",
      icon: Compass,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      flow: "Connect repo → Generate Knowledge Report → Follow 6-step curriculum → Inspect entry points in 5 minutes.",
      link: "/docs",
      linkLabel: "View Onboarding Guide",
    },
    {
      title: "Tracing an API Handler Down to Persistence",
      icon: Database,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      flow: "Select POST /session → Trace UI form → Follow auth.ts:loginUser → Verify UserService.findUserByEmail.",
      link: "/demo",
      linkLabel: "Try in Demo Mode",
    },
    {
      title: "Safe Function Refactoring with Impact Scoring",
      icon: GitCompare,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      flow: "Simulate modifying auth.ts → Audit 1 caller, 2 callees, 1 test → Calculate blast radius before touching code.",
      link: "/change-impact",
      linkLabel: "Explore Change Impact",
    },
    {
      title: "Reviewing Complex Pull Request Diffs",
      icon: GitPullRequest,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      flow: "Load PR #101 → Diff analysis against repo AST → Surface security alerts and missing test suggestions.",
      link: "/code-review",
      linkLabel: "View Code Review Hub",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 scroll-mt-16">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Real-World Workflows
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-[var(--text-primary)]">
          How Developers Use CodeAtlas Daily
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Practical day-to-day scenarios where structural intelligence accelerates engineering.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {workflows.map((wf, idx) => {
          const Icon = wf.icon;
          return (
            <div
              key={idx}
              className="p-7 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${wf.bg} ${wf.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[var(--text-primary)]">
                    {wf.title}
                  </h3>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-secondary)] leading-relaxed">
                  {wf.flow}
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={wf.link}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
                >
                  <span>{wf.linkLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
