"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  FolderGit2,
  FileCode,
  ShieldCheck,
  Check,
  Copy,
  Send,
  ExternalLink,
  ChevronRight,
  GitPullRequest,
  Split,
  List,
  Terminal,
  FileDiff,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AgentRun, AgentStep, AgentLogLine } from "@/types/agent";
import { synthesizeDiff } from "@/lib/demo/agent-engine";
import Link from "next/link";

interface AgentRunDetailViewProps {
  run: AgentRun;
  onApproveAndApply: () => Promise<void>;
  onRequestChanges: (feedback: string) => Promise<void>;
  onReject: () => Promise<void>;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onAskAgent: (question: string) => Promise<void>;
  onBackToList?: () => void;
}

export function AgentRunDetailView({
  run,
  onApproveAndApply,
  onRequestChanges,
  onReject,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onAskAgent,
  onBackToList,
}: AgentRunDetailViewProps) {
  const [centerTab, setCenterTab] = useState<"diff" | "plan" | "logs">("diff");
  const [diffViewMode, setDiffViewMode] = useState<"inline" | "split">("inline");
  const [copiedLog, setCopiedLog] = useState(false);
  const [copiedDiff, setCopiedDiff] = useState(false);

  // Ask agent follow-up state
  const [followUpText, setFollowUpText] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Request changes feedback state
  const [isRequestChangesOpen, setIsRequestChangesOpen] = useState(false);
  const [changesFeedback, setChangesFeedback] = useState("Add an extra test verifying that invalid email syntax throws an error.");
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Reject confirmation modal
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (centerTab === "logs" && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [run.logs, centerTab]);

  const handleCopyLogs = () => {
    const text = (run.logs || []).map((l) => `[${l.timestamp}] ${l.level.toUpperCase()}: ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const handleCopyDiff = () => {
    if (currentDiff?.patch) {
      navigator.clipboard.writeText(currentDiff.patch);
      setCopiedDiff(true);
      setTimeout(() => setCopiedDiff(false), 2000);
    }
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isAsking) return;
    const q = followUpText.trim();
    setFollowUpText("");
    setIsAsking(true);
    try {
      await onAskAgent(q);
      setCenterTab("logs");
    } finally {
      setIsAsking(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!changesFeedback.trim() || isRegenerating) return;
    setIsRegenerating(true);
    try {
      await onRequestChanges(changesFeedback.trim());
      setIsRequestChangesOpen(false);
      setCenterTab("diff");
    } finally {
      setIsRegenerating(false);
    }
  };

  const isWaitingApproval = run.status === "awaiting_approval";
  const isRunning = run.status === "running";
  const isPaused = run.status === "paused";
  const isCompleted = run.status === "completed";
  const isFailed = run.status === "failed";
  const isCancelled = run.status === "cancelled";

  const currentDiff =
    run.diff ||
    (run.currentStepIndex >= 3 || isWaitingApproval || isCompleted
      ? synthesizeDiff(run.templateId || "unit_tests", run.target || "src/services/auth.ts", undefined, run.instructions || "")
      : null);

  return (
    <div className="bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl shadow-sm overflow-hidden flex flex-col h-full animate-fade-in">
      {/* Top Breadcrumb & Status Header */}
      <div className="p-4 sm:p-5 border-b border-[#EAE6FD] dark:border-[#1E2638] flex flex-wrap items-center justify-between gap-3 bg-[#F7F5FE]/50 dark:bg-[#121624]/50">
        <div className="flex items-center gap-2.5">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="px-2.5 py-1 text-xs font-semibold text-[#7C5CFC] hover:underline cursor-pointer"
            >
              ← All Runs
            </button>
          )}
          <span className="text-[#8E95A8] text-xs font-mono">/</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-[#1A1F30] text-[#6E6A8A] dark:text-[#8E95A8] border border-[#EAE6FD] dark:border-[#242B3D]">
            {run.id}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-[#19143D] dark:text-[#F3F5FA] truncate max-w-[320px] sm:max-w-md">
            {run.title || run.taskPrompt}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isWaitingApproval && (
            <Badge variant="coral" className="flex items-center gap-1.5 text-xs animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Waiting for Approval</span>
            </Badge>
          )}
          {isRunning && (
            <Badge variant="cyan" className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#29D3C2] animate-ping" />
              <span>Step {run.currentStepIndex + 1}/7 Running</span>
            </Badge>
          )}
          {isCompleted && (
            <Badge variant="mint" className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </Badge>
          )}
          {isPaused && (
            <Badge variant="sun" className="flex items-center gap-1.5 text-xs">
              <Pause className="w-3.5 h-3.5" />
              <span>Paused</span>
            </Badge>
          )}
          {isFailed && (
            <Badge variant="coral" className="flex items-center gap-1.5 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Failed</span>
            </Badge>
          )}
          {isCancelled && (
            <Badge variant="coral" className="flex items-center gap-1.5 text-xs">
              <X className="w-3.5 h-3.5" />
              <span>Cancelled</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Main 3-Column Layout: Left (Timeline), Center (Diff/Plan/Logs), Right (Info & Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[#EAE6FD] dark:divide-[#1E2638]">
        {/* LEFT COLUMN: 7-Step Pipeline Timeline */}
        <div className="lg:col-span-3 p-4 sm:p-5 overflow-y-auto max-h-[300px] lg:max-h-none space-y-4 bg-white dark:bg-[#0D111A]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E95A8]">
              Pipeline Timeline
            </h3>
            <span className="text-[11px] font-mono text-[#7C5CFC] font-semibold">
              7 Steps
            </span>
          </div>

          <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#EAE6FD] dark:before:bg-[#1E2638]">
            {(run.steps || []).map((step, idx) => {
              const isCurrent = idx === run.currentStepIndex && run.status !== "completed";
              const isDone = step.status === "completed" || (run.status === "completed" && idx <= 6);
              const isWaiting = step.status === "waiting" || (isWaitingApproval && idx === 5);
              const isStepFailed = step.status === "failed" || (isFailed && idx === run.currentStepIndex);

              return (
                <div key={step.id} className="relative flex items-start gap-3 text-xs group">
                  {/* Status Circle Icon */}
                  <div
                    className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                      isDone
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : isCurrent && isRunning
                        ? "bg-[#7C5CFC] text-white border-[#7C5CFC] shadow-sm animate-pulse"
                        : isWaiting
                        ? "bg-amber-500 text-white border-amber-500"
                        : isStepFailed
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white dark:bg-[#0D111A] text-[#8E95A8] border-[#EAE6FD] dark:border-[#242B3D]"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isCurrent && isRunning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isWaiting ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : isStepFailed ? (
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <span className="text-[10px] font-bold font-mono">{idx + 1}</span>
                    )}
                  </div>

                  {/* Step Title & Details */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-semibold text-xs truncate ${
                          isCurrent
                            ? "text-[#7C5CFC] font-bold"
                            : isDone
                            ? "text-[#19143D] dark:text-[#F3F5FA]"
                            : "text-[#6E6A8A] dark:text-[#8E95A8]"
                        }`}
                      >
                        {step.title}
                      </span>
                      {step.durationMs ? (
                        <span className="text-[10px] font-mono text-[#8E95A8] shrink-0">
                          {Math.round(step.durationMs / 1000)}s
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-[#6E6A8A] dark:text-[#8E95A8] line-clamp-1 mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER COLUMN: Diff Viewer, Plan Checklist, Live Log Stream & Gate */}
        <div className="lg:col-span-6 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-4">
            {run.status === "failed" && run.errorDetails && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <div className="space-y-1">
                  <span className="font-bold block">Execution Blocked: {run.errorDetails}</span>
                  <p className="text-[11px] text-[#6E6A8A] dark:text-[#8E95A8]">
                    This run was stopped to protect the codebase according to workspace safety policies.
                  </p>
                </div>
              </div>
            )}

            {/* Center Tab Selector */}
            <div className="flex items-center justify-between border-b border-[#EAE6FD] dark:border-[#1E2638] pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCenterTab("diff")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    centerTab === "diff"
                      ? "bg-[#7C5CFC]/15 text-[#7C5CFC]"
                      : "text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#19143D]"
                  }`}
                >
                  <FileDiff className="w-3.5 h-3.5" />
                  <span>Propose Changes (Diff)</span>
                  {currentDiff && (
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{currentDiff.additions}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setCenterTab("plan")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    centerTab === "plan"
                      ? "bg-[#7C5CFC]/15 text-[#7C5CFC]"
                      : "text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#19143D]"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Plan Checklist</span>
                </button>

                <button
                  onClick={() => setCenterTab("logs")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    centerTab === "logs"
                      ? "bg-[#7C5CFC]/15 text-[#7C5CFC]"
                      : "text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#19143D]"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Live Logs</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-[#1A1F30] text-[10px] font-mono">
                    {run.logs?.length || 0}
                  </span>
                </button>
              </div>

              {centerTab === "diff" && currentDiff && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setDiffViewMode(diffViewMode === "inline" ? "split" : "inline")}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg border border-[#EAE6FD] dark:border-[#242B3D] text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#19143D] cursor-pointer"
                    title="Toggle inline vs side-by-side split"
                  >
                    <Split className="w-3 h-3" />
                    <span>{diffViewMode === "inline" ? "Side-by-Side" : "Inline"}</span>
                  </button>
                  <button
                    onClick={handleCopyDiff}
                    className="p-1 rounded-lg border border-[#EAE6FD] dark:border-[#242B3D] text-[#8E95A8] hover:text-[#19143D] cursor-pointer"
                    title="Copy diff patch"
                  >
                    {copiedDiff ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {centerTab === "logs" && (
                <button
                  onClick={handleCopyLogs}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg border border-[#EAE6FD] dark:border-[#242B3D] text-[#8E95A8] hover:text-[#19143D] cursor-pointer"
                >
                  {copiedLog ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              )}
            </div>

            {/* TAB CONTENT 1: Unified Diff Viewer */}
            {centerTab === "diff" && (
              <div className="space-y-3">
                {currentDiff ? (
                  <div className="border border-[#EAE6FD] dark:border-[#1E2638] rounded-xl overflow-hidden bg-neutral-50 dark:bg-[#090C15] font-mono text-[11px]">
                    {/* Diff Header */}
                    <div className="px-3 py-2 bg-neutral-100 dark:bg-[#121624] border-b border-[#EAE6FD] dark:border-[#1E2638] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-[#7C5CFC]" />
                        <span className="font-bold text-[#19143D] dark:text-[#F3F5FA]">{currentDiff.file}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{currentDiff.additions}</span>
                        <span className="text-red-600 dark:text-red-400 font-bold">-{currentDiff.deletions}</span>
                      </div>
                    </div>

                    {/* Diff Code Display */}
                    <div className="p-3 overflow-x-auto max-h-[380px] space-y-0.5 leading-relaxed select-text">
                      {currentDiff.patch.split("\n").map((line, idx) => {
                        const isAdd = line.startsWith("+");
                        const isDel = line.startsWith("-");
                        const isHunk = line.startsWith("@@");

                        return (
                          <div
                            key={idx}
                            className={`flex items-start px-2 py-0.5 rounded-sm ${
                              isAdd
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold"
                                : isDel
                                ? "bg-red-500/15 text-red-700 dark:text-red-300 font-semibold"
                                : isHunk
                                ? "bg-[#7C5CFC]/10 text-[#7C5CFC] font-bold"
                                : "text-[#19143D] dark:text-[#CBD5E1]"
                            }`}
                          >
                            <span className="w-8 shrink-0 select-none text-[10px] text-[#8E95A8] font-normal">
                              {idx + 1}
                            </span>
                            <pre className="font-mono whitespace-pre-wrap">{line}</pre>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-[#EAE6FD] dark:border-[#1E2638] rounded-xl text-xs text-[#8E95A8]">
                    <span>Diff will appear once the agent executes Step 4 (Propose changes).</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: Plan Checklist */}
            {centerTab === "plan" && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#19143D] dark:text-[#F3F5FA] mb-2">
                  Model Plan & Verification Milestones
                </h4>
                {(run.planChecklist || []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl border border-[#EAE6FD] dark:border-[#1E2638] bg-[#F7F5FE]/40 dark:bg-[#121624]/40 text-xs"
                  >
                    <div
                      className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border ${
                        item.done
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-[#8E95A8] text-transparent"
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className={item.done ? "text-[#19143D] dark:text-[#F3F5FA] font-medium" : "text-[#6E6A8A] dark:text-[#8E95A8]"}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT 3: Live Log Stream */}
            {centerTab === "logs" && (
              <div className="border border-[#EAE6FD] dark:border-[#1E2638] rounded-xl overflow-hidden bg-neutral-900 text-emerald-400 font-mono text-[11px] p-3 max-h-[380px] overflow-y-auto space-y-1.5 shadow-inner">
                {(run.logs || []).map((l) => (
                  <div key={l.id} className="flex items-start gap-2">
                    <span className="text-[#8E95A8] select-none shrink-0">[{l.timestamp}]</span>
                    <span
                      className={`font-bold select-none shrink-0 ${
                        l.level === "error"
                          ? "text-red-400"
                          : l.level === "warn"
                          ? "text-amber-400"
                          : l.level === "success"
                          ? "text-emerald-300"
                          : "text-indigo-400"
                      }`}
                    >
                      {l.level.toUpperCase()}:
                    </span>
                    <span className="text-neutral-200 whitespace-pre-wrap">{l.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>

          {/* APPROVAL GATE & FOLLOW-UP CONTROLS */}
          <div className="space-y-3 pt-3 border-t border-[#EAE6FD] dark:border-[#1E2638]">
            {/* Approval Gate Banner (Visible if waiting approval) */}
            {isWaitingApproval && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-amber-500 text-white">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-[#19143D] dark:text-[#F3F5FA] block">
                      Human Authorization Gate (Step 6/7)
                    </span>
                    <span className="text-[11px] text-[#6E6A8A] dark:text-[#8E95A8]">
                      Verify the synthesized unified diff above. Applying will commit file changes and create a Pull Request in Code Review.
                    </span>
                  </div>
                </div>

                {isRequestChangesOpen ? (
                  <div className="space-y-2 pt-2 border-t border-amber-500/20">
                    <label className="font-bold text-[#19143D] dark:text-[#F3F5FA] block">
                      Developer Feedback / Requested Adjustments:
                    </label>
                    <textarea
                      rows={2}
                      value={changesFeedback}
                      onChange={(e) => setChangesFeedback(e.target.value)}
                      placeholder="e.g. Add an extra test case verifying inactive account behavior..."
                      className="w-full px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#0D111A] text-[#19143D] dark:text-[#F3F5FA] outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setIsRequestChangesOpen(false)}
                        className="px-3 py-1 text-xs text-[#8E95A8] hover:text-[#19143D]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleApplyChanges}
                        disabled={isRegenerating}
                        className="px-3 py-1 rounded-lg bg-[#7C5CFC] hover:bg-[#6A4BE8] text-white text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        {isRegenerating ? "Regenerating Diff..." : "Submit Feedback & Regenerate"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onApproveAndApply}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve & Apply</span>
                      </button>

                      <button
                        onClick={() => setIsRequestChangesOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-400 dark:border-amber-700 bg-white dark:bg-[#0D111A] text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-50 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Request changes</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setIsRejectConfirmOpen(true)}
                      className="px-3 py-2 text-xs text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* "Ask Agent" Follow-up Question Box */}
            <form onSubmit={handleSendFollowUp} className="flex items-center gap-2">
              <input
                type="text"
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Ask agent a question or clarify instructions..."
                className="flex-1 px-3 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs text-[#19143D] dark:text-[#F3F5FA] outline-none focus:border-[#7C5CFC]"
              />
              <button
                type="submit"
                disabled={isAsking || !followUpText.trim()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6A4BE8] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Send className="w-3 h-3" />
                <span>{isAsking ? "Asking..." : "Ask Agent"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Run Info & Controls */}
        <div className="lg:col-span-3 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#F7F5FE]/30 dark:bg-[#121624]/30">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E95A8]">
            Run Specification
          </h3>

          <div className="space-y-3 text-xs">
            {/* Repository Info */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] space-y-1">
              <span className="text-[10px] font-bold text-[#8E95A8] uppercase tracking-wider block">Repository</span>
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-[#19143D] dark:text-[#F3F5FA]">{run.repositoryName || run.repositoryId}</span>
                <Link
                  href={`/repositories/${run.repositoryId}`}
                  className="text-[#7C5CFC] hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Template Info */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] space-y-1">
              <span className="text-[10px] font-bold text-[#8E95A8] uppercase tracking-wider block">Template</span>
              <span className="font-bold text-[#19143D] dark:text-[#F3F5FA] block">{run.templateName || run.templateId}</span>
              <span className="text-[11px] text-[#6E6A8A] dark:text-[#8E95A8] block">Agent Type: {run.agentType}</span>
            </div>

            {/* Files Touched */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] space-y-1.5">
              <span className="text-[10px] font-bold text-[#8E95A8] uppercase tracking-wider block">Files Touched</span>
              {(run.filesTouched || [run.target || "src/services/auth.ts"]).map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] font-mono text-[#7C5CFC]">
                  <FileCode className="w-3.5 h-3.5" />
                  <span className="truncate">{f}</span>
                </div>
              ))}
            </div>

            {/* Execution Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638]">
                <span className="text-[10px] text-[#8E95A8] block">Tokens Used</span>
                <span className="font-bold font-mono text-[#19143D] dark:text-[#F3F5FA]">
                  {run.tokensUsed || 1840}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638]">
                <span className="text-[10px] text-[#8E95A8] block">Elapsed Time</span>
                <span className="font-bold font-mono text-[#19143D] dark:text-[#F3F5FA]">
                  {run.durationSeconds || 32}s
                </span>
              </div>
            </div>

            {/* Policy Applied Badge */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-[11px]">Policy Applied:</span>
                <span className="text-[11px]">Strict developer approval gate enforced before commit.</span>
              </div>
            </div>

            {/* Pull Request Link (If Created) */}
            {run.pullRequestId && (
              <div className="p-3 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/30 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#7C5CFC]">
                  <GitPullRequest className="w-4 h-4" />
                  <span>Pull Request Registered</span>
                </div>
                <Link
                  href="/code-review"
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#7C5CFC] text-white text-xs font-semibold hover:bg-[#6A4BE8] transition-colors"
                >
                  <span>Open in Code Review</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {/* Control Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#EAE6FD] dark:border-[#1E2638]">
              {isRunning && (
                <button
                  onClick={onPause}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] text-[#6E6A8A] dark:text-[#8E95A8] hover:text-[#19143D] text-xs font-semibold cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Run</span>
                </button>
              )}

              {isPaused && (
                <button
                  onClick={onResume}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Run</span>
                </button>
              )}

              {isFailed && (
                <button
                  onClick={onRetry}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#7C5CFC] text-white text-xs font-semibold hover:bg-[#6A4BE8] cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Failed Step</span>
                </button>
              )}

              {(isRunning || isPaused || isWaitingApproval) && (
                <button
                  onClick={() => setIsCancelConfirmOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel Run</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM MODALS: Cancel & Reject */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA]">
              Cancel Agent Run?
            </h4>
            <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8]">
              Are you sure you want to cancel this agent run? Execution will be terminated and marked as Cancelled.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#EAE6FD] dark:border-[#242B3D] text-xs font-semibold text-[#8E95A8]"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setIsCancelConfirmOpen(false);
                  onCancel();
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Yes, Cancel Run
              </button>
            </div>
          </div>
        </div>
      )}

      {isRejectConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA]">
              Reject Proposed Changes?
            </h4>
            <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8]">
              Rejecting will end this run without modifying any files or creating a Pull Request.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRejectConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#EAE6FD] dark:border-[#242B3D] text-xs font-semibold text-[#8E95A8]"
              >
                Keep Reviewing
              </button>
              <button
                onClick={() => {
                  setIsRejectConfirmOpen(false);
                  onReject();
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
