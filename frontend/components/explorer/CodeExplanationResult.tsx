"use client";

import { useState } from "react";
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
  Terminal,
  RefreshCw,
  Square,
} from "lucide-react";
import { MarkdownMessage } from "@/components/assistant/MarkdownMessage";
import { MermaidFlowchart } from "./MermaidFlowchart";

interface CodeExplanationResultProps {
  modeTitle?: string;
  markdownText?: string;
  mermaidChart?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onReturnToEditor: () => void;
  onRetry?: () => void;
  onStop?: () => void;
}

export function CodeExplanationResult({
  modeTitle = "Code Intelligence Analysis",
  markdownText = "",
  mermaidChart = null,
  isLoading = false,
  error = null,
  onReturnToEditor,
  onRetry,
  onStop,
}: CodeExplanationResultProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [copied, setCopied] = useState(false);

  const handleCopyResult = () => {
    navigator.clipboard.writeText(markdownText || mermaidChart || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`mt-6 rounded-3xl border overflow-hidden transition-all shadow-sm ${
        isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-white border-[#E8E5F4]"
      }`}
    >
      {/* Top Banner & Header */}
      <div className="p-6 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4 bg-[var(--bg-page)]/40">
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
                {isLoading ? "Streaming Tokens..." : "Complete"}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Real-time analysis powered by Firebase AI Logic & Gemini Flash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
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
                <span>Copy Result</span>
              </>
            )}
          </button>

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
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-sm text-rose-500">Analysis Error</span>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{error}</p>
              </div>
            </div>
            {onRetry && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-rose-600 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Analysis</span>
                </button>
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
                <span>Gemini is generating response...</span>
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
      </div>
    </div>
  );
}
