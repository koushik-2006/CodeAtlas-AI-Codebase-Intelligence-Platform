"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { CheckCircle2, Circle, Sparkles, ArrowRight } from "lucide-react";

const CHECKLIST_STEPS = [
  { id: 0, title: "Connect a repository or start with a code snippet", href: "/repositories" },
  { id: 1, title: "Explore your source files", href: "/repositories/my-project" },
  { id: 2, title: "Ask your first question", href: "/assistant" },
  { id: 3, title: "Inspect your architecture graph", href: "/architecture" },
];

export function GettingStartedChecklist() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);

  // Load persisted progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("codeatlas-checklist-progress");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCompletedSteps(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => {
      const next = prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index];
      try {
        localStorage.setItem("codeatlas-checklist-progress", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const totalSteps = CHECKLIST_STEPS.length;
  const progressPercent = Math.round((completedSteps.length / totalSteps) * 100);

  return (
    <section
      className={`rounded-3xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-sm"
      }`}
    >
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Getting started
            </h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Follow these recommended steps to map and understand your codebase.
            </p>
          </div>
          <span className="font-mono text-xs sm:text-sm font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-full border border-[var(--primary)]/20 shrink-0">
            {completedSteps.length} / {totalSteps}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="my-5">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] mb-1.5">
            <span>Onboarding Progress</span>
            <span className="font-bold text-[var(--text-primary)]">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--border-color)]/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDark ? "bg-[#29D3C2]" : "bg-[#6C4DFF]"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 4 Required Steps */}
        <ul className="space-y-3">
          {CHECKLIST_STEPS.map((s) => {
            const isChecked = completedSteps.includes(s.id);
            return (
              <li
                key={s.id}
                className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  isChecked
                    ? isDark
                      ? "bg-[#0D1117]/80 border-[#30363D] text-[#E6EDF3]"
                      : "bg-[#FAF9FF] border-[#E8E5F4] text-[#1E2022]"
                    : isDark
                    ? "bg-[#0D1117]/40 border-[#30363D]/60 text-[#8B949E]"
                    : "bg-white border-[#E5E5E0] text-[#5A5C5E]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleStep(s.id)}
                  aria-label={`Toggle step ${s.title}`}
                  className="flex items-center gap-3 text-left flex-1 min-w-0 mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-lg"
                >
                  {isChecked ? (
                    <CheckCircle2
                      className={`w-5 h-5 shrink-0 ${
                        isDark ? "text-[#29D3C2]" : "text-[#6C4DFF]"
                      }`}
                    />
                  ) : (
                    <Circle className="w-5 h-5 shrink-0 text-[var(--text-secondary)]/50" />
                  )}
                  <span
                    className={`text-xs sm:text-sm font-semibold truncate ${
                      isChecked ? "line-through opacity-75" : ""
                    }`}
                  >
                    {s.title}
                  </span>
                </button>

                <Link
                  href={s.href}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline shrink-0"
                >
                  Start
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6 rounded-2xl p-3.5 bg-[var(--bg-page)] border border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
          <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span>Evidence-Based Reasoning</span>
        </div>
        <p className="mt-1 text-[11px] text-[var(--text-secondary)] leading-relaxed">
          Every answer produced by CodeAtlas is linked to concrete line ranges and AST nodes in your source repository.
        </p>
      </div>
    </section>
  );
}
