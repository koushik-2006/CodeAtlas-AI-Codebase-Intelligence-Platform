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
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SuggestedFix } from "@/types/debug";

interface FixSuggestionCardProps {
  fix: SuggestedFix;
  investigationId: string;
  isStandalone: boolean;
  onApplyPatch: (fixId: string, confirmed: boolean) => Promise<{ success: boolean; message: string }>;
}

export default function FixSuggestionCard({
  fix,
  investigationId,
  isStandalone,
  onApplyPatch,
}: FixSuggestionCardProps) {
  const [copied, setCopied] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(fix.patchDiff || fix.replacementSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = async () => {
    try {
      setIsApplying(true);
      const res = await onApplyPatch(fix.id, true);
      setApplyResult(res);
      setIsConfirming(false);
    } catch (e: any) {
      setApplyResult({
        success: false,
        message: e.message || "Failed to apply patch safely.",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const getValidationBadge = (status: string) => {
    switch (status) {
      case "validated":
        return <Badge variant="mint">Syntax & Revision Validated</Badge>;
      case "stale_revision":
        return <Badge variant="coral">Stale Source Lines Detected</Badge>;
      case "missing_file":
        return <Badge variant="coral">Target File Missing</Badge>;
      default:
        return <Badge variant="sun">Validation Pending</Badge>;
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#29D3C2]/15 text-[#29D3C2] flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                {fix.title}
              </h3>
              {getValidationBadge(fix.validationStatus)}
              {fix.isApplied && (
                <Badge variant="mint">
                  <CheckCircle2 className="w-3 h-3 mr-0.5" /> Applied
                </Badge>
              )}
            </div>
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
              {fix.filePath} (lines {fix.startLine}-{fix.endLine})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs text-[var(--text-secondary)]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-[#2FD6A0]" />
                Copied Diff
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copy Patch
              </>
            )}
          </Button>

          {!isStandalone && !fix.isApplied && (
            <Button
              variant="primary"
              size="sm"
              disabled={isApplying || fix.validationStatus !== "validated"}
              onClick={() => setIsConfirming(true)}
              className="text-xs font-semibold"
            >
              Apply Patch Safely
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-xs text-[var(--text-primary)] leading-relaxed">
          {fix.description}
        </p>
      </div>

      {/* Unified Diff Viewer */}
      <div className="border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-primary)]">
        <div className="px-3 py-1.5 border-b border-[var(--border-color)] bg-[var(--bg-card)]/50 text-[10px] font-mono text-[var(--text-secondary)] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-[#8B7CFF]" />
            Proposed Minimal Diff: {fix.filePath}
          </span>
          <span>Lines {fix.startLine}-{fix.endLine}</span>
        </div>

        <pre className="p-3 text-[11px] font-mono leading-relaxed overflow-x-auto">
          {fix.patchDiff.split("\n").map((line, idx) => {
            const isAdd = line.startsWith("+") && !line.startsWith("+++");
            const isDel = line.startsWith("-") && !line.startsWith("---");
            const isHdr = line.startsWith("@@") || line.startsWith("---") || line.startsWith("+++");

            return (
              <div
                key={idx}
                className={`px-2 py-0.5 rounded ${
                  isAdd
                    ? "bg-[#2FD6A0]/15 text-[#1BA97B] dark:text-[#2FD6A0] font-semibold"
                    : isDel
                    ? "bg-red-500/15 text-red-500 font-semibold"
                    : isHdr
                    ? "text-[#8B7CFF] font-bold"
                    : "text-[var(--text-primary)]"
                }`}
              >
                {line || " "}
              </div>
            );
          })}
        </pre>
      </div>

      {/* Side Effects and Assumptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg p-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Potential Side Effects
          </h4>
          <ul className="space-y-1 text-[var(--text-secondary)] list-disc list-inside">
            {fix.potentialSideEffects.map((se, i) => (
              <li key={i}>{se}</li>
            ))}
          </ul>
        </div>

        <div className="bg-[var(--bg-primary)]/50 border border-[var(--border-color)] rounded-lg p-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#8B7CFF]" />
            Assumptions to Verify
          </h4>
          <ul className="space-y-1 text-[var(--text-secondary)] list-disc list-inside">
            {fix.assumptions.map((as, i) => (
              <li key={i}>{as}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Confirmation Dialog / Banner */}
      {isConfirming && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-500">
                Confirm Safe Patch Application
              </h4>
              <p className="text-xs text-[var(--text-primary)] mt-1">
                This will modify <code className="font-mono text-[#8B7CFF]">{fix.filePath}</code> in your repository.
                An automatic pre-patch backup will be stored before lines {fix.startLine}-{fix.endLine} are replaced.
                No arbitrary code will be executed on the server.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-500/20">
            <Button
              variant="ghost"
              size="sm"
              disabled={isApplying}
              onClick={() => setIsConfirming(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isApplying}
              onClick={handleApply}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isApplying ? "Applying Safely..." : "Yes, Apply Patch"}
            </Button>
          </div>
        </div>
      )}

      {/* Applied Result Banner */}
      {applyResult && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            applyResult.success
              ? "bg-[#2FD6A0]/15 text-[#1BA97B] dark:text-[#2FD6A0] border border-[#2FD6A0]/30"
              : "bg-red-500/15 text-red-500 border border-red-500/30"
          }`}
        >
          {applyResult.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{applyResult.message}</span>
        </div>
      )}
    </div>
  );
}
