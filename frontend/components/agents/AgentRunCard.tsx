"use client";

import React from "react";
import {
  Search,
  Bug,
  ShieldAlert,
  Sparkles,
  FlaskConical,
  BookOpen,
  ArrowUpCircle,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  Play,
  RotateCcw,
  XCircle,
  ExternalLink,
  FolderGit2,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AgentRun, AgentType, AgentRunStatus } from "@/types/agent";

interface AgentRunCardProps {
  run: AgentRun;
  isSelected: boolean;
  onSelect: () => void;
  onPause?: (runId: string) => void;
  onResume?: (runId: string) => void;
  onCancel?: (runId: string) => void;
  onRetry?: (runId: string) => void;
}

export function AgentRunCard({
  run,
  isSelected,
  onSelect,
  onPause,
  onResume,
  onCancel,
  onRetry,
}: AgentRunCardProps) {
  const getTemplateIcon = (templateId?: string, agentType?: AgentType) => {
    switch (templateId) {
      case "fix_bug":
        return <Bug className="w-4 h-4 text-[#FF7A70]" />;
      case "unit_tests":
        return <FlaskConical className="w-4 h-4 text-[#7C5CFC]" />;
      case "documentation":
        return <BookOpen className="w-4 h-4 text-[#3B82F6]" />;
      case "security_audit":
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case "upgrade_dependency":
        return <ArrowUpCircle className="w-4 h-4 text-emerald-500" />;
      case "refactor_function":
        return <Sparkles className="w-4 h-4 text-[#2FD6A0]" />;
      case "explain_module":
        return <Layers className="w-4 h-4 text-indigo-500" />;
      default:
        return <BotIcon type={agentType} />;
    }
  };

  const getStatusBadge = (status: AgentRunStatus) => {
    switch (status) {
      case "running":
        return (
          <Badge variant="cyan" className="flex items-center gap-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#29D3C2] animate-ping" />
            Running
          </Badge>
        );
      case "awaiting_approval":
        return (
          <Badge variant="coral" className="flex items-center gap-1 text-[11px]">
            <AlertTriangle className="w-3 h-3" />
            Needs Approval
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="mint" className="flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="sun" className="flex items-center gap-1 text-[11px]">
            <PauseCircle className="w-3 h-3" />
            Paused
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="coral" className="flex items-center gap-1 text-[11px]">
            <XCircle className="w-3 h-3" />
            Failed
          </Badge>
        );
      case "cancelled":
        return <Badge variant="gray" className="text-[11px]">Cancelled</Badge>;
      default:
        return <Badge variant="gray" className="text-[11px]">{status}</Badge>;
    }
  };

  const steps = run.steps || [];
  const currentStep = steps[run.currentStepIndex] || steps[0];
  const progressPercent = Math.min(100, Math.round(((run.currentStepIndex + (run.status === "completed" ? 1 : 0)) / 7) * 100));

  const formatElapsed = () => {
    if (run.durationSeconds) {
      if (run.durationSeconds < 60) return `${run.durationSeconds}s`;
      const mins = Math.floor(run.durationSeconds / 60);
      const secs = run.durationSeconds % 60;
      return `${mins}m ${secs}s`;
    }
    return "12s";
  };

  const isRunning = run.status === "running";
  const isPaused = run.status === "paused";
  const isWaitingApproval = run.status === "awaiting_approval";
  const isFailed = run.status === "failed";
  const isCancellable = isRunning || isPaused || isWaitingApproval;

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
        isSelected
          ? "bg-white dark:bg-[#121624] border-[#7C5CFC] shadow-md ring-1 ring-[#7C5CFC]/30"
          : "bg-white dark:bg-[#0D111A] border-[#EAE6FD] dark:border-[#1E2638] hover:border-[#7C5CFC]/50 hover:shadow-xs"
      }`}
    >
      {/* Header: Template, Title & Status */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F7F5FE] dark:bg-[#1A1F30] border border-[#EAE6FD] dark:border-[#242B3D] flex items-center justify-center shrink-0">
            {getTemplateIcon(run.templateId, run.agentType)}
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7C5CFC] block">
              {run.templateName || run.agentType?.replace("_", " ")}
            </span>
          </div>
        </div>
        <div>{getStatusBadge(run.status)}</div>
      </div>

      {/* Title */}
      <h3 className="text-xs sm:text-sm font-bold text-[#19143D] dark:text-[#F3F5FA] line-clamp-2 mb-2 leading-snug">
        {run.title || run.taskPrompt}
      </h3>

      {isFailed && run.errorDetails && (
        <div className="mb-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-[11px] text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{run.errorDetails}</span>
        </div>
      )}

      {/* Progress Bar & Current Step */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#6E6A8A] dark:text-[#8E95A8] truncate max-w-[200px]">
            {isWaitingApproval
              ? "Step 6/7: Waiting for approval"
              : run.status === "completed"
              ? "Completed (7/7 steps)"
              : `Step ${run.currentStepIndex + 1}/7: ${currentStep?.title || "Processing"}`}
          </span>
          <span className="font-bold text-[#7C5CFC]">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[#EAE6FD] dark:bg-[#1E2638] overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              run.status === "completed"
                ? "bg-emerald-500"
                : isFailed
                ? "bg-red-500"
                : isWaitingApproval
                ? "bg-amber-500"
                : "bg-[#7C5CFC]"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Metadata Row: Repo, Started By, Elapsed Time */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#6E6A8A] dark:text-[#8E95A8] font-mono pt-2 border-t border-[#EAE6FD] dark:border-[#1E2638] gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <FolderGit2 className="w-3 h-3 text-[#7C5CFC]" />
            <span className="truncate max-w-[100px]">{run.repositoryName || run.repositoryId}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[80px]">{run.startedBy?.name || "Alex Chen"}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatElapsed()}</span>
        </div>
      </div>

      {/* Run Action Controls: Open / Pause / Resume / Cancel / Retry */}
      <div
        className="flex items-center justify-between pt-3 mt-3 border-t border-[#EAE6FD] dark:border-[#1E2638] gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onSelect}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#7C5CFC]/10 hover:bg-[#7C5CFC]/20 text-[#7C5CFC] text-[11px] font-semibold transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Open</span>
        </button>

        <div className="flex items-center gap-1">
          {isRunning && onPause && (
            <button
              onClick={() => onPause(run.id)}
              className="px-2 py-1 rounded-lg border border-[#EAE6FD] dark:border-[#242B3D] text-[11px] text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#19143D] dark:hover:text-[#F3F5FA] hover:bg-neutral-100 dark:hover:bg-[#1A1F30] cursor-pointer"
              title="Pause execution"
            >
              Pause
            </button>
          )}

          {isPaused && onResume && (
            <button
              onClick={() => onResume(run.id)}
              className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 cursor-pointer"
              title="Resume execution"
            >
              Resume
            </button>
          )}

          {isFailed && onRetry && (
            <button
              onClick={() => onRetry(run.id)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#7C5CFC] text-white text-[11px] font-semibold hover:bg-[#6A4BE8] cursor-pointer"
              title="Retry run"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}

          {isCancellable && onCancel && (
            <button
              onClick={() => onCancel(run.id)}
              className="px-2 py-1 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-[11px] cursor-pointer"
              title="Cancel run"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function BotIcon({ type }: { type?: AgentType }) {
  switch (type) {
    case "debugging":
      return <Bug className="w-4 h-4 text-[#FF7A70]" />;
    case "code_review":
      return <ShieldAlert className="w-4 h-4 text-[#8B7CFF]" />;
    case "refactoring":
      return <Sparkles className="w-4 h-4 text-[#2FD6A0]" />;
    case "test_generation":
      return <FlaskConical className="w-4 h-4 text-[#F3C969]" />;
    case "documentation":
      return <BookOpen className="w-4 h-4 text-[#8B7CFF]" />;
    default:
      return <Search className="w-4 h-4 text-[#29D3C2]" />;
  }
}
