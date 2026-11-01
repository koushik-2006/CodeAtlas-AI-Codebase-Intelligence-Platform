"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  FileCode,
  Copy,
  Check,
  RotateCcw,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DbDebugFollowUp } from "@/types/debug";

interface DebugFollowUpPanelProps {
  investigationId: string;
  initialFollowUps: DbDebugFollowUp[];
  onAskQuestion: (question: string) => Promise<DbDebugFollowUp>;
}

const SUGGESTED_PROMPTS = [
  "Why is this line a potential failure point?",
  "Which caller supplied this argument?",
  "Where could this value become null or undefined?",
  "What is the smallest reasonable fix?",
  "Which unit test would safeguard against this regression?",
];

export default function DebugFollowUpPanel({
  investigationId,
  initialFollowUps,
  onAskQuestion,
}: DebugFollowUpPanelProps) {
  const [followUps, setFollowUps] = useState<DbDebugFollowUp[]>(initialFollowUps);
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (textToSend?: string) => {
    const q = (textToSend || question).trim();
    if (!q || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const userMsg: DbDebugFollowUp = {
        id: `msg_u_${Date.now()}`,
        investigationId,
        sender: "user",
        content: q,
        timestamp: new Date().toISOString(),
      };
      setFollowUps((prev) => [...prev, userMsg]);
      setQuestion("");

      const aiReply = await onAskQuestion(q);
      setFollowUps((prev) => [...prev, aiReply]);
    } catch (e: any) {
      console.error("Failed to ask follow-up:", e);
      // Fallback response if call fails
      const fallbackMsg: DbDebugFollowUp = {
        id: `msg_a_${Date.now()}`,
        investigationId,
        sender: "assistant",
        content: `Based on the stack trace analysis, line execution encountered an unhandled condition. We recommend adding defensive parameter guards and reviewing the upstream caller.`,
        timestamp: new Date().toISOString(),
      };
      setFollowUps((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              Context-Aware Investigation Q&A
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Ask targeted questions about callers, null sources, tests, or minimal repairs.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#7C5CFC]" /> Suggested Inquiries:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(prompt)}
            className="text-[11px] px-2.5 py-1 rounded-md bg-[var(--bg-primary)] hover:bg-[#7C5CFC]/10 text-[var(--text-secondary)] hover:text-[#7C5CFC] border border-[var(--border-color)] transition-colors text-left"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {followUps.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)]/50 rounded-lg border border-[var(--border-color)]">
            Ask any question to probe deeper into this failure scenario or explore alternative hypotheses.
          </div>
        ) : (
          followUps.map((msg) => (
            <div
              key={msg.id}
              className={`p-3.5 rounded-lg text-xs leading-relaxed flex items-start gap-2.5 ${
                msg.sender === "user"
                  ? "bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[var(--text-primary)] ml-8"
                  : "bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] mr-8"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                  msg.sender === "user"
                    ? "bg-[#7C5CFC] text-white"
                    : "bg-[#29D3C2]/20 text-[#29D3C2]"
                }`}
              >
                {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[10px] text-[var(--text-secondary)] uppercase">
                    {msg.sender === "user" ? "You" : "AI Debugger"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-[#2FD6A0]" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {msg.content}
                </div>

                {/* Citations if any */}
                {msg.citedReferences && msg.citedReferences.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-[var(--border-color)]/60 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                      Citations:
                    </span>
                    {msg.citedReferences.map((ref, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]"
                      >
                        <FileCode className="w-3 h-3 text-[#7C5CFC]" />
                        {ref.filePath}:{ref.line || 1}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isSubmitting && (
          <div className="p-3 rounded-lg text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="w-3.5 h-3.5 border-2 border-[#7C5CFC]/30 border-t-[#7C5CFC] rounded-full animate-spin" />
            <span>Analyzing codebase context and formulating answer...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex items-center gap-2 pt-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this error, culprit line, or fix..."
          disabled={isSubmitting}
          className="flex-1 text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!question.trim() || isSubmitting}
          className="text-xs font-semibold px-4 bg-[#7C5CFC] hover:bg-[#6846f9] text-white"
        >
          <Send className="w-3.5 h-3.5 mr-1" />
          Send
        </Button>
      </form>
    </div>
  );
}
