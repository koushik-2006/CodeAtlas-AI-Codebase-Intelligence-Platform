"use client";

import React, { useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  CheckCircle2,
  Users,
  ShieldAlert,
  Calendar,
  Flame,
} from "lucide-react";
import { AIRiskReport, ChangeImpactResult } from "@/types/impact";
import { Button } from "@/components/ui/Button";
import { impactService } from "@/services/impact-service";

interface ImpactAIRiskReportProps {
  result: ChangeImpactResult;
  onUpdateReport?: (report: AIRiskReport) => void;
}

export function ImpactAIRiskReport({ result, onUpdateReport }: ImpactAIRiskReportProps) {
  const [report, setReport] = useState<AIRiskReport>(
    result.aiRiskReport || {
      whatCouldBreak: result.recommendation,
      edgeCases: ["Null, empty or whitespace-only strings", "Malformed JSON/URL payloads"],
      rolloutPlan: "Deploy behind feature flag and monitor 5xx errors.",
      checklist: ["Run unit test suites", "Review dependent endpoints"],
      suggestedReviewers: [],
      isAiGenerated: false,
    }
  );

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRunAiReport = async () => {
    setIsStreaming(true);
    setStreamError(null);
    try {
      const res = await impactService.streamAI(result, (chunk) => {
        setReport((prev) => ({ ...prev, whatCouldBreak: chunk }));
      });
      setReport(res);
      onUpdateReport?.(res);
    } catch (err: any) {
      setStreamError(err.message || "Firebase AI service temporarily offline.");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopyReport = () => {
    const fullText = `### 💥 What Could Break and Why\n${report.whatCouldBreak}\n\n### 🚀 Rollout Plan\n${report.rolloutPlan}\n\n### 📋 Reviewer Checklist\n${report.checklist.map((c) => `- [ ] ${c}`).join("\n")}`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#7C5CFC]" />
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              AI Risk Synthesis & Safety Playbook
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Powered by Gemini Flash • Evaluates contract fragility and rollout risks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyReport}
            className="text-xs gap-1.5 h-8"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={isStreaming}
            onClick={handleRunAiReport}
            className="bg-[#7C5CFC] text-white hover:bg-[#6A4BE2] text-xs gap-1.5 h-8 shadow-xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isStreaming ? "animate-spin" : ""}`} />
            <span>{isStreaming ? "Synthesizing..." : "Generate AI Insights"}</span>
          </Button>
        </div>
      </div>

      {/* Offline/Error notice if AI service unavailable */}
      {streamError && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>AI service unavailable. Showing deterministic AST synthesis.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAiReport}
            className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Report Sections */}
      <div className="space-y-4 text-xs leading-relaxed">
        {/* Section 1: What could break */}
        <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
            <Flame className="w-4 h-4 text-rose-400" />
            <h4>What Could Break and Why</h4>
          </div>
          <div className="text-[var(--text-primary)] whitespace-pre-line text-xs font-sans">
            {report.whatCouldBreak}
          </div>
        </div>

        {/* Section 2: Critical Edge Cases */}
        {report.edgeCases && report.edgeCases.length > 0 && (
          <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h4>Critical Edge Cases to Validate</h4>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-[var(--text-secondary)]">
              {report.edgeCases.map((ec, idx) => (
                <li key={idx} className="leading-normal">
                  <span className="text-[var(--text-primary)]">{ec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 3: Recommended Rollout Plan */}
        <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
            <Calendar className="w-4 h-4 text-[#7C5CFC]" />
            <h4>Recommended Deployment & Rollout Plan</h4>
          </div>
          <p className="text-[var(--text-primary)] whitespace-pre-line text-xs">
            {report.rolloutPlan}
          </p>
        </div>

        {/* Section 4: Reviewer Checklist */}
        {report.checklist && report.checklist.length > 0 && (
          <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4>Pre-Merge Safety Checklist</h4>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              {report.checklist.map((item, idx) => (
                <label key={idx} className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-[#7C5CFC] mt-0.5 rounded cursor-pointer"
                  />
                  <span className="text-[var(--text-primary)]">{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Section 5: Suggested Reviewers & Code Owners */}
        {report.suggestedReviewers && report.suggestedReviewers.length > 0 && (
          <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
              <Users className="w-4 h-4 text-cyan-400" />
              <h4>Designated Reviewers & Code Owners</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {report.suggestedReviewers.map((rev, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3"
                >
                  <img
                    src={rev.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                    alt={rev.name}
                    className="w-9 h-9 rounded-full object-cover border border-[var(--border-color)]"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-[var(--text-primary)] truncate">
                      {rev.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] truncate">
                      {rev.role}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

