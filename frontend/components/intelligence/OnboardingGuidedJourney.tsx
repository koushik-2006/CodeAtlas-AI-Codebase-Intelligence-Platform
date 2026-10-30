"use client";

import { useTheme } from "@/hooks/useTheme";
import { OnboardingJourneyData, OnboardingStepItem } from "@/types/onboarding";
import {
  Compass,
  CheckCircle2,
  Circle,
  ArrowRight,
  FolderTree,
  LogIn,
  ShieldCheck,
  GitFork,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface OnboardingGuidedJourneyProps {
  journey: OnboardingJourneyData;
  onCompleteStep: (stepId: string) => void;
  onNavigateAction: (url: string) => void;
}

export function OnboardingGuidedJourney({
  journey,
  onCompleteStep,
  onNavigateAction,
}: OnboardingGuidedJourneyProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case "FolderTree":
        return <FolderTree className="w-4 h-4 text-[var(--primary)]" />;
      case "LogIn":
        return <LogIn className="w-4 h-4 text-amber-500" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-4 h-4 text-green-500" />;
      case "GitFork":
        return <GitFork className="w-4 h-4 text-cyan-500" />;
      case "CheckCircle2":
        return <CheckCircle2 className="w-4 h-4 text-purple-500" />;
      case "Sparkles":
      default:
        return <Sparkles className="w-4 h-4 text-[var(--primary)]" />;
    }
  };

  const progressPercentage = Math.round((journey.completedCount / journey.totalSteps) * 100);

  return (
    <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-6">
      {/* Onboarding Header & Progress Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                Smart Codebase Onboarding Journey
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Guided 6-step curriculum to master architecture, entry points, and test suites.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                {journey.completedCount} of {journey.totalSteps} Completed
              </span>
              <span className="text-xs font-mono text-[var(--primary)] ml-1 font-bold">
                ({progressPercentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-[var(--border-color)]/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-cyan-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {journey.steps.map((step) => (
          <div
            key={step.id}
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
              step.isCompleted
                ? "border-green-500/20 bg-green-500/5"
                : "border-[var(--border-color)] bg-[var(--bg-page)]/40 hover:border-[var(--primary)]"
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
                    {getStepIcon(step.actionIcon)}
                  </div>
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {step.title}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onCompleteStep(step.id)}
                  className="shrink-0 p-1 text-[var(--text-secondary)] hover:text-green-500 transition-colors"
                  title={step.isCompleted ? "Mark Incomplete" : "Mark Complete"}
                >
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-[var(--border-color)] hover:text-[var(--primary)]" />
                  )}
                </button>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {step.description}
              </p>

              <div className="text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border-color)]">
                <span className="text-[var(--primary)] font-bold">Evidence: </span>
                {step.evidence}
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onNavigateAction(step.targetUrl)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
              >
                <span>{step.targetLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {step.isCompleted && (
                <span className="text-[10px] font-mono font-bold text-green-500 uppercase">
                  Completed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
