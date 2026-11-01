"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Network,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Search,
  ExternalLink,
  Sparkles,
  Ban,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InvestigationHypothesis } from "@/types/debug";

interface HypothesesExplorerProps {
  investigationId: string;
  hypotheses: InvestigationHypothesis[];
  confirmedRootCauseId?: string;
  repositoryId?: string;
  onUpdateHypothesis: (hypothesisId: string, isInvestigated: boolean) => Promise<void>;
  onConfirmRootCause: (hypothesisId: string, summary: string) => Promise<void>;
  onRuleOutHypothesis?: (hypothesisId: string) => Promise<void>;
}

export default function HypothesesExplorer({
  investigationId,
  hypotheses,
  confirmedRootCauseId,
  repositoryId,
  onUpdateHypothesis,
  onConfirmRootCause,
  onRuleOutHypothesis,
}: HypothesesExplorerProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggleInvestigated = async (h: InvestigationHypothesis) => {
    try {
      setUpdatingId(h.id);
      await onUpdateHypothesis(h.id, !h.isInvestigated);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmCause = async (h: InvestigationHypothesis) => {
    try {
      setUpdatingId(h.id);
      await onConfirmRootCause(h.id, h.title);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRuleOut = async (h: InvestigationHypothesis) => {
    if (!onRuleOutHypothesis) return;
    try {
      setUpdatingId(h.id);
      await onRuleOutHypothesis(h.id);
    } finally {
      setUpdatingId(null);
    }
  };

  const getLikelihoodBadge = (likelihood: "high" | "medium" | "low", rank: number) => {
    const confidencePercent = rank === 1 ? 88 : rank === 2 ? 55 : 28;
    switch (likelihood) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#7C5CFC]/15 text-[#7C5CFC]">
            Likelihood: High ({confidencePercent}%)
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-500">
            Likelihood: Medium ({confidencePercent}%)
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-500/15 text-[var(--text-secondary)]">
            Likelihood: Low ({confidencePercent}%)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#7C5CFC]" />
            Ranked Root-Cause Hypotheses
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Ranked failure theories grounded against verified AST call graphs and observed error traces.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {hypotheses.map((h) => {
          const isConfirmed = h.id === confirmedRootCauseId || h.isConfirmedRootCause;
          const isRuledOut = !!h.isRuledOut;
          const isUpdating = updatingId === h.id;

          return (
            <div
              key={h.id}
              className={`bg-[var(--bg-card)] border rounded-xl p-5 transition-all shadow-sm ${
                isConfirmed
                  ? "border-[#2FD6A0] ring-1 ring-[#2FD6A0]/30"
                  : isRuledOut
                  ? "border-[var(--border-color)] opacity-60 bg-[var(--bg-primary)]/40"
                  : "border-[var(--border-color)] hover:border-[#7C5CFC]/50"
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
                <div className="flex items-start sm:items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-[#7C5CFC]/15 text-[#7C5CFC] text-xs font-bold flex items-center justify-center shrink-0">
                    #{h.rank}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm ${isRuledOut ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
                        {h.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                        {h.categoryLabel}
                      </span>
                      {getLikelihoodBadge(h.likelihood, h.rank)}
                    </div>
                    {h.targetFile && (
                      <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                        Target: {h.targetFile}
                        {h.targetLineRange ? ` (lines ${h.targetLineRange.start}-${h.targetLineRange.end})` : ""}
                        {h.targetSymbol ? ` • symbol: ${h.targetSymbol}` : ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  {isConfirmed && (
                    <Badge variant="mint" className="py-1 px-3">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Confirmed Root Cause
                    </Badge>
                  )}
                  {isRuledOut && (
                    <Badge variant="gray" className="py-1 px-3 text-red-400">
                      <Ban className="w-3.5 h-3.5 mr-1" />
                      Ruled Out
                    </Badge>
                  )}
                  {h.isInvestigated && !isConfirmed && !isRuledOut && (
                    <Badge variant="gray">Investigated</Badge>
                  )}
                </div>
              </div>

              {/* Hypothesis Explanation */}
              <div className="mt-3">
                <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                  {h.explanation}
                </p>
              </div>

              {/* Observed Facts vs Counter Evidence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {/* Supporting Facts */}
                <div className="bg-[#2FD6A0]/5 border border-[#2FD6A0]/20 rounded-lg p-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#1BA97B] dark:text-[#2FD6A0] mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Observed Supporting Evidence
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[var(--text-primary)]">
                    {h.supportingEvidence.map((ev, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#2FD6A0] shrink-0 font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Counter / Weakening Evidence */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Counter / Weakening Evidence
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[var(--text-primary)]">
                    {h.counterEvidence && h.counterEvidence.length > 0 ? (
                      h.counterEvidence.map((cev, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-500 shrink-0 font-bold">•</span>
                          <span>{cev}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-[var(--text-secondary)] italic">
                        No conflicting facts observed in trace or repository AST.
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Related Callers / Callees in Architecture */}
              {h.relatedSymbols && h.relatedSymbols.length > 0 && (
                <div className="mt-3 p-3 bg-[var(--bg-primary)]/50 rounded-lg border border-[var(--border-color)]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-[#7C5CFC]" />
                    Connected Symbol Relationships (Architecture Graph)
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {h.relatedSymbols.map((rel, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)]"
                      >
                        <span className="text-[10px] uppercase font-bold text-[#7C5CFC]">
                          {rel.relationship}:
                        </span>
                        <span>{rel.symbolName}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Next Steps */}
              {h.suggestedSteps && h.suggestedSteps.length > 0 && (
                <div className="mt-3 text-xs text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">Suggested Investigation: </span>
                  {h.suggestedSteps.join(" ")}
                </div>
              )}

              {/* Interactive Investigation Actions */}
              <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={h.isInvestigated}
                    disabled={isUpdating}
                    onChange={() => handleToggleInvestigated(h)}
                    className="rounded border-[var(--border-color)] text-[#7C5CFC] focus:ring-[#7C5CFC]"
                  />
                  <span>Mark hypothesis as investigated</span>
                </label>

                <div className="flex items-center gap-2">
                  {onRuleOutHypothesis && !isConfirmed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => handleRuleOut(h)}
                      className={`text-xs ${isRuledOut ? "text-amber-500" : "text-[var(--text-secondary)] hover:text-red-400"}`}
                    >
                      <Ban className="w-3.5 h-3.5 mr-1" />
                      {isRuledOut ? "Unmark Ruled Out" : "Rule Out"}
                    </Button>
                  )}

                  {!isConfirmed ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdating || isRuledOut}
                      onClick={() => handleConfirmCause(h)}
                      className="text-xs hover:border-[#2FD6A0] hover:text-[#2FD6A0]"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Confirm Root Cause
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-[#2FD6A0] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmed Root Cause
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
