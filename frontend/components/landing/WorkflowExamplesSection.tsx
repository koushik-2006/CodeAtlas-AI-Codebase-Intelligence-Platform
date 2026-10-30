"use client";

import Link from "next/link";
import { Compass, Database, GitCompare, GitPullRequest, ArrowRight } from "lucide-react";

export function WorkflowExamplesSection() {
  const workflows = [
    {
      title: "Onboarding into a 50k-Line Monorepo",
      icon: Compass,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      flow: "Connect repo → Generate Knowledge Report → Follow 6-step curriculum → Inspect entry points in 5 minutes.",
      link: "/docs",
      linkLabel: "View Onboarding Guide",
    },
    {
      title: "Tracing an API Handler Down to Persistence",
      icon: Database,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      flow: "Select POST /session → Trace UI form → Follow auth.ts:loginUser → Verify UserService.findUserByEmail.",
      link: "/demo",
      linkLabel: "Try in Demo Mode",
    },
    {
      title: "Safe Function Refactoring with Impact Scoring",
      icon: GitCompare,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      flow: "Simulate modifying auth.ts → Audit 1 caller, 2 callees, 1 test → Calculate blast radius before touching code.",
      link: "/login",
      linkLabel: "Explore Change Impact",
    },
    {
      title: "Reviewing Complex Pull Request Diffs",
      icon: GitPullRequest,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      flow: "Load PR diff → AST diff analysis against repo call tree → Surface security alerts and missing test suggestions.",
      link: "/login",
      linkLabel: "Explore Code Review Hub",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 scroll-mt-20">
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3.5 py-1.5 font-mono text-xs font-bold text-[var(--primary)] shadow-xs">
          <span>PRACTICAL SCENARIOS</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-[var(--text-primary)]">
          How Developers Use CodeAtlas Daily
        </h2>
        <p className="text-base text-[var(--text-secondary)] max-w-2xl mx-auto">
          Practical day-to-day engineering workflows accelerated by structural AST intelligence.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {workflows.map((wf, idx) => {
          const Icon = wf.icon;
          return (
            <div
              key={idx}
              className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-7 sm:p-8 shadow-xs hover:shadow-md hover:border-[var(--primary)]/40 transition-all duration-300 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl border ${wf.bg} ${wf.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[var(--text-primary)]">
                    {wf.title}
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-page)]/80 border border-[var(--border-color)] font-mono text-xs text-[var(--text-secondary)] leading-relaxed">
                  {wf.flow}
                </div>
              </div>

              <div>
                <Link
                  href={wf.link}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded py-0.5"
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
