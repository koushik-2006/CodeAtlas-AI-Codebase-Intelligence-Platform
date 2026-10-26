"use client";

import React from "react";
import {
  Search,
  Bug,
  ShieldAlert,
  Sparkles,
  FlaskConical,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  XCircle,
  ArrowRight,
  FolderGit2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AgentRun, AgentType, AgentRunStatus } from "@/types/agent";

interface AgentRunCardProps {
  run: AgentRun;
  isSelected: boolean;
  onSelect: () => void;
}

export function AgentRunCard({ run, isSelected, onSelect }: AgentRunCardProps) {
  const getAgentIcon = (type: AgentType) => {
    switch (type) {
      case "codebase_research":
        return <Search className="w-4 h-4 text-[#29D3C2]" />;
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
    }
  };

  const getStatusBadge = (status: AgentRunStatus) => {
    switch (status) {
      case "running":
        return (
          <Badge variant="cyan" className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#29D3C2] animate-ping" />
            Running
          </Badge>
        );
      case "awaiting_approval":
        return (
          <Badge variant="coral" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Awaiting Approval
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="mint" className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="sun" className="flex items-center gap-1">
            <PauseCircle className="w-3 h-3" />
            Paused
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="coral" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Failed
          </Badge>
        );
      case "cancelled":
        return <Badge variant="gray">Cancelled</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const completedStepsCount = run.steps.filter((s) => s.status === "completed").length;
  const hasPendingApproval = run.actions.some((a) => a.status === "pending");

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
        isSelected
          ? "bg-[var(--card-bg)] border-[#8B7CFF] shadow-[0_0_20px_-5px_rgba(139,124,255,0.25)]"
          : "bg-[var(--card-bg)]/60 border-[var(--border-color)] hover:border-[#8B7CFF]/50 hover:bg-[var(--card-bg)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--border-color)]/30 border border-[var(--border-color)] flex items-center justify-center">
            {getAgentIcon(run.agentType)}
          </div>
          <span className="text-xs font-semibold capitalize text-[var(--text-primary)]">
            {run.agentType.replace("_", " ")}
          </span>
        </div>
        {getStatusBadge(run.status)}
      </div>

      <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 mb-2.5">
        {run.taskPrompt}
      </h3>

      {hasPendingApproval && (
        <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <span className="font-medium">Developer Approval Required</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono pt-2 border-t border-[var(--border-color)]/60">
        <div className="flex items-center gap-1.5">
          <FolderGit2 className="w-3 h-3 text-[var(--text-secondary)]" />
          <span className="truncate max-w-[120px]">{run.repositoryName}</span>
        </div>

        <div className="flex items-center gap-2">
          <span>{completedStepsCount}/{run.steps.length} steps</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(run.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}
