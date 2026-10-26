"use client";

import { useRef, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Send, CornerDownLeft } from "lucide-react";

interface ChatInputProps {
  inputQuestion: string;
  onInputChange: (val: string) => void;
  onSubmit: (question?: string) => void;
  isLoading?: boolean;
}

export function ChatInput({
  inputQuestion,
  onInputChange,
  onSubmit,
  isLoading = false,
}: ChatInputProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputQuestion.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  return (
    <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-surface)] shrink-0">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (inputQuestion.trim() && !isLoading) {
            onSubmit();
          }
        }}
        className="relative"
      >
        <div
          className={`rounded-2xl border transition-all ${
            isDark
              ? "bg-[#0A0F19] border-[#242B39] focus-within:border-[#29D3C2]"
              : "bg-white border-[#E8E5F4] focus-within:border-[#6C4DFF] shadow-xs"
          }`}
        >
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputQuestion}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about functions, files, dependencies, APIs, and workflows... (Enter to send, Shift+Enter for newline)"
            aria-label="Codebase query composer"
            className="w-full resize-none p-3.5 pr-14 bg-transparent outline-none text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 leading-relaxed"
          />

          <div className="flex items-center justify-between px-3.5 pb-2.5 pt-1 text-[10px] font-mono text-[var(--text-secondary)]">
            <span className="hidden sm:inline">
              <kbd className="px-1 py-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-page)]">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded border border-[var(--border-color)] bg-[var(--bg-page)]">Shift + Enter</kbd> for newline
            </span>
            <span className="sm:hidden">Enter to send</span>

            <button
              type="submit"
              disabled={!inputQuestion.trim() || isLoading}
              aria-label="Send question"
              className={`p-2 rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 font-bold text-xs ${
                isDark ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]" : "bg-[#6C4DFF] text-white hover:bg-[#5b3ce6]"
              }`}
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
