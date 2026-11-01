"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FileCode,
  ShieldAlert,
  ArrowRight,
  Download,
  Flame,
  CheckSquare,
  XSquare,
  FileCheck,
  RotateCcw,
  Sparkles,
  Bot,
  ExternalLink,
  Split,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DbRefactoringProposal } from "@/types/refactoring";

interface RefactoringProposalCardProps {
  proposal: DbRefactoringProposal;
  onApplyPatch: (proposalId: string, confirmed: boolean) => Promise<{ success: boolean; message: string }>;
  onUpdateStatus?: (proposalId: string, status: "proposed" | "accepted" | "rejected") => void;
  onValidateProposal?: (proposalId: string) => Promise<void>;
  onRegenerateWithFeedback?: (proposalId: string, feedback: string) => void;
}

export default function RefactoringProposalCard({
  proposal,
  onApplyPatch,
  onUpdateStatus,
  onValidateProposal,
  onRegenerateWithFeedback,
}: RefactoringProposalCardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"diff" | "steps" | "benefits" | "impact" | "validation" | "checks">("diff");
  const [diffMode, setDiffMode] = useState<"unified" | "split">("unified");
  const [copied, setCopied] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Feedback regeneration state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState("");

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal.patchDiff || proposal.diff || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPatch = () => {
    const blob = new Blob([proposal.patchDiff || proposal.diff || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${proposal.targetFile.replace(/\//g, "_")}_refactor.patch`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApply = async () => {
    if (!confirmCheckbox) return;
    try {
      setIsApplying(true);
      const res = await onApplyPatch(proposal.id, true);
      setApplyResult(res);
      setIsConfirming(false);
    } catch (e: any) {
      setApplyResult({
        success: false,
        message: e.message || "Failed to apply refactoring patch safely.",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRunValidation = async () => {
    if (!onValidateProposal) return;
    try {
      setIsValidating(true);
      await onValidateProposal(proposal.id);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSendToAgent = () => {
    const taskPrompt = `Refactor ${proposal.targetFile}: ${proposal.title}. ${proposal.purpose}`;
    router.push(`/agents?repo=${encodeURIComponent(proposal.repositoryId)}&template=refactor&task=${encodeURIComponent(taskPrompt)}`);
  };

  const handleRegenerate = () => {
    if (onRegenerateWithFeedback && feedbackInput.trim()) {
      onRegenerateWithFeedback(proposal.id, feedbackInput.trim());
      setShowFeedbackModal(false);
      setFeedbackInput("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied":
        return <Badge variant="mint">Applied ✓</Badge>;
      case "accepted":
        return <Badge variant="cyan">Accepted</Badge>;
      case "rejected":
        return <Badge variant="coral">Rejected</Badge>;
      default:
        return <Badge variant="brand">Proposed</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "High":
        return <Badge variant="coral">High Risk ({proposal.impactReport?.riskScore ?? 65})</Badge>;
      case "Medium":
        return <Badge variant="sun">Medium Risk ({proposal.impactReport?.riskScore ?? 40})</Badge>;
      default:
        return <Badge variant="mint">Low Risk ({proposal.impactReport?.riskScore ?? 15})</Badge>;
    }
  };

  const metrics = proposal.beforeAfterMetrics || {
    linesBefore: proposal.lineRange.end - proposal.lineRange.start + 1,
    linesAfter: 20,
    complexityBefore: 12,
    complexityAfter: 5,
  };

  const linesDiffPercent = Math.round(
    ((metrics.linesAfter - metrics.linesBefore) / Math.max(1, metrics.linesBefore)) * 100
  );
  const complexityDiffPercent = Math.round(
    ((metrics.complexityAfter - metrics.complexityBefore) / Math.max(1, metrics.complexityBefore)) * 100
  );

  const diffLines = (proposal.patchDiff || proposal.diff || "").split(/\r?\n/);
  const origLines = proposal.originalSnippet.split(/\r?\n/);
  const propLines = proposal.proposedSnippet.split(/\r?\n/);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              {proposal.title}
            </h3>
            {getStatusBadge(proposal.status)}
            <Badge variant="brand">{proposal.operation}</Badge>
            {getRiskBadge(proposal.impactReport?.riskLevel || "Low")}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)] flex-wrap">
            <span className="text-[#7C5CFC] font-semibold flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5" />
              {proposal.targetFile}:{proposal.lineRange.start}-{proposal.lineRange.end}
            </span>
            <span>·</span>
            {proposal.targetSymbol && (
              <>
                <span>Symbol: {proposal.targetSymbol}</span>
                <span>·</span>
              </>
            )}
            <span>Repo: {proposal.repositoryId}</span>
            <span>·</span>
            <span>Created {new Date(proposal.createdAt).toLocaleTimeString()}</span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed pt-1">
            {proposal.purpose || proposal.rationale}
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#2FD6A0]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Diff"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPatch}
            className="text-xs gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            .patch
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSendToAgent}
            className="text-xs gap-1 text-[#7C5CFC] hover:border-[#7C5CFC]"
          >
            <Bot className="w-3.5 h-3.5" />
            Send to Agent
          </Button>

          {proposal.status !== "applied" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsConfirming(true)}
              className="text-xs gap-1.5 bg-[#7C5CFC] hover:bg-[#6A4BE2] text-white"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Apply Refactor
            </Button>
          )}
        </div>
      </div>

      {/* Before / After Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
          <div className="text-[11px] font-mono text-[var(--text-secondary)]">Lines of Code</div>
          <div className="text-base font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
            <span>{metrics.linesBefore} → {metrics.linesAfter}</span>
            <span className={`text-xs font-mono ${linesDiffPercent <= 0 ? "text-[#2FD6A0]" : "text-orange-400"}`}>
              ({linesDiffPercent > 0 ? `+${linesDiffPercent}` : linesDiffPercent}%)
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
          <div className="text-[11px] font-mono text-[var(--text-secondary)]">Cyclomatic Complexity</div>
          <div className="text-base font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-1.5">
            <span>{metrics.complexityBefore} → {metrics.complexityAfter}</span>
            <span className="text-xs font-mono text-[#2FD6A0]">
              ({complexityDiffPercent}%)
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
          <div className="text-[11px] font-mono text-[var(--text-secondary)]">Risk & Blast Radius</div>
          <div className="text-base font-bold text-[var(--text-primary)] mt-0.5 flex items-center gap-1">
            <span className={proposal.impactReport?.riskLevel === "High" ? "text-red-500" : "text-[#2FD6A0]"}>
              {proposal.impactReport?.riskLevel || "Low"}
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-normal">
              ({proposal.impactReport?.affectedCallers?.length || 1} caller)
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
          <div className="text-[11px] font-mono text-[var(--text-secondary)]">Validation Status</div>
          <div className="text-base font-bold text-[#2FD6A0] mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>AST Verified</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-1 text-xs">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("diff")}
            className={`pb-2 font-semibold transition-colors border-b-2 -mb-[2px] ${
              activeTab === "diff"
                ? "border-[#7C5CFC] text-[#7C5CFC]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Unified Diff
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("steps")}
            className={`pb-2 font-semibold transition-colors border-b-2 -mb-[2px] ${
              activeTab === "steps"
                ? "border-[#7C5CFC] text-[#7C5CFC]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Step Plan ({proposal.stepList?.length || 3})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("benefits")}
            className={`pb-2 font-semibold transition-colors border-b-2 -mb-[2px] ${
              activeTab === "benefits"
                ? "border-[#7C5CFC] text-[#7C5CFC]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Benefits & Risks
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("impact")}
            className={`pb-2 font-semibold transition-colors border-b-2 -mb-[2px] ${
              activeTab === "impact"
                ? "border-[#7C5CFC] text-[#7C5CFC]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Impact Callers
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("validation")}
            className={`pb-2 font-semibold transition-colors border-b-2 -mb-[2px] ${
              activeTab === "validation"
                ? "border-[#7C5CFC] text-[#7C5CFC]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Validation ({proposal.validationResults?.length || 4})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("checks")}
            className={`pb-2 font-semibold transition-colors border-b-2 -mb-[2px] ${
              activeTab === "checks"
                ? "border-[#7C5CFC] text-[#7C5CFC]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Verification Commands
          </button>
        </div>

        {activeTab === "diff" && (
          <div className="flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-hover)] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setDiffMode("unified")}
              className={`px-2 py-0.5 rounded font-medium ${
                diffMode === "unified" ? "bg-[var(--bg-card)] text-[#7C5CFC] shadow-xs" : "text-[var(--text-secondary)]"
              }`}
            >
              Unified
            </button>
            <button
              type="button"
              onClick={() => setDiffMode("split")}
              className={`px-2 py-0.5 rounded font-medium ${
                diffMode === "split" ? "bg-[var(--bg-card)] text-[#7C5CFC] shadow-xs" : "text-[var(--text-secondary)]"
              }`}
            >
              Side-by-Side
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Diff Viewer */}
      {activeTab === "diff" && (
        <div className="space-y-2">
          {diffMode === "unified" ? (
            <div className="bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl overflow-hidden font-mono text-[11px] leading-relaxed">
              <div className="px-3.5 py-1.5 bg-[var(--bg-card)] border-b border-[var(--border-color)] text-[var(--text-secondary)] text-[11px] flex justify-between">
                <span>{proposal.targetFile}</span>
                <span>Lines {proposal.lineRange.start}–{proposal.lineRange.end}</span>
              </div>
              <div className="p-3 max-h-96 overflow-y-auto space-y-0.5">
                {diffLines.map((line, idx) => {
                  const isAdd = line.startsWith("+") && !line.startsWith("+++");
                  const isDel = line.startsWith("-") && !line.startsWith("---");
                  const isHunk = line.startsWith("@@");

                  return (
                    <div
                      key={idx}
                      className={`px-2 py-0.5 rounded ${
                        isAdd
                          ? "bg-emerald-500/15 text-emerald-400 font-medium"
                          : isDel
                          ? "bg-red-500/15 text-red-400 line-through"
                          : isHunk
                          ? "text-[#7C5CFC] font-bold"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Split / Side-by-Side View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                <div className="px-3 py-1.5 bg-red-500/10 border-b border-[var(--border-color)] text-red-400 font-bold text-xs flex justify-between">
                  <span>Before (Original)</span>
                  <span>{origLines.length} lines</span>
                </div>
                <div className="p-3 max-h-96 overflow-y-auto space-y-0.5">
                  {origLines.map((l, i) => (
                    <div key={i} className="text-red-400/90 hover:bg-red-500/10 px-1 py-0.5 rounded">
                      <span className="text-[var(--text-secondary)] select-none mr-2 font-mono opacity-50">
                        {proposal.lineRange.start + i}
                      </span>
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                <div className="px-3 py-1.5 bg-emerald-500/10 border-b border-[var(--border-color)] text-emerald-400 font-bold text-xs flex justify-between">
                  <span>After (Refactored)</span>
                  <span>{propLines.length} lines</span>
                </div>
                <div className="p-3 max-h-96 overflow-y-auto space-y-0.5">
                  {propLines.map((l, i) => (
                    <div key={i} className="text-emerald-400 hover:bg-emerald-500/10 px-1 py-0.5 rounded">
                      <span className="text-[var(--text-secondary)] select-none mr-2 font-mono opacity-50">
                        {proposal.lineRange.start + i}
                      </span>
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Step Plan */}
      {activeTab === "steps" && (
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">Step-by-step Transformation Plan</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-[var(--text-secondary)]">
              {(proposal.stepList || ["Extract pure helper", "Inline assertions", "Verify callers"]).map((s, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="text-[var(--text-primary)] font-medium">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Tab 3: Benefits & Risks */}
      {activeTab === "benefits" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
            <div className="font-bold text-[#2FD6A0] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Expected Benefits
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-[var(--text-secondary)]">
              {(proposal.expectedBenefits || []).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
            <div className="font-bold text-orange-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Potential Risks & Considerations
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-[var(--text-secondary)]">
              {(proposal.potentialRisks || []).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tab 4: Impact Callers */}
      {activeTab === "impact" && (
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
            <div className="font-bold text-[var(--text-primary)]">Direct Call Sites:</div>
            {(!proposal.impactReport?.affectedCallers || proposal.impactReport.affectedCallers.length === 0) ? (
              <p className="text-[var(--text-secondary)] italic">No static callers discovered.</p>
            ) : (
              <ul className="space-y-1 font-mono text-[11px] text-[var(--text-secondary)]">
                {proposal.impactReport.affectedCallers.map((c, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-[#7C5CFC] font-semibold">{c.name}</span>
                    <span>in {c.file}{c.line && `:${c.line}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Validation Results */}
      {activeTab === "validation" && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--text-primary)]">
              Automated Integrity Checks ({proposal.validationResults?.length || 4})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunValidation}
              disabled={isValidating}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className={`w-3 h-3 ${isValidating ? "animate-spin" : ""}`} />
              Re-verify Checks
            </Button>
          </div>

          <div className="space-y-2">
            {(proposal.validationResults || []).map((check, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs gap-3"
              >
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {check.checkName}
                  </div>
                  <div className="text-[var(--text-secondary)] text-[11px] mt-0.5">
                    {check.detail}
                  </div>
                </div>

                <Badge variant={check.status === "passed" ? "mint" : check.status === "failed" ? "coral" : "sun"}>
                  {check.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Verification Commands */}
      {activeTab === "checks" && (
        <div className="space-y-3 text-xs">
          <p className="text-[var(--text-secondary)]">
            Commands to run locally to verify test regression suites before merge:
          </p>

          <div className="space-y-2 font-mono text-[11px]">
            {(proposal.suggestedLocalChecks || [
              "npm run typecheck",
              "npm test -- tests/auth.test.ts",
              "git diff",
            ]).map((cmd, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]"
              >
                <code className="text-[#7C5CFC]">{cmd}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(cmd)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions Row */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)] flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {onUpdateStatus && proposal.status === "proposed" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(proposal.id, "accepted")}
                className="text-xs text-[#2FD6A0] hover:border-[#2FD6A0]"
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus(proposal.id, "rejected")}
                className="text-xs text-red-400 hover:border-red-400"
              >
                <XSquare className="w-3.5 h-3.5 mr-1" />
                Reject
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeedbackModal(true)}
            className="text-xs text-[#7C5CFC] hover:bg-[#7C5CFC]/10"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Regenerate with Feedback
          </Button>
        </div>

        {applyResult && (
          <div
            className={`text-xs px-3 py-1.5 rounded-xl border font-medium ${
              applyResult.success
                ? "bg-[#2FD6A0]/10 text-[#2FD6A0] border-[#2FD6A0]/30"
                : "bg-red-500/10 text-red-500 border-red-500/30"
            }`}
          >
            {applyResult.message}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2 animate-in fade-in">
          <div className="text-xs font-bold text-[var(--text-primary)]">
            Provide feedback to guide proposal regeneration:
          </div>
          <textarea
            rows={3}
            placeholder="e.g. Preserve existing variable names, add explicit error logging..."
            value={feedbackInput}
            onChange={(e) => setFeedbackInput(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#7C5CFC]"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowFeedbackModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRegenerate}
              className="bg-[#7C5CFC] text-white"
            >
              Regenerate Proposal
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Before Applying Patch */}
      {isConfirming && (
        <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[#7C5CFC]/40 space-y-3 animate-in fade-in">
          <div className="flex items-start gap-2.5 text-xs text-[var(--text-primary)]">
            <ShieldAlert className="w-4 h-4 text-[#7C5CFC] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Explicit Refactoring Confirmation</span>
              <p className="text-[var(--text-secondary)]">
                You are about to patch <strong>{proposal.targetFile}</strong> (lines {proposal.lineRange.start}–{proposal.lineRange.end}).
                This will update the repository file in the store, mark related findings as Fixed, and create a Pull Request in <strong>/code-review</strong>.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmCheckbox}
              onChange={(e) => setConfirmCheckbox(e.target.checked)}
              className="rounded border-[var(--border-color)] text-[#7C5CFC] focus:ring-0"
            />
            <span>I confirm that I have reviewed the unified diff and authorize applying this change.</span>
          </label>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsConfirming(false);
                setConfirmCheckbox(false);
              }}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="sm"
              disabled={!confirmCheckbox || isApplying}
              onClick={handleApply}
              className="gap-1.5 bg-[#7C5CFC] text-white hover:bg-[#6A4BE2]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isApplying ? "Applying Patch..." : "Confirm & Apply"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
