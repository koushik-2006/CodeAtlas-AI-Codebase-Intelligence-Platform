"use client";

import { useTheme } from "@/hooks/useTheme";
import { RepositoryLearningPath, LearningPathStep } from "@/types/learning-path";
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  Circle,
  FileCode,
  ArrowRight,
  BookOpen,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface LearningPathViewProps {
  learningPath: RepositoryLearningPath;
  onToggleStep: (stepId: string) => void;
  onNavigateFile: (file: string, line?: number) => void;
}

export function LearningPathView({
  learningPath,
  onToggleStep,
  onNavigateFile,
}: LearningPathViewProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header & Progress Card */}
      <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <GraduationCap className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
                {learningPath.title}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {learningPath.summary}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Clock className="w-4 h-4 text-[var(--primary)]" />
              <span>
                <strong className="text-[var(--text-primary)]">{learningPath.completedMinutes}</strong> / {learningPath.totalEstimatedMinutes} mins
              </span>
            </div>
            <div className="font-bold text-[var(--primary)]">
              {learningPath.progressPercentage}% Done
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-[var(--border-color)]/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] via-purple-500 to-green-500 transition-all duration-300 rounded-full"
            style={{ width: `${learningPath.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Curriculum Milestone Cards */}
      <div className="space-y-3.5">
        {learningPath.steps.map((step) => (
          <div
            key={step.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
              step.completed
                ? "border-green-500/20 bg-green-500/5"
                : "border-[var(--border-color)] bg-[var(--bg-surface)] hover:border-[var(--primary)] shadow-sm"
            }`}
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onToggleStep(step.id)}
                  className="p-1 text-[var(--text-secondary)] hover:text-green-500 transition-colors"
                  title={step.completed ? "Mark Incomplete" : "Mark Complete"}
                >
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-[var(--border-color)] hover:text-[var(--primary)]" />
                  )}
                </button>

                <h3 className={`text-sm font-extrabold ${step.completed ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
                  {step.title}
                </h3>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[var(--primary)]/10 text-[var(--primary)]">
                  ~{step.estimatedMinutes} mins
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-8">
                {step.description}
              </p>

              {/* Key Takeaway Box */}
              <div className="ml-8 p-3 rounded-xl bg-[var(--bg-page)]/50 border border-[var(--border-color)] text-xs space-y-1">
                <div className="text-[11px] font-bold text-[var(--primary)]">Key Architectural Insight:</div>
                <div className="text-[var(--text-primary)] text-xs">{step.keyTakeaway}</div>
              </div>
            </div>

            {/* Suggested Action & Navigation Button */}
            <div className="sm:self-center shrink-0 pl-8 sm:pl-0">
              <button
                type="button"
                onClick={() => onNavigateFile(step.file, step.line)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--border-color)] bg-[var(--bg-page)] text-[var(--primary)] hover:border-[var(--primary)] hover:underline transition-colors"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{step.file}{step.line ? `:${step.line}` : ""}</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
