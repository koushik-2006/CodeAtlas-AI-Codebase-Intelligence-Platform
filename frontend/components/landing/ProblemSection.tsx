"use client";

import { AlertCircle, Clock, ShieldAlert, FileQuestion } from "lucide-react";

export function ProblemSection() {
  const problems = [
    {
      icon: Clock,
      title: "The 100k-LOC Cold Start",
      desc: "New hires and contractors waste days mentally parsing sprawling codebases, deciphering folder structures and finding application entry points.",
      tag: "Onboarding Friction",
      accent: "text-purple-600 dark:text-purple-400",
      accentBg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      icon: ShieldAlert,
      title: "Silent Regressions in PRs",
      desc: "A small change in a utility function silently breaks downstream services or untested endpoints because the team lacks a holistic blast-radius map.",
      tag: "Hidden Dependencies",
      accent: "text-rose-600 dark:text-rose-400",
      accentBg: "bg-rose-500/10 border-rose-500/20",
    },
    {
      icon: FileQuestion,
      title: "Hallucinating AI Assistants",
      desc: "Generic AI chatbots confidently reference functions that do not exist and invent hallucinated line numbers with zero verifiable evidence.",
      tag: "Unverified Answers",
      accent: "text-amber-600 dark:text-amber-400",
      accentBg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: AlertCircle,
      title: "Architectural Blind Spots",
      desc: "Circular dependencies, high coupling, and orphaned service methods compound silently over time without structural health auditing.",
      tag: "Technical Debt",
      accent: "text-cyan-600 dark:text-cyan-400",
      accentBg: "bg-cyan-500/10 border-cyan-500/20",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 scroll-mt-20">
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3.5 py-1.5 font-mono text-xs font-bold text-[var(--primary)] shadow-xs">
          <span>THE CODEBASE INTELLIGENCE GAP</span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-[var(--text-primary)]">
          Why Modern Software Development Still Feels Slow
        </h2>
        <p className="text-base text-[var(--text-secondary)] max-w-2xl mx-auto">
          Reading and understanding unfamiliar code consumes up to 70% of an engineer&apos;s time. CodeAtlas removes the guesswork with deterministic AST mapping.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {problems.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-xs hover:shadow-md hover:border-[var(--primary)]/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-2xl border ${p.accentBg} ${p.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] uppercase font-bold text-[var(--text-secondary)] bg-[var(--bg-page)] px-2.5 py-1 rounded-md border border-[var(--border-color)]">
                    {p.tag}
                  </span>
                </div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                  {p.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
