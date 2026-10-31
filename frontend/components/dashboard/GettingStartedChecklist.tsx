"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, Circle, Sparkles, ArrowRight, CheckCheck } from "lucide-react";

const CHECKLIST_STEPS = [
  { id: 0, title: "Connect a repository to index code", href: "/repositories", desc: "Index files, AST symbols, and functions." },
  { id: 1, title: "Explore repository source files", href: "/repositories/sample-project", desc: "Inspect file hierarchy and symbol definitions." },
  { id: 2, title: "Ask AI your first code question", href: "/assistant", desc: "Query code with verifiable citation proofs." },
  { id: 3, title: "Inspect architecture call graph", href: "/architecture", desc: "Visualize components and service boundaries." },
];

export function GettingStartedChecklist() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);

  const storageKey = `codeatlas_checklist_${user?.id || "guest"}`;

  // Load persisted progress from localStorage per user
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCompletedSteps(parsed);
          return;
        }
      }
      setCompletedSteps([0]);
    } catch {
      setCompletedSteps([0]);
    }
  }, [storageKey]);

  const toggleStep = (index: number) => {
    setCompletedSteps((prev) => {
      const next = prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const totalSteps = CHECKLIST_STEPS.length;
  const progressPercent = Math.round((completedSteps.length / totalSteps) * 100);

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 h-full ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4] shadow-sm"
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Getting Started
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {completedSteps.length} of {totalSteps} onboarding tasks completed.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-md">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-[var(--border-color)]/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="mt-4 space-y-2">
          {CHECKLIST_STEPS.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            return (
              <div
                key={step.id}
                className={`p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                  isCompleted
                    ? isDark
                      ? "bg-[#111726]/30 border-[#242B39]/50 opacity-80"
                      : "bg-[#F9FAFB]/70 border-[#E8E5F4]/60 opacity-80"
                    : isDark
                    ? "bg-[#111726]/70 border-[#242B39] hover:border-[var(--primary)]/40"
                    : "bg-white border-[#E8E5F4] hover:border-[var(--primary)]/40 shadow-xs"
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleStep(step.id)}
                    className="mt-0.5 shrink-0 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
                    aria-label={isCompleted ? `Mark "${step.title}" as incomplete` : `Mark "${step.title}" as complete`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-[var(--text-secondary)] hover:text-[var(--primary)]" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-bold truncate ${
                        isCompleted
                          ? "line-through text-[var(--text-secondary)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <Link
                  href={step.href}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors shrink-0 inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                >
                  <span>Start</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
