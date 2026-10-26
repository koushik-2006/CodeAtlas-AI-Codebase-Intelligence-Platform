"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import {
  CheckCircle2,
  HelpCircle,
  FileCode,
  Copy,
  Check,
  Bot,
  User,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { AssistantMessage, CitationReference } from "@/types/assistant";
import { MarkdownMessage } from "./MarkdownMessage";

interface ChatMessageProps {
  message: AssistantMessage;
  repositoryId?: string;
  onRetry?: () => void;
}

export function ChatMessage({ message, repositoryId = "sample-project", onRetry }: ChatMessageProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.sender === "user";

  return (
    <div
      className={`rounded-2xl p-4 text-xs transition-all ${
        isUser
          ? isDark
            ? "bg-[#111725] text-[#F3F5FA] border border-[#242B39] ml-8"
            : "bg-[#6C4DFF] text-white font-medium ml-8 shadow-soft"
          : isDark
          ? "bg-[#0A0F19] text-[#F3F5FA] border border-[#242B39] mr-4"
          : "bg-white text-[#19143D] border border-[#E8E5F4] mr-4 shadow-xs"
      }`}
    >
      {/* Header bar: Sender identity + Timestamp + Copy */}
      <div className="font-semibold mb-2 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          {isUser ? (
            <div className="h-5 w-5 rounded-md bg-amber-400 text-black flex items-center justify-center font-bold text-[10px]">
              U
            </div>
          ) : (
            <div className="h-5 w-5 rounded-md bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center">
              <Bot className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="font-bold text-[var(--text-primary)]">
            {isUser ? "You" : "CodeAtlas AI Assistant"}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-70">
            {message.timestamp}
          </span>
        </div>

        {!isUser && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded">
              Grounded
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Copy message"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Message Text */}
      {isUser ? (
        <div className="leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-[13px] text-white">
          {message.text}
        </div>
      ) : (
        <MarkdownMessage content={message.text} repositoryId={repositoryId} />
      )}

      {/* Clickable Source Receipts / Citations */}
      {message.citations && message.citations.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[var(--border-color)]/60 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--text-secondary)] block">
            Verified Source Receipts:
          </span>
          <div className="flex flex-col gap-1.5">
            {message.citations.map((cite, idx) => {
              const file = typeof cite === "string" ? cite.split(":")[0] : cite.file;
              const lineRange =
                typeof cite === "string"
                  ? cite.split(":")[1] || ""
                  : cite.lineRange || (cite.startLine ? `${cite.startLine}-${cite.endLine}` : "");
              const startLine =
                typeof cite === "string" && cite.split(":")[1]
                  ? parseInt(cite.split(":")[1].split("-")[0], 10)
                  : typeof cite !== "string"
                  ? cite.startLine || 1
                  : 1;
              const reason = typeof cite !== "string" ? cite.reason : undefined;
              const symbol = typeof cite !== "string" ? cite.symbol : undefined;

              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border text-xs ${
                    isDark
                      ? "bg-[#161B22] border-[#29D3C2]/30 text-[#E6EDF3]"
                      : "bg-white border-[#6C4DFF]/25 text-[#1E2022]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/repositories/${repositoryId}?file=${encodeURIComponent(file)}&line=${startLine}`}
                      className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold transition-colors ${
                        isDark ? "text-[#29D3C2] hover:underline" : "text-[#6C4DFF] hover:underline"
                      }`}
                      title={`Open ${file} in Repository Explorer`}
                    >
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span>{file}</span>
                      {lineRange && <span className="opacity-80">:{lineRange}</span>}
                      {symbol && <span className="text-[10px] font-normal opacity-85">({symbol})</span>}
                      <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                    </Link>
                    <span className="text-[9px] font-mono uppercase font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Verified
                    </span>
                  </div>
                  {reason && (
                    <p className="mt-1 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      {reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmed Facts Breakdown */}
      {message.confirmedFacts && message.confirmedFacts.length > 0 && (
        <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
          <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 uppercase tracking-wide">
            <CheckCircle2 className="w-3 h-3" /> Confirmed Source Facts:
          </span>
          <ul className="list-disc pl-4 text-[11px] text-[var(--text-secondary)] space-y-0.5">
            {message.confirmedFacts.map((f, idx) => (
              <li key={idx}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Inferred Architecture Breakdown */}
      {message.inferredFacts && message.inferredFacts.length > 0 && (
        <div className="mt-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
          <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 uppercase tracking-wide">
            <HelpCircle className="w-3 h-3" /> Reasonable Inferences:
          </span>
          <ul className="list-disc pl-4 text-[11px] text-[var(--text-secondary)] space-y-0.5">
            {message.inferredFacts.map((f, idx) => (
              <li key={idx}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Unavailable Information Warning */}
      {message.unavailableInfo && message.unavailableInfo.length > 0 && (
        <div className="mt-2 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1">
          <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 uppercase tracking-wide">
            <AlertTriangle className="w-3 h-3" /> Unavailable Information:
          </span>
          <ul className="list-disc pl-4 text-[11px] text-[var(--text-secondary)] space-y-0.5">
            {message.unavailableInfo.map((u, idx) => (
              <li key={idx}>{u}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Error state with retry action */}
      {message.isError && onRetry && (
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-red-500/20">
          <span className="text-red-500 font-semibold text-[11px]">Request failed to complete.</span>
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600"
          >
            Retry Query
          </button>
        </div>
      )}
    </div>
  );
}
