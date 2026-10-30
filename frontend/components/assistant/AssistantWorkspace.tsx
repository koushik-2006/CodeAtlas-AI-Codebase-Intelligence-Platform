"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { assistantService } from "@/services/assistant-service";
import { AssistantMessage, Conversation } from "@/types/assistant";
import {
  Sparkles,
  FolderGit2,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Network,
  Activity,
} from "lucide-react";

import { useRepositories } from "@/hooks/useRepositories";

const DEFAULT_SUGGESTED_QUESTIONS = [
  "How does authentication work?",
  "Where is this function called?",
  "What happens when a user submits this form?",
  "Which tests cover this service?",
  "What might break if I modify this function?",
  "Explain this file in simple terms.",
];

export function AssistantWorkspace() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { repositories } = useRepositories();

  // Repository selection state
  const [selectedRepo, setSelectedRepo] = useState<string>("sample-project");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(DEFAULT_SUGGESTED_QUESTIONS);

  // Load dynamic suggestions when selectedRepo changes
  useEffect(() => {
    if (selectedRepo && selectedRepo !== "none") {
      assistantService.getSuggestedQuestions(selectedRepo).then((suggs) => {
        if (suggs && suggs.length > 0) setSuggestedQuestions(suggs);
      });
    } else {
      setSuggestedQuestions(DEFAULT_SUGGESTED_QUESTIONS);
    }
  }, [selectedRepo]);

  // Conversation list & current active conversation
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "conv-1",
      title: "Authentication Workflow & Symbols",
      repositoryId: "sample-project",
      createdAt: "Today at 10:14 AM",
      updatedAt: "Today at 10:20 AM",
      messages: [
        {
          id: "m-1",
          sender: "user",
          text: "How does authentication work?",
          timestamp: "10:14 AM",
        },
        {
          id: "m-2",
          sender: "ai",
          text: "Authentication starts when a user submits `LoginForm.tsx`. Client validation runs in `src/utils/validation.ts`, and `loginUser()` in `src/services/auth.ts` queries `db.users` to confirm the account is active. If the hash matches, a signed bearer token is issued.",
          timestamp: "10:15 AM",
          citations: [
            { file: "src/components/LoginForm.tsx", lineRange: "15-32", startLine: 15, endLine: 32 },
            { file: "src/services/auth.ts", lineRange: "18-42", startLine: 18, endLine: 42 },
            { file: "src/utils/validation.ts", lineRange: "4-15", startLine: 4, endLine: 15 },
          ],
          confirmedFacts: [
            "LoginForm.tsx binds email/password inputs and invokes loginUser()",
            "auth.ts:loginUser rejects inactive users before password verification",
            "tests/auth.test.ts asserts both 200 OK and 401 AuthError codes",
          ],
          inferredFacts: [
            "Session tokens expire after a configured TTL period",
          ],
        },
      ],
    },
  ]);

  const [activeConversationId, setActiveConversationId] = useState<string>("conv-1");
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const messages = useMemo(() => currentConversation?.messages || [], [currentConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleStartNewConversation = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: "New Investigation",
      repositoryId: selectedRepo,
      createdAt: "Just now",
      updatedAt: "Just now",
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
    setConfirmClearOpen(false);
  };

  const handleClearCurrentConversation = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, messages: [] } : c))
    );
    setConfirmClearOpen(false);
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const handleAskQuestion = async (queryText?: string) => {
    const q = (queryText || inputQuestion).trim();
    if (!q || isLoading) return;

    setLastFailedQuery(null);

    const userMessage: AssistantMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: "Just now",
    };

    // Update conversation title if this is the first message
    const updatedTitle =
      messages.length === 0 ? q.slice(0, 36) + (q.length > 36 ? "..." : "") : currentConversation.title;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              title: updatedTitle,
              messages: [...c.messages, userMessage],
              updatedAt: "Just now",
            }
          : c
      )
    );

    setInputQuestion("");
    setIsLoading(true);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await assistantService.askQuestion(
        {
          repositoryId: selectedRepo,
          question: q,
        },
        { signal: controller.signal }
      );

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, messages: [...c.messages, response], updatedAt: "Just now" }
            : c
        )
      );
    } catch (err: any) {
      if (err?.name === "AbortError" || controller.signal.aborted) {
        return;
      }
      setLastFailedQuery(q);
      const errorMessage: AssistantMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: err?.message || "We encountered an error processing your codebase query. Please verify that your repository index is loaded.",
        timestamp: "Just now",
        isError: true,
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, messages: [...c.messages, errorMessage] }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Workspace Toolbar: Repository Selector + Conversation Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
        {/* Left: Repository Selector */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <FolderGit2 className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-[var(--text-secondary)]">Active Repository:</span>
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            aria-label="Select active repository"
            className={`py-1 px-2.5 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
              isDark
                ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                : "bg-white border-[#E5E5E0] text-[#1E2022]"
            }`}
          >
            {repositories.length > 0 ? (
              repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name} ({repo.status === "ready" ? `${repo.symbolCount || 0} symbols` : repo.status})
                </option>
              ))
            ) : (
              <option value="sample-project">sample-project (5 files indexed)</option>
            )}
            <option value="none">— No repository selected —</option>
          </select>
        </div>

        {/* Right: Cross-navigation actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/architecture"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
          >
            <Network className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Architecture Graph</span>
          </Link>

          <Link
            href="/change-impact"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span>Change Impact</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Conversation History Sidebar (col-span-3) + Conversation Area (col-span-9) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px] items-stretch">
        {/* Left Sidebar: Conversations Management */}
        <div
          className={`lg:col-span-3 rounded-2xl border p-4 flex flex-col justify-between ${
            isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-color)]">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Conversations
              </span>
              <button
                type="button"
                onClick={handleStartNewConversation}
                className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                  isDark
                    ? "bg-[#161B22] border-[#30363D] text-[#29D3C2] hover:bg-[#202735]"
                    : "bg-[#FAF9FF] border-[#E8E5F4] text-[#6C4DFF] hover:bg-[#F3F1FF]"
                }`}
                title="Start a new conversation"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* Conversation list */}
            <div className="space-y-1.5 max-h-[460px] overflow-y-auto">
              {conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all border ${
                      isActive
                        ? isDark
                          ? "bg-[#161B22] border-[#29D3C2]/50 text-[#F3F5FA] shadow-xs"
                          : "bg-[#FAF9FF] border-[#6C4DFF]/40 text-[#19143D] shadow-xs"
                        : isDark
                        ? "border-transparent text-[var(--text-secondary)] hover:bg-[#111725] hover:text-[#F3F5FA]"
                        : "border-transparent text-[var(--text-secondary)] hover:bg-[#FAF9FF] hover:text-[#19143D]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span className="font-bold text-xs truncate">{conv.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono opacity-60 pl-5">
                      <span>{conv.messages.length} messages</span>
                      <span>{conv.updatedAt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Clear Action */}
          <div className="pt-3 border-t border-[var(--border-color)]">
            {confirmClearOpen ? (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 space-y-2">
                <p className="font-semibold">Clear this conversation history?</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearCurrentConversation}
                    className="px-2.5 py-1 rounded-lg bg-red-500 text-white font-bold text-[11px]"
                  >
                    Yes, Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearOpen(false)}
                    className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                disabled={messages.length === 0}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-red-500 transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Conversation</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Main Chat Panel: Conversation Area (col-span-9) */}
        <div
          className={`lg:col-span-9 rounded-2xl border flex flex-col justify-between overflow-hidden shadow-sm ${
            isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-page)]/40 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              <h2 className="text-xs font-bold text-[var(--text-primary)]">
                {currentConversation.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[var(--primary)] font-bold bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-full border border-[var(--primary)]/20">
                AST Grounded · {selectedRepo}
              </span>
            </div>
          </div>

          {/* Honest Prototype Label */}
          <div className="px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 font-medium shrink-0 flex items-center justify-between">
            <span>
              Demonstration AI: Grounded in sample-project local AST index. No external cloud keys required.
            </span>
            <span className="font-mono">Deterministic Receipts</span>
          </div>

          {/* Conversation History / Empty State Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              /* Initial Empty State */
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-10 px-4">
                <div className="h-14 w-14 rounded-3xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-bold mb-4 shadow-sm">
                  <Sparkles className="w-7 h-7" />
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                  Understand your codebase with AI.
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  Ask questions about functions, files, dependencies, APIs, and application workflows.
                </p>

                {/* Suggested Questions Grid */}
                <div className="mt-8 grid gap-2.5 sm:grid-cols-2 w-full text-left">
                  {suggestedQuestions.map((questionText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAskQuestion(questionText)}
                      className={`p-3.5 rounded-2xl border text-xs font-medium transition-all group flex items-start justify-between gap-2 ${
                        isDark
                          ? "bg-[#161B22] border-[#30363D] hover:border-[#29D3C2] hover:bg-[#1E2533] text-[#F3F5FA]"
                          : "bg-[#FAF9FF] border-[#E8E5F4] hover:border-[#6C4DFF] hover:bg-white text-[#19143D]"
                      }`}
                    >
                      <span>{questionText}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[var(--primary)]" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message List */
              <>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    repositoryId={selectedRepo}
                    onRetry={() => lastFailedQuery && handleAskQuestion(lastFailedQuery)}
                  />
                ))}

                {isLoading && (
                  <div className="rounded-2xl p-4 mr-4 text-xs bg-[var(--bg-page)] border border-[var(--border-color)] flex items-center gap-3 text-[var(--text-secondary)] animate-pulse">
                    <div className="h-4 w-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>
                      Searching AST call graph, validating source line receipts, and formulating response...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Multiline Composer */}
          <ChatInput
            inputQuestion={inputQuestion}
            onInputChange={setInputQuestion}
            onSubmit={handleAskQuestion}
            isLoading={isLoading}
            onStop={handleStopGeneration}
          />
        </div>
      </div>
    </div>
  );
}
