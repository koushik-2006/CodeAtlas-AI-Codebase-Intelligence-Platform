"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import {
  Sparkles,
  Copy,
  Check,
  ArrowLeft,
  AlertTriangle,
  Code2,
  FileText,
  Activity,
  CheckCircle2,
  RefreshCw,
  Square,
  Wrench,
  Send,
  Printer,
  Download,
  Bot,
  ExternalLink,
  Split,
  ChevronRight,
} from "lucide-react";
import { MarkdownMessage } from "@/components/assistant/MarkdownMessage";
import { MermaidFlowchart } from "./MermaidFlowchart";
import { BugMarker } from "@/lib/demo/explorer-engine";

interface CodeExplanationResultProps {
  modeTitle?: string;
  markdownText?: string;
  mermaidChart?: string | null;
  isLoading?: boolean;
  error?: string | null;
  bugMarkers?: BugMarker[];
  fixedCode?: string;
  diff?: {
    before: string;
    after: string;
    explanation: string;
  };
  onApplyFix?: (fixedCode: string) => void;
  onReturnToEditor: () => void;
  onRetry?: () => void;
  onStop?: () => void;
  onAskFollowUp?: (question: string) => void;
  codeContext?: string;
}

export function CodeExplanationResult({
  modeTitle = "Code Intelligence Analysis",
  markdownText = "",
  mermaidChart = null,
  isLoading = false,
  error = null,
  bugMarkers = [],
  fixedCode,
  diff,
  onApplyFix,
  onReturnToEditor,
  onRetry,
  onStop,
  onAskFollowUp,
  codeContext = "",
}: CodeExplanationResultProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [copied, setCopied] = useState(false);
  const [fixApplied, setFixApplied] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpThreads, setFollowUpThreads] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [viewDiffMode, setViewDiffMode] = useState<"side-by-side" | "unified">("side-by-side");

  const handleCopyResult = () => {
    navigator.clipboard.writeText(markdownText || mermaidChart || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyFix = () => {
    if (fixedCode && onApplyFix) {
      onApplyFix(fixedCode);
      setFixApplied(true);
      setTimeout(() => setFixApplied(false), 3000);
    }
  };

  const handleExportMarkdown = () => {
    const content = `# CodeAtlas Analysis: ${modeTitle}\n\nGenerated on ${new Date().toLocaleString()}\n\n${markdownText}\n\n${
      mermaidChart ? `\`\`\`mermaid\n${mermaidChart}\n\`\`\`` : ""
    }`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codeatlas-analysis-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuery.trim() || isAskingFollowUp) return;

    const q = followUpQuery.trim();
    setFollowUpQuery("");
    setIsAskingFollowUp(true);

    try {
      if (onAskFollowUp) {
        onAskFollowUp(q);
      } else {
        // Simulated response if parent didn't provide custom callback
        setTimeout(() => {
          setFollowUpThreads((prev) => [
            ...prev,
            {
              question: q,
              answer: `**Follow-up Response:**\nRegarding *"${q}"*, the primary function maintains deterministic invariant state. In a high-concurrency production workload, ensure that boundary conditions and null dereferences are shielded as demonstrated in the recommendations above.`,
            },
          ]);
          setIsAskingFollowUp(false);
        }, 600);
      }
    } catch {
      setIsAskingFollowUp(false);
    }
  };

  return (
    <div
      className={`mt-6 rounded-3xl border overflow-hidden transition-all shadow-sm ${
        isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-white border-[#E8E5F4]"
      }`}
    >
      {/* Top Banner & Header */}
      <div className="p-6 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4 bg-[var(--bg-page)]/40 print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
                {modeTitle}
              </h3>
              <span className="font-mono text-[10px] uppercase font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-full border border-[var(--primary)]/20">
                {isLoading ? "Analyzing..." : "Complete"}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Multi-perspective verification with interactive fix applying and follow-ups
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stop Button */}
          {isLoading && onStop && (
            <button
              type="button"
              onClick={onStop}
              className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 font-bold text-xs flex items-center gap-1.5 hover:bg-rose-500/20 active:scale-95 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {/* Apply Fix Button (if fixed code available) */}
          {fixedCode && onApplyFix && (
            <button
              type="button"
              onClick={handleApplyFix}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-emerald-500 active:scale-95 transition-all"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{fixApplied ? "Fix Applied to Editor! ✓" : "Apply Fix to Editor"}</span>
            </button>
          )}

          {/* Regenerate Button */}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
              title="Regenerate analysis"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </button>
          )}

          {/* Copy Result */}
          <button
            type="button"
            onClick={handleCopyResult}
            disabled={!markdownText && !mermaidChart}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 ${
              isDark
                ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3] hover:bg-[#202735]"
                : "bg-white border-[#E8E5F4] text-[#1E2022] hover:bg-[#FAF9FF]"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Export Markdown */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs flex items-center gap-1.5"
            title="Download analysis markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export MD</span>
          </button>

          {/* Print / Save PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs flex items-center gap-1.5"
            title="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {/* Send to AI Assistant */}
          <Link
            href={`/assistant?q=${encodeURIComponent(
              `Can you review this code and analysis?\n\nCode snippet:\n${codeContext.slice(
                0,
                300
              )}\n\nAnalysis:\n${(markdownText || "").slice(0, 300)}`
            )}`}
            className="px-3 py-1.5 rounded-xl border border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 font-bold text-xs flex items-center gap-1.5"
            title="Open in AI Assistant with full context"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Send to Assistant</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </Link>

          {/* Back to Editor */}
          <button
            type="button"
            onClick={onReturnToEditor}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--primary)] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Editor</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-6">
        {/* Error / Offline Banner with Retry */}
        {error && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-sm text-amber-500">
                  AI Service Notification · Local Offline Analysis Active
                </span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {error}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  CodeAtlas generated complete offline deterministic metrics, local AST walkthrough, and structural charts below so your workflow is never interrupted.
                </p>
              </div>
            </div>
            {onRetry && (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 hover:bg-amber-400 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Cloud AI</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bug Markers Highlighting Banner (if present) */}
        {bugMarkers.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-rose-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Detected {bugMarkers.length} Security & Logic Issues in Code
              </span>
              {fixedCode && onApplyFix && (
                <button
                  type="button"
                  onClick={handleApplyFix}
                  className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3" />
                  <span>Apply Fix to Editor</span>
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-3 pt-1">
              {bugMarkers.map((b, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 uppercase">
                      Line {b.line} · {b.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                    {b.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optimization Diff Viewer (if available) */}
        {diff && (
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? "bg-[#0A0E17] border-[#242B39]" : "bg-[#FAF9FF] border-[#E8E5F4]"
            }`}
          >
            <div className="p-3.5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-page)]/50">
              <span className="font-mono text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Split className="w-4 h-4 text-[var(--primary)]" />
                Optimization Diff: Before vs After
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setViewDiffMode("side-by-side")}
                  className={`px-2 py-0.5 rounded ${
                    viewDiffMode === "side-by-side"
                      ? "bg-[var(--primary)] text-white font-bold"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  Side-by-side
                </button>
                <button
                  type="button"
                  onClick={() => setViewDiffMode("unified")}
                  className={`px-2 py-0.5 rounded ${
                    viewDiffMode === "unified"
                      ? "bg-[var(--primary)] text-white font-bold"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  Unified
                </button>
              </div>
            </div>

            {viewDiffMode === "side-by-side" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--border-color)] text-xs font-mono">
                <div className="p-4 space-y-2">
                  <span className="text-[11px] font-bold text-rose-400 block">
                    — Before (Current Buffer)
                  </span>
                  <pre className="overflow-x-auto text-rose-300/90 whitespace-pre leading-5">
                    {diff.before}
                  </pre>
                </div>
                <div className="p-4 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 block">
                    + After (Optimized Proposal)
                  </span>
                  <pre className="overflow-x-auto text-emerald-300 whitespace-pre leading-5">
                    {diff.after}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-4 font-mono text-xs space-y-1 overflow-x-auto leading-5">
                {diff.before.split("\n").map((l, i) => (
                  <div key={`b-${i}`} className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                    - {l}
                  </div>
                ))}
                {diff.after.split("\n").map((l, i) => (
                  <div key={`a-${i}`} className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    + {l}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Visual Flowchart (if generated) */}
        {mermaidChart && (
          <div>
            <MermaidFlowchart chart={mermaidChart} isDark={isDark} />
          </div>
        )}

        {/* Streaming / Rendered Markdown Content */}
        {markdownText ? (
          <div
            className={`p-6 rounded-2xl border ${
              isDark ? "bg-[#0A0F19] border-[#242B39]" : "bg-[#FAF9FF] border-[#E8E5F4]"
            }`}
          >
            <MarkdownMessage content={markdownText} />
            {isLoading && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-color)] text-xs font-mono text-[var(--primary)]">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--primary)] animate-ping" />
                <span>Generating intelligent analysis...</span>
              </div>
            )}
          </div>
        ) : (
          isLoading && (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-[var(--text-primary)]">
                  Analyzing code structure and reasoning...
                </p>
                <p className="text-xs text-[var(--text-secondary)] font-mono">
                  Streaming tokens will appear in real time below
                </p>
              </div>
            </div>
          )
        )}

        {/* Follow-up Interactive Conversation Threads */}
        {followUpThreads.length > 0 && (
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-secondary)] tracking-wider">
              Follow-Up Inquiries:
            </h4>
            {followUpThreads.map((t, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border space-y-2 ${
                  isDark ? "bg-[#0A0E17] border-[#242B39]" : "bg-white border-[#E8E5F4]"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)]">
                  <ChevronRight className="w-4 h-4" />
                  <span>{t.question}</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] pl-6">
                  <MarkdownMessage content={t.answer} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ask a Follow-up Input Box */}
        <form onSubmit={handleSendFollowUp} className="pt-2 print:hidden">
          <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 block">
            Ask a Follow-Up Question:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={followUpQuery}
              onChange={(e) => setFollowUpQuery(e.target.value)}
              placeholder="e.g. How does this perform with 100,000 items? Can we make this tail-recursive?"
              className={`flex-1 p-3 rounded-2xl border text-xs sm:text-sm outline-none transition-all ${
                isDark
                  ? "bg-[#0A0E17] border-[#30363D] text-[#E6EDF3] focus:border-[var(--primary)]"
                  : "bg-white border-[#E8E5F4] text-[#1E2022] focus:border-[var(--primary)]"
              }`}
            />
            <button
              type="submit"
              disabled={!followUpQuery.trim() || isAskingFollowUp}
              className="px-5 py-3 rounded-2xl bg-[var(--primary)] text-white font-bold text-xs flex items-center gap-1.5 hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
