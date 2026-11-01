"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { getStore } from "@/lib/demo/store";
import { CheckCircle2, Circle, Sparkles, ArrowRight } from "lucide-react";

interface ChecklistItem {
  id: number;
  key: string;
  title: string;
  desc: string;
  href: string;
}

const CHECKLIST_STEPS: ChecklistItem[] = [
  {
    id: 0,
    key: "connect_repo",
    title: "Connect a repository to index code",
    desc: "Index files, AST symbols, and parse cross-file call relationships.",
    href: "/repositories",
  },
  {
    id: 1,
    key: "explore_files",
    title: "Explore repository source files",
    desc: "Inspect file hierarchy, symbols, and syntax trees.",
    href: "/repositories/sample-project",
  },
  {
    id: 2,
    key: "ask_assistant",
    title: "Ask AI your first code question",
    desc: "Query code with verifiable citation proofs and line links.",
    href: "/assistant",
  },
  {
    id: 3,
    key: "inspect_architecture",
    title: "Inspect architecture call graph",
    desc: "Visualize multi-tier dependency topology and entrypoint flows.",
    href: "/architecture",
  },
  {
    id: 4,
    key: "review_pull_request",
    title: "Review PR security & quality findings",
    desc: "Audit pull requests, detect vulnerabilities, and assess test gaps.",
    href: "/code-review?repoId=sample-project&pr=101",
  },
];

export function GettingStartedChecklist() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();

  const storageKey = `codeatlas_checklist_${user?.id || "guest"}`;

  // Reactive store state
  const [storeData, setStoreData] = useState(() => {
    try {
      return getStore();
    } catch {
      return null;
    }
  });

  const [manuallyToggled, setManuallyToggled] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const handleUpdate = () => {
      try {
        setStoreData(getStore());
      } catch {}
    };

    if (typeof window !== "undefined") {
      window.addEventListener("codeatlas:repositories-changed", handleUpdate);
      window.addEventListener("codeatlas:workspace-changed", handleUpdate);
      return () => {
        window.removeEventListener("codeatlas:repositories-changed", handleUpdate);
        window.removeEventListener("codeatlas:workspace-changed", handleUpdate);
      };
    }
  }, []);

  // Load manual overrides from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setManuallyToggled(JSON.parse(saved));
      }
    } catch {}
  }, [storageKey]);

  // Compute auto-completion from real store state
  const autoCompleted = useMemo(() => {
    const state: Record<number, boolean> = {
      0: false,
      1: false,
      2: false,
      3: false,
      4: false,
    };

    if (storeData) {
      // Step 0: connected repos
      if (storeData.repositories && storeData.repositories.length > 0) {
        state[0] = true;
      }
      // Step 1: files explored or present in tree
      if (storeData.repositoryFiles && Object.keys(storeData.repositoryFiles).length > 0) {
        state[1] = true;
      }
      // Step 2: assistant asked or activities present
      const hasAssistantActivity = storeData.activities?.some(
        (a: any) =>
          a.type === "question_answered" ||
          a.type === "assistant" ||
          a.title?.toLowerCase().includes("assistant") ||
          a.title?.toLowerCase().includes("question")
      );
      if (hasAssistantActivity) {
        state[2] = true;
      }
      // Step 3: architecture topology viewed
      const hasArchActivity = storeData.activities?.some(
        (a: any) =>
          a.type === "architecture_explored" ||
          a.title?.toLowerCase().includes("architecture") ||
          a.title?.toLowerCase().includes("graph")
      );
      if (hasArchActivity) {
        state[3] = true;
      }
      // Step 4: review completed or session present
      if (storeData.reviewSessions && Object.keys(storeData.reviewSessions).length > 0) {
        state[4] = true;
      }
    }

    return state;
  }, [storeData]);

  // Effective completion status merges auto-detection with manual user toggle
  const isStepCompleted = (id: number): boolean => {
    if (typeof manuallyToggled[id] === "boolean") {
      return manuallyToggled[id];
    }
    return Boolean(autoCompleted[id]);
  };

  const toggleStep = (id: number) => {
    const currentStatus = isStepCompleted(id);
    const updated = {
      ...manuallyToggled,
      [id]: !currentStatus,
    };
    setManuallyToggled(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  const completedCount = CHECKLIST_STEPS.filter((s) => isStepCompleted(s.id)).length;
  const totalSteps = CHECKLIST_STEPS.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

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
                {completedCount} of {totalSteps} onboarding tasks completed.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-md border border-[var(--primary)]/20">
            {progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-[var(--border-color)]/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#7C5CFC] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="mt-4 space-y-2">
          {CHECKLIST_STEPS.map((step) => {
            const isCompleted = isStepCompleted(step.id);
            return (
              <div
                key={step.id}
                className={`p-3 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 ${
                  isCompleted
                    ? isDark
                      ? "bg-[#111726]/30 border-[#242B39]/50 opacity-85"
                      : "bg-[#F9FAFB]/70 border-[#E8E5F4]/60 opacity-85"
                    : isDark
                    ? "bg-[#111726]/70 border-[#242B39] hover:border-[var(--primary)]/40"
                    : "bg-white border-[#E8E5F4] hover:border-[var(--primary)]/40 shadow-2xs"
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
                  aria-label={`Start task: ${step.title}`}
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
