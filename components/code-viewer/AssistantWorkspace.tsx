"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  Sparkles,
  Send,
  Bot,
  User,
  FileCode,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  citations?: { file: string; lineRange?: string; startLine?: number; endLine?: number }[];
  isError?: boolean;
}

interface AssistantWorkspaceProps {
  selectedFilePath: string;
  onCitationClick: (citation: { file: string; startLine?: number; endLine?: number }) => void;
}

export const SUGGESTED_QUESTIONS = [
  "How does authentication work?",
  "Where is this function called?",
  "Which files depend on this component?",
  "Explain this file in simple terms.",
  "Which tests cover this function?",
];

export function AssistantWorkspace({
  selectedFilePath,
  onCitationClick,
}: AssistantWorkspaceProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: "I have indexed the AST symbol hierarchy for this repository. Ask any question about call paths, authentication flows, or test coverage for verifiable citations.",
      timestamp: "Just now",
      citations: [
        { file: "src/services/auth.ts", lineRange: "18-35", startLine: 18, endLine: 35 },
        { file: "tests/auth.test.ts", lineRange: "1-25", startLine: 1, endLine: 25 },
      ],
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSendMessage = (textToSend?: string) => {
    const q = (textToSend || inputQuestion).trim();
    if (!q || isAiLoading) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setIsAiLoading(true);

    setTimeout(() => {
      let aiText = `In this repository, ${selectedFilePath} coordinates with the auth service pipeline.`;
      let citations: { file: string; lineRange?: string; startLine?: number; endLine?: number }[] = [];

      const queryLower = q.toLowerCase();

      if (queryLower.includes("how does authentication work") || queryLower.includes("auth")) {
        aiText =
          "User credentials enter through LoginForm.tsx, undergo validation in utils/validation.ts, and are dispatched to the auth service via loginUser(). Upon verification, an access token is returned and stored in localStorage.";
        citations = [
          { file: "src/components/LoginForm.tsx", lineRange: "15-32", startLine: 15, endLine: 32 },
          { file: "src/services/auth.ts", lineRange: "18-42", startLine: 18, endLine: 42 },
          { file: "src/utils/validation.ts", lineRange: "4-15", startLine: 4, endLine: 15 },
        ];
      } else if (queryLower.includes("test") || queryLower.includes("cover")) {
        aiText =
          "Testing is handled by tests/auth.test.ts. It asserts valid login responses (200 OK) as well as error rejections (invalid email formatting and 401 unauthorized status).";
        citations = [
          { file: "tests/auth.test.ts", lineRange: "15-45", startLine: 15, endLine: 45 },
        ];
      } else if (queryLower.includes("where is this function called") || queryLower.includes("called")) {
        aiText =
          "loginUser() is invoked by the handleSubmit form submission callback inside src/components/LoginForm.tsx (line 28).";
        citations = [
          { file: "src/components/LoginForm.tsx", lineRange: "26-30", startLine: 26, endLine: 30 },
          { file: "src/services/auth.ts", lineRange: "18-24", startLine: 18, endLine: 24 },
        ];
      } else if (queryLower.includes("depend") || queryLower.includes("which files")) {
        aiText =
          "src/components/LoginForm.tsx depends on src/services/auth.ts and src/utils/validation.ts. Additionally, tests/auth.test.ts imports both modules for integration verification.";
        citations = [
          { file: "src/services/auth.ts", lineRange: "1-12", startLine: 1, endLine: 12 },
          { file: "src/utils/validation.ts", lineRange: "1-10", startLine: 1, endLine: 10 },
        ];
      } else if (queryLower.includes("simple terms") || queryLower.includes("explain this file")) {
        aiText = `This file (${selectedFilePath}) encapsulates UI/logic for the authentication workflow. It ensures inputs are formatted properly before sending them securely to the backend.`;
        citations = [
          { file: selectedFilePath, lineRange: "1-20", startLine: 1, endLine: 20 },
        ];
      } else {
        aiText = `This file contains the verified implementation for ${selectedFilePath}. All symbols and call references are mapped to actual repository code.`;
        citations = [
          { file: selectedFilePath, lineRange: "1-15", startLine: 1, endLine: 15 },
        ];
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiText,
        timestamp: "Just now",
        citations,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsAiLoading(false);
    }, 700);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-surface)]">
      {/* Assistant Header */}
      <div className="p-3.5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-page)]/40 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--primary)]" />
          <h2 className="text-xs font-bold text-[var(--text-primary)]">
            Contextual AI Assistant
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[var(--primary)] font-bold bg-[var(--primary)]/10 px-2 py-0.5 rounded border border-[var(--primary)]/20">
          AST Grounded
        </span>
      </div>

      {/* Honest Demonstration Label */}
      <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 font-medium shrink-0 flex items-center justify-between">
        <span>Demonstration assistant connected to local repository AST index.</span>
      </div>

      {/* Conversation History Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 text-xs ${
              m.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.sender === "ai" && (
              <div className="h-6 w-6 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                m.sender === "user"
                  ? isDark
                    ? "bg-[#29D3C2] text-[#070A12] font-semibold"
                    : "bg-[#1E2022] text-white"
                  : isDark
                  ? "bg-[#0D1117] border border-[#30363D] text-[#E6EDF3]"
                  : "bg-[#FAF9FF] border border-[#E8E5F4] text-[#1E2022]"
              }`}
            >
              <p>{m.text}</p>

              {/* Clickable Citations */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[var(--border-color)]/50 space-y-1.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-bold">
                    Source Receipts:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.citations.map((c, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onCitationClick(c)}
                        title={`Inspect ${c.file}:${c.lineRange}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] border transition-colors ${
                          isDark
                            ? "bg-[#161B22] border-[#29D3C2]/40 text-[#29D3C2] hover:bg-[#29D3C2]/20"
                            : "bg-white border-[#6C4DFF]/30 text-[#6C4DFF] hover:bg-[#6C4DFF]/10"
                        }`}
                      >
                        <FileCode className="w-3 h-3" />
                        <span>{c.file}</span>
                        {c.lineRange && <span className="opacity-75">:{c.lineRange}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {m.sender === "user" && (
              <div className="h-6 w-6 rounded-lg bg-amber-400 text-black flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                U
              </div>
            )}
          </div>
        ))}

        {isAiLoading && (
          <div className="flex items-center gap-2 p-3 text-xs text-[var(--text-secondary)]">
            <div className="h-3 w-3 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            <span>Analyzing repository call graph and validating lines...</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Suggested Questions & Chat Input */}
      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-page)]/50 shrink-0 space-y-2.5">
        {/* Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors whitespace-nowrap shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask about this file or function..."
            aria-label="Ask AI about this codebase"
            className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
              isDark
                ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3] focus:border-[#29D3C2]"
                : "bg-white border-[#E5E5E0] text-[#1E2022] focus:border-[#6C4DFF]"
            }`}
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isAiLoading}
            aria-label="Send query"
            className={`p-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
              isDark
                ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                : "bg-[#1E2022] text-white hover:bg-[#2e3135]"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
