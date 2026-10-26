"use client";

import { useTheme } from "@/hooks/useTheme";
import { AlertCircle, Clock, ShieldAlert, FileQuestion } from "lucide-react";

export function ProblemSection() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const problems = [
    {
      icon: Clock,
      title: "The 100k-LOC Cold Start",
      desc: "New hires and contractors waste days mentally parsing sprawling codebases, deciphering folder structures and finding application entry points.",
      tag: "Onboarding Friction",
    },
    {
      icon: ShieldAlert,
      title: "Silent Regressions in PRs",
      desc: "A small change in a utility function silently breaks downstream services or untested endpoints because the team lacks a holistic blast-radius map.",
      tag: "Hidden Dependencies",
    },
    {
      icon: FileQuestion,
      title: "Hallucinating AI Assistants",
      desc: "Generic AI chatbots confidently reference functions that do not exist and invent hallucinated line numbers with zero verifiable evidence.",
      tag: "Unverified Answers",
    },
    {
      icon: AlertCircle,
      title: "Architectural Blind Spots",
      desc: "Circular dependencies, high coupling, and orphaned service methods compound silently over time without structural health auditing.",
      tag: "Technical Debt",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 scroll-mt-16">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          The Problem
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-[var(--text-primary)]">
          Why Modern Software Development Still Feels Slow
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Reading and understanding code takes up to 70% of an engineer&apos;s time. CodeAtlas removes the guesswork.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {problems.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] uppercase font-bold text-[var(--text-secondary)] bg-[var(--bg-page)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">
                    {p.tag}
                  </span>
                </div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  {p.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
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
