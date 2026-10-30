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
  "Which test would verify this hypothesis?",
];

export default function DebugFollowUpPanel({
  investigationId,
  initialFollowUps,
  onAskQuestion,
}: DebugFollowUpPanelProps) {
  const [followUps, setFollowUps] = useState<DbDebugFollowUp[]>(initialFollowUps);
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (textToSend?: string) => {
    const q = (textToSend || question).trim();
    if (!q || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const userMsg: DbDebugFollowUp = {
        id: `temp_u_${Date.now()}`,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#8B7CFF]/15 text-[#8B7CFF] flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              Context-Aware Investigation Q&A
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Ask targeted questions about callers, null sources, tests, or minimal fixes.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#8B7CFF]" /> Suggested Questions:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(prompt)}
            className="text-[11px] px-2.5 py-1 rounded-md bg-[var(--bg-primary)] hover:bg-[#8B7CFF]/10 text-[var(--text-secondary)] hover:text-[#8B7CFF] border border-[var(--border-color)] transition-colors text-left"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {followUps.length === 0 ? (
          <div className="text-center py-6 text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)]/50 rounded-lg border border-[var(--border-color)]">
            Ask any question to probe deeper into this failure scenario.
          </div>
        ) : (
          followUps.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2.5 ${
                msg.sender === "user"
                  ? "bg-[#8B7CFF]/10 border border-[#8B7CFF]/20 text-[var(--text-primary)] ml-6"
                  : "bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] mr-6"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                  msg.sender === "user"
                    ? "bg-[#8B7CFF] text-white"
                    : "bg-[#29D3C2]/20 text-[#29D3C2]"
                }`}
              >
                {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Citations if any */}
                {msg.citedReferences && msg.citedReferences.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[var(--border-color)]/60 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                      Citations:
                    </span>
                    {msg.citedReferences.map((ref, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]"
                      >
                        <FileCode className="w-3 h-3 text-[#8B7CFF]" />
                        {ref.filePath}:{ref.line || 1}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
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
          disabled={isSubmitting}
          placeholder="Ask a question about this error, callers, or minimal fixes..."
          className="flex-1 text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:ring-1 focus:ring-[#8B7CFF]"
        />

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSubmitting || !question.trim()}
          className="text-xs"
        >
          {isSubmitting ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </Button>
      </form>
    </div>
  );
}
