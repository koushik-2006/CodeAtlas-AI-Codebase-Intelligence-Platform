"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DbRefactoringProposal } from "@/types/refactoring";

interface RefactoringProposalCardProps {
  proposal: DbRefactoringProposal;
  onApplyPatch: (proposalId: string, confirmed: boolean) => Promise<{ success: boolean; message: string }>;
  onUpdateStatus?: (proposalId: string, status: "proposed" | "accepted" | "rejected") => void;
  onValidateProposal?: (proposalId: string) => Promise<void>;
}

export default function RefactoringProposalCard({
  proposal,
  onApplyPatch,
  onUpdateStatus,
  onValidateProposal,
}: RefactoringProposalCardProps) {
  const [activeTab, setActiveTab] = useState<"diff" | "benefits" | "impact" | "validation" | "checks">("diff");
  const [copied, setCopied] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal.patchDiff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPatch = () => {
    const blob = new Blob([proposal.patchDiff], { type: "text/plain;charset=utf-8" });
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

  const getValidationBadge = (status: string) => {
    switch (status) {
      case "validated":
        return <Badge variant="mint">Syntax & Revision Validated</Badge>;
      case "stale_revision":
        return <Badge variant="coral">Stale Source Revision</Badge>;
      case "syntax_error":
        return <Badge variant="coral">Syntax Issue</Badge>;
      default:
        return <Badge variant="sun">Validation Pending</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied":
        return <Badge variant="mint">Applied</Badge>;
      case "accepted":
        return <Badge variant="cyan">Accepted</Badge>;
      case "rejected":
        return <Badge variant="coral">Rejected</Badge>;
      default:
        return <Badge variant="brand">Proposed</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: "Low" | "Medium" | "High") => {
    switch (riskLevel) {
      case "Low":
        return <Badge variant="mint">Low Risk ({proposal.impactReport.riskScore}/100)</Badge>;
      case "Medium":
        return <Badge variant="sun">Medium Risk ({proposal.impactReport.riskScore}/100)</Badge>;
      case "High":
        return <Badge variant="coral">High Risk ({proposal.impactReport.riskScore}/100)</Badge>;
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
      {/* Stale Warning Banner */}
      {proposal.isStaleRevision && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-500">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Stale Source Warning: </span>
            The target file lines have changed since this proposal was generated. Applying this patch is blocked until the proposal is regenerated.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              {proposal.title}
            </h3>
            <Badge variant="cyan">{proposal.operation.replace(/_/g, " ")}</Badge>
            {getStatusBadge(proposal.status)}
            {getValidationBadge(proposal.validationStatus)}
          </div>
          <p className="text-xs font-mono text-[var(--text-secondary)] mt-1">
            {proposal.targetFile} (lines {proposal.lineRange.start}-{proposal.lineRange.end})
            {proposal.targetSymbol && ` · Symbol: ${proposal.targetSymbol}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5">
            {copied ? <Check className="w-3.5 h-3.5 text-[#2FD6A0]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Diff"}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleExportPatch} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export .patch
          </Button>

          {proposal.status !== "applied" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsConfirming(true)}
              disabled={proposal.isStaleRevision || proposal.isApplied}
              className="gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Apply Patch Safely
            </Button>
          )}
        </div>
      </div>

      {/* Purpose Banner */}
      <div className="bg-[var(--bg-card-hover)]/60 rounded-lg p-3 text-xs text-[var(--text-primary)] leading-relaxed">
        <span className="font-semibold text-[#29D3C2]">Refactoring Objective: </span>
        {proposal.purpose}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("diff")}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 -mb-[1px] ${
            activeTab === "diff"
              ? "border-[#29D3C2] text-[#29D3C2]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Unified Diff
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("benefits")}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 -mb-[1px] ${
            activeTab === "benefits"
              ? "border-[#29D3C2] text-[#29D3C2]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Benefits & Risks
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("impact")}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 -mb-[1px] ${
            activeTab === "impact"
              ? "border-[#29D3C2] text-[#29D3C2]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Downstream Impact ({proposal.impactReport.affectedCallers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("validation")}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 -mb-[1px] ${
            activeTab === "validation"
              ? "border-[#29D3C2] text-[#29D3C2]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Validation Checks
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("checks")}
          className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 -mb-[1px] ${
            activeTab === "checks"
              ? "border-[#29D3C2] text-[#29D3C2]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Local Verification
        </button>
      </div>

      {/* Tab 1: Diff Preview */}
      {activeTab === "diff" && (
        <div className="space-y-2">
          <div className="font-mono text-xs rounded-lg overflow-x-auto border border-[var(--border-color)] bg-[#0A0D14] text-[#E1E4EA] p-4">
            {proposal.patchDiff.split("\n").map((line, idx) => {
              let bg = "transparent";
              let color = "text-[#E1E4EA]";
              if (line.startsWith("+") && !line.startsWith("+++")) {
                bg = "rgba(47, 214, 160, 0.15)";
                color = "text-[#2FD6A0]";
              } else if (line.startsWith("-") && !line.startsWith("---")) {
                bg = "rgba(239, 68, 68, 0.15)";
                color = "text-red-400";
              } else if (line.startsWith("@@")) {
                color = "text-[#8B7CFF]";
              } else if (line.startsWith("---") || line.startsWith("+++")) {
                color = "text-[#29D3C2]";
              }

              return (
                <div
                  key={idx}
                  style={{ backgroundColor: bg }}
                  className={`px-1.5 py-0.5 rounded leading-relaxed whitespace-pre font-mono text-[11px] ${color}`}
                >
                  {line}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-mono">
              Target: {proposal.targetFile} (Lines {proposal.lineRange.start}-{proposal.lineRange.end})
            </span>
            <span className="text-[11px]">
              {proposal.proposedSnippet.split("\n").length} replacement lines
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: Benefits & Risks */}
      {activeTab === "benefits" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
            <div className="font-semibold text-[#2FD6A0] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Expected Benefits
            </div>
            <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
              {proposal.expectedBenefits.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
            <div className="font-semibold text-orange-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Potential Risks
            </div>
            <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
              {proposal.potentialRisks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
            <div className="font-semibold text-[#29D3C2] flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" />
              Unverified Assumptions
            </div>
            <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)]">
              {proposal.unverifiedAssumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Downstream Impact */}
      {activeTab === "impact" && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-primary)]">Change Impact Assessment:</span>
              {getRiskBadge(proposal.impactReport.riskLevel)}
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              AST Call Graph Traversal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
              <div className="font-bold text-[var(--text-primary)]">Direct Callers:</div>
              {proposal.impactReport.affectedCallers.length === 0 ? (
                <div className="text-[var(--text-secondary)] italic">No static callers discovered.</div>
              ) : (
                <ul className="space-y-1 font-mono text-[11px] text-[var(--text-secondary)]">
                  {proposal.impactReport.affectedCallers.map((c, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-[#29D3C2]">{c.name}</span>
                      <span>in {c.file}{c.line && `:${c.line}`}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
              <div className="font-bold text-[var(--text-primary)]">Downstream Dependents:</div>
              {proposal.impactReport.downstreamDependents.length === 0 ? (
                <div className="text-[var(--text-secondary)] italic">No downstream modules affected.</div>
              ) : (
                <ul className="space-y-1 font-mono text-[11px] text-[var(--text-secondary)]">
                  {proposal.impactReport.downstreamDependents.map((d, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-[#29D3C2]">{d.name}</span>
                      <span>in {d.file}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--bg-card-hover)]/40 border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">Note: </span>
            {proposal.impactReport.limitationsNote}
          </div>
        </div>
      )}

      {/* Tab 4: Validation Results */}
      {activeTab === "validation" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              Automated Integrity Checks ({proposal.validationResults.length})
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
            {proposal.validationResults.map((check, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs gap-3"
              >
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">
                    {check.checkName}
                  </div>
                  <div className="text-[var(--text-secondary)] text-[11px] mt-0.5">
                    {check.detail}
                  </div>
                </div>

                <Badge
                  variant={
                    check.status === "passed"
                      ? "mint"
                      : check.status === "failed"
                      ? "coral"
                      : "sun"
                  }
                >
                  {check.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Local Verification Checks */}
      {activeTab === "checks" && (
        <div className="space-y-3 text-xs">
          <p className="text-[var(--text-secondary)]">
            Recommended commands for developers to run locally before and after applying this refactoring:
          </p>

          <div className="space-y-2 font-mono text-[11px]">
            {proposal.suggestedLocalChecks.map((cmd, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)]"
              >
                <code className="text-[#29D3C2]">{cmd}</code>
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

      {/* Proposal Actions (Status Update & Apply) */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
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
                Accept
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
        </div>

        {applyResult && (
          <div
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
              applyResult.success
                ? "bg-[#2FD6A0]/10 text-[#2FD6A0] border-[#2FD6A0]/30"
                : "bg-red-500/10 text-red-500 border-red-500/30"
            }`}
          >
            {applyResult.message}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isConfirming && (
        <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[#29D3C2]/40 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-start gap-2.5 text-xs text-[var(--text-primary)]">
            <ShieldAlert className="w-4 h-4 text-[#29D3C2] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Explicit Confirmation Required</span>
              <p className="text-[var(--text-secondary)]">
                You are about to modify <strong>{proposal.targetFile}</strong> (lines {proposal.lineRange.start}-{proposal.lineRange.end}).
                A pre-patch backup will be created automatically. The system will NOT execute arbitrary code or shell scripts.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmCheckbox}
              onChange={(e) => setConfirmCheckbox(e.target.checked)}
              className="rounded border-[var(--border-color)] text-[#29D3C2] focus:ring-0"
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
              className="gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isApplying ? "Applying..." : "Confirm & Apply"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
