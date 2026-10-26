"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Code2,
  ShieldAlert,
  HelpCircle,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  FolderGit2,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AgentRun, AgentStep, ApprovalAction } from "@/types/agent";

interface AgentRunDetailViewProps {
  run: AgentRun;
  onApproveAction: (actionId: string) => Promise<void>;
  onRejectAction: (actionId: string, reason?: string) => Promise<void>;
  onControlCommand: (command: "pause" | "resume" | "cancel" | "retry") => Promise<void>;
  onDeleteRun: () => Promise<void>;
}

export function AgentRunDetailView({
  run,
  onApproveAction,
  onRejectAction,
  onControlCommand,
  onDeleteRun,
}: AgentRunDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"steps" | "plan" | "citations" | "findings" | "approval">("steps");
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  const pendingAction = run.actions.find((a) => a.status === "pending");

  const handleApprove = async (actionId: string) => {
    setActionLoading(true);
    try {
      await onApproveAction(actionId);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedActionId) return;
    setActionLoading(true);
    try {
      await onRejectAction(selectedActionId, rejectReason || "Rejected by developer");
      setShowRejectModal(false);
      setRejectReason("");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-lg">
      {/* Top Banner */}
      <div className="p-5 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4 bg-[var(--card-bg)]/80 backdrop-blur-md">
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--border-color)]/50 text-[var(--text-secondary)]">
              {run.id}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8B7CFF]">
              {run.agentType.replace("_", " ")}
            </span>
            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] font-mono ml-2">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>{run.repositoryName}</span>
            </div>
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {run.taskPrompt}
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {run.status === "running" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onControlCommand("pause")}
              className="flex items-center gap-1.5 text-xs text-yellow-400"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </Button>
          )}

          {run.status === "paused" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onControlCommand("resume")}
              className="flex items-center gap-1.5 text-xs"
            >
              <Play className="w-3.5 h-3.5" />
              Resume
            </Button>
          )}

          {(run.status === "failed" || run.status === "cancelled") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onControlCommand("retry")}
              className="flex items-center gap-1.5 text-xs text-[#29D3C2]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry Run
            </Button>
          )}

          {(run.status === "running" || run.status === "awaiting_approval") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onControlCommand("cancel")}
              className="flex items-center gap-1.5 text-xs text-red-400"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteRun}
            className="text-[var(--text-secondary)] hover:text-red-400 p-2"
            title="Delete Run"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Pending Approval Alert Banner */}
      {pendingAction && (
        <div className="px-5 py-3.5 bg-red-500/10 border-b border-red-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="text-sm font-semibold text-red-400">
                Action Requires Developer Authorization: {pendingAction.title}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {pendingAction.description} • Risk Level: <strong className="uppercase">{pendingAction.riskLevel}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="accent"
              size="sm"
              disabled={actionLoading}
              onClick={() => handleApprove(pendingAction.id)}
              className="flex items-center gap-1.5 text-xs bg-[#2FD6A0] text-[#070A12] hover:bg-[#28b889]"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
              Approve & Apply
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={() => {
                setSelectedActionId(pendingAction.id);
                setShowRejectModal(true);
              }}
              className="flex items-center gap-1.5 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              Reject
            </Button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-5 border-b border-[var(--border-color)] bg-[var(--card-bg)]/40 overflow-x-auto">
        <button
          onClick={() => setActiveTab("steps")}
          className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "steps"
              ? "border-[#8B7CFF] text-[#8B7CFF]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Execution Steps ({run.steps.length})
        </button>

        <button
          onClick={() => setActiveTab("plan")}
          className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "plan"
              ? "border-[#8B7CFF] text-[#8B7CFF]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Plan & Hypotheses ({run.hypotheses.length})
        </button>

        <button
          onClick={() => setActiveTab("citations")}
          className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "citations"
              ? "border-[#8B7CFF] text-[#8B7CFF]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Verified Citations ({run.citations.length})
        </button>

        <button
          onClick={() => setActiveTab("findings")}
          className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "findings"
              ? "border-[#8B7CFF] text-[#8B7CFF]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Findings ({run.findings.length})
        </button>

        <button
          onClick={() => setActiveTab("approval")}
          className={`py-3 px-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "approval"
              ? "border-[#8B7CFF] text-[#8B7CFF]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Proposed Changes & Diff ({run.actions.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* TAB 1: STEPS TIMELINE */}
        {activeTab === "steps" && (
          <div className="flex flex-col gap-4">
            {run.outcomeSummary && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#8B7CFF]/10 via-[#29D3C2]/10 to-transparent border border-[#8B7CFF]/20 text-xs">
                <div className="flex items-center gap-2 font-semibold text-[#8B7CFF] mb-1">
                  <Sparkles className="w-4 h-4" />
                  Outcome Summary
                </div>
                <p className="text-[var(--text-primary)] leading-relaxed">
                  {run.outcomeSummary}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {run.steps.map((step, idx) => {
                const isCurrent = idx === run.currentStepIndex && run.status === "running";
                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-xl border transition-all ${
                      step.status === "completed"
                        ? "bg-[var(--card-bg)] border-[var(--border-color)]"
                        : step.status === "running"
                        ? "bg-[#29D3C2]/5 border-[#29D3C2]/40 shadow-[0_0_15px_-5px_rgba(41,211,194,0.3)]"
                        : step.status === "awaiting_approval"
                        ? "bg-red-500/5 border-red-500/30"
                        : "bg-[var(--card-bg)]/40 border-[var(--border-color)]/60 opacity-70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[var(--border-color)]/50 text-xs font-mono font-bold flex items-center justify-center text-[var(--text-secondary)]">
                          {step.order}
                        </span>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                          {step.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {step.toolName && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--border-color)]/40 text-[var(--text-secondary)]">
                            tool: {step.toolName}
                          </span>
                        )}

                        {step.status === "completed" && (
                          <Badge variant="mint" className="text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed {step.durationMs ? `(${step.durationMs}ms)` : ""}
                          </Badge>
                        )}
                        {step.status === "running" && (
                          <Badge variant="cyan" className="text-[10px]">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Executing
                          </Badge>
                        )}
                        {step.status === "awaiting_approval" && (
                          <Badge variant="coral" className="text-[10px]">
                            <AlertTriangle className="w-3 h-3" />
                            Approval Gate
                          </Badge>
                        )}
                        {step.status === "pending" && (
                          <Badge variant="gray" className="text-[10px]">
                            Pending
                          </Badge>
                        )}
                        {step.status === "failed" && (
                          <Badge variant="coral" className="text-[10px]">
                            Failed
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] pl-8 mb-2">
                      {step.description}
                    </p>

                    {step.evidenceSummary && (
                      <div className="ml-8 p-2.5 rounded-lg bg-[var(--border-color)]/20 border border-[var(--border-color)]/40 text-xs font-mono text-[#29D3C2]">
                        ✓ {step.evidenceSummary}
                      </div>
                    )}

                    {step.error && (
                      <div className="ml-8 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400">
                        Error: {step.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PLAN & HYPOTHESES */}
        {activeTab === "plan" && (
          <div className="flex flex-col gap-5">
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]/60">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                Execution Plan & Safety Scope
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                {run.plan.approach}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--border-color)]/20 border border-[var(--border-color)]/40">
                  <span className="font-semibold text-[var(--text-primary)] block mb-1">Risk Assessment:</span>
                  <span className="text-[var(--text-secondary)]">{run.plan.riskAssessment}</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--border-color)]/20 border border-[var(--border-color)]/40">
                  <span className="font-semibold text-[var(--text-primary)] block mb-1">Registered Tools Required:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {run.plan.requiredTools.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-[var(--border-color)]/50 font-mono text-[11px] text-[var(--text-primary)]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                Ranked Root-Cause Hypotheses ({run.hypotheses.length})
              </h3>
              {run.hypotheses.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-xl">
                  No hypotheses formulated for this run type.
                </div>
              ) : (
                <div className="space-y-3">
                  {run.hypotheses.map((h, i) => (
                    <div key={h.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#8B7CFF]/20 text-[#8B7CFF] text-xs font-mono font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                            {h.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={h.likelihood === "high" ? "coral" : h.likelihood === "medium" ? "sun" : "gray"}>
                            Likelihood: {h.likelihood}
                          </Badge>
                          {h.isConfirmed && (
                            <Badge variant="mint">
                              <CheckCircle2 className="w-3 h-3" /> Confirmed
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] mb-3">
                        {h.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                        <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/20">
                          <span className="font-semibold text-green-400 block mb-1">Supporting Evidence:</span>
                          <ul className="list-disc pl-4 space-y-1 text-[var(--text-secondary)]">
                            {h.evidenceFor.map((e, idx) => (
                              <li key={idx}>{e}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/20">
                          <span className="font-semibold text-red-400 block mb-1">Counter Evidence:</span>
                          <ul className="list-disc pl-4 space-y-1 text-[var(--text-secondary)]">
                            {h.evidenceAgainst.length > 0 ? (
                              h.evidenceAgainst.map((e, idx) => <li key={idx}>{e}</li>)
                            ) : (
                              <li>None identified</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VERIFIED CITATIONS */}
        {activeTab === "citations" && (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#29D3C2]" />
              <span>
                Citations are verified against AST definitions and exact file line bounds in repository <strong>{run.repositoryName}</strong>.
              </span>
            </div>

            {run.citations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-xl">
                No citations captured yet.
              </div>
            ) : (
              <div className="space-y-4">
                {run.citations.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                    <div className="flex items-center justify-between gap-2 mb-2 font-mono text-xs">
                      <div className="flex items-center gap-2 text-[#29D3C2]">
                        <Code2 className="w-4 h-4" />
                        <span className="font-bold">{c.filePath}:{c.startLine}{c.endLine ? `-${c.endLine}` : ""}</span>
                        {c.symbolName && (
                          <span className="text-[#8B7CFF]">({c.symbolName})</span>
                        )}
                      </div>
                      {c.isVerified && (
                        <Badge variant="mint" className="text-[10px]">
                          ✓ Verified Source Bound
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] mb-2.5">
                      {c.reason}
                    </p>

                    <pre className="p-3 rounded-lg bg-[#070A12] border border-[var(--border-color)] text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                      {c.snippet}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FINDINGS */}
        {activeTab === "findings" && (
          <div className="flex flex-col gap-4">
            {run.findings.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-xl">
                No code review findings or defects identified for this run.
              </div>
            ) : (
              <div className="space-y-3">
                {run.findings.map((f) => (
                  <div key={f.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={f.severity === "critical" ? "coral" : f.severity === "warning" ? "sun" : "cyan"}>
                          {f.severity.toUpperCase()}
                        </Badge>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                          {f.title}
                        </h4>
                      </div>
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        {f.file}{f.line ? `:${f.line}` : ""}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] mb-2">
                      {f.description}
                    </p>

                    {f.codeSnippet && (
                      <pre className="p-2.5 rounded-lg bg-[#070A12] border border-[var(--border-color)] text-[11px] font-mono text-slate-300 mb-2 overflow-x-auto">
                        {f.codeSnippet}
                      </pre>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-[var(--border-color)]/20 text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)] block">Why it matters:</strong>
                        {f.whyItMatters}
                      </div>
                      {f.suggestedRemediation && (
                        <div className="p-2 rounded bg-[#29D3C2]/10 border border-[#29D3C2]/20 text-[#29D3C2]">
                          <strong className="block">Remediation:</strong>
                          {f.suggestedRemediation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROPOSED CHANGES & DIFF */}
        {activeTab === "approval" && (
          <div className="flex flex-col gap-4">
            {run.actions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-xl">
                No proposed mutating actions or patches for this run.
              </div>
            ) : (
              <div className="space-y-4">
                {run.actions.map((act) => (
                  <div key={act.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--text-primary)]">
                            {act.title}
                          </span>
                          <Badge variant={act.status === "approved" ? "mint" : act.status === "rejected" ? "coral" : "sun"}>
                            {act.status.toUpperCase()}
                          </Badge>
                          <Badge variant={act.riskLevel === "high" || act.riskLevel === "critical" ? "coral" : "gray"}>
                            Risk: {act.riskLevel}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {act.description}
                        </p>
                      </div>

                      {act.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="accent"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleApprove(act.id)}
                            className="bg-[#2FD6A0] text-[#070A12] text-xs hover:bg-[#28b889]"
                          >
                            Approve Action
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => {
                              setSelectedActionId(act.id);
                              setShowRejectModal(true);
                            }}
                            className="text-red-400 border-red-500/30 text-xs"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-[var(--text-secondary)] mb-2 font-mono">
                      Affected Files: <strong>{act.affectedFiles.join(", ")}</strong>
                    </div>

                    {act.diffPreview && (
                      <div>
                        <div className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                          Unified Diff Preview:
                        </div>
                        <pre className="p-3 rounded-lg bg-[#070A12] border border-[var(--border-color)] font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                          {act.diffPreview.split("\n").map((line, idx) => {
                            const isAdd = line.startsWith("+");
                            const isDel = line.startsWith("-");
                            return (
                              <div
                                key={idx}
                                className={isAdd ? "text-green-400 bg-green-500/10 px-1 -mx-1" : isDel ? "text-red-400 bg-red-500/10 px-1 -mx-1" : ""}
                              >
                                {line}
                              </div>
                            );
                          })}
                        </pre>
                      </div>
                    )}

                    {act.executionOutcome && (
                      <div className={`mt-3 p-2.5 rounded-lg text-xs font-mono border ${act.executionOutcome.success ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                        Outcome: {act.executionOutcome.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
              Reject Proposed Action
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Provide feedback on why this action was rejected. The agent will terminate this workflow without modifying any repository files.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Incompatible with upcoming session cookie migration."
              className="w-full h-24 p-3 rounded-xl bg-[#070A12] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none focus:border-red-400 mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                size="sm"
                disabled={actionLoading}
                onClick={handleRejectConfirm}
                className="bg-red-500 text-white hover:bg-red-600 text-xs"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
