"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  HelpCircle,
  FileCode,
  ShieldCheck,
  AlertCircle,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CrossRepoAnswerResponse } from "@/types/multi-repo";

interface CrossRepoQAAssistantProps {
  onAskQuestion: (q: string) => Promise<CrossRepoAnswerResponse>;
  selectedRepoCount: number;
}

export function CrossRepoQAAssistant({ onAskQuestion, selectedRepoCount }: CrossRepoQAAssistantProps) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<CrossRepoAnswerResponse | null>(null);

  const samplePrompts = [
    "Which repository defines the authentication service?",
    "Where is the @acme/shared-utils package used across projects?",
    "Are there duplicate email validation implementations?",
    "Which services depend on the authentication session API?",
  ];

  const handleSend = async (qToSend?: string) => {
    const q = (qToSend || question).trim();
    if (!q || isLoading) return;

    if (qToSend) setQuestion(qToSend);
    setIsLoading(true);

    try {
      const res = await onAskQuestion(q);
      setResponse(res);
    } catch (err) {
      console.error("Cross-repo QA error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Input Card */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-[#19143D] dark:text-[#F3F5FA]">
          <Sparkles className="w-4 h-4 text-[#6C4DFF] dark:text-[#29D3C2]" />
          <span>Cross-Repository AI Architectural Assistant</span>
        </div>
        <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8]">
          Ask questions spanning across {selectedRepoCount} authorized codebases. Answers are grounded in verified AST symbols, dependency graphs, and package manifests.
        </p>

        {/* Input box */}
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about inter-repository architecture, duplicate patterns, or shared contracts..."
            rows={3}
            className="w-full p-4 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-sm text-[#19143D] dark:text-[#F3F5FA] placeholder-[#8E95A8] focus:outline-none focus:ring-2 focus:ring-[#6C4DFF] dark:focus:ring-[#29D3C2] resize-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !question.trim()}
            className="absolute right-3 bottom-3 px-4 py-2 rounded-xl bg-[#6C4DFF] dark:bg-[#29D3C2] text-white dark:text-[#0D111A] font-medium text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLoading ? "Analyzing..." : "Ask Cross-Repo"}</span>
          </button>
        </div>

        {/* Sample Prompt Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-[#8E95A8] font-medium">Try asking:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-lg bg-[#F7F5FE] dark:bg-[#141926] hover:bg-[#EAE6FD] dark:hover:bg-[#1E2638] text-[#6E6A8A] dark:text-[#8E95A8] border border-[#EAE6FD] dark:border-[#242B3D] transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Answer Response Card */}
      {isLoading && (
        <div className="p-12 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-[#6C4DFF] dark:border-[#29D3C2] border-t-transparent rounded-full mb-3" />
          <p className="text-sm text-[#6E6A8A] dark:text-[#8E95A8]">
            Traversing cross-repository graphs and retrieving source evidence...
          </p>
        </div>
      )}

      {!isLoading && response && (
        <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAE6FD] dark:border-[#1E2638]">
            <div className="flex items-center gap-2">
              <Badge variant="mint" className="text-xs uppercase font-mono">
                {response.confidence}
              </Badge>
              <span className="text-xs text-[#8E95A8]">
                Scope: {response.repositoryIds.length} Repositories
              </span>
            </div>

            <span className="text-xs font-mono text-[#8E95A8]">
              Provider: {response.provider}
            </span>
          </div>

          {/* Formatted Answer */}
          <div className="prose dark:prose-invert max-w-none text-sm text-[#19143D] dark:text-[#F3F5FA] whitespace-pre-wrap font-sans leading-relaxed">
            {response.answer}
          </div>

          {/* Source Citations with Repo and Revision Attribution */}
          {response.citations.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#EAE6FD] dark:border-[#1E2638]">
              <h4 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2FD6A0]" />
                Repository-Specific Source Citations ({response.citations.length})
              </h4>

              <div className="grid gap-2">
                {response.citations.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono">
                        <Badge variant="brand" className="text-[10px] uppercase">
                          {c.repositoryName}
                        </Badge>
                        <span className="text-[#8E95A8] font-mono text-[11px]">
                          {c.revision}
                        </span>
                        <span className="text-[#8E95A8]">·</span>
                        <span className="font-semibold text-[#19143D] dark:text-[#F3F5FA]">
                          {c.filePath}:{c.startLine}
                        </span>
                      </div>

                      {c.symbolName && (
                        <Badge variant="cyan" className="text-[10px]">
                          {c.symbolName}
                        </Badge>
                      )}
                    </div>

                    <div className="font-mono text-[11px] text-[#6E6A8A] dark:text-[#D1D5DB] bg-white dark:bg-[#0D111A] p-2 rounded-lg border border-[#EAE6FD] dark:border-[#1E2638] overflow-x-auto">
                      {c.snippet}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limitations Notice */}
          {response.limitations.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Limitations & Scope Disclosure:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {response.limitations.map((l, idx) => (
                  <li key={idx}>{l}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
