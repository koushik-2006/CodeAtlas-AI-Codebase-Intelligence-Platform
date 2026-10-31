"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { aiService, ChatHistoryItem } from "@/services/ai-service";
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
import { Github } from "@/components/Icons";
import { useRepositories } from "@/hooks/useRepositories";

const DEFAULT_SUGGESTED_QUESTIONS = [
  "How does authentication work in this codebase?",
  "Explain the difference between optimistic concurrency and pessimistic locking.",
  "What might break if I modify the user session schema?",
  "Generate a TypeScript interface and validator for a repository metadata payload.",
  "Which design pattern is best for decoupling background worker pipelines?",
  "How can I optimize Next.js static exports for GitHub Pages?",
];

interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  default_branch: string;
  language: string;
}

export function AssistantWorkspace() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { repositories: sampleRepos } = useRepositories();

  // Connected GitHub repos (if logged in with GitHub)
  const [gitHubRepos, setGitHubRepos] = useState<GitHubRepoItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("sample-project");
  const [suggestedQuestions] = useState<string[]>(DEFAULT_SUGGESTED_QUESTIONS);

  // Conversation history list & active selection
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "conv-welcome",
      title: "Welcome to CodeAtlas AI",
      repositoryId: "sample-project",
      createdAt: "Today",
      updatedAt: "Just now",
      messages: [
        {
          id: "m-welcome",
          sender: "ai",
          text: "Hello! I am your **CodeAtlas AI Assistant**, powered directly by **Firebase AI Logic** and Google's **Gemini Flash** model.\n\nAsk me anything: software architecture, debugging tricky errors, writing tests, or tracing code flow through your connected repository.",
          timestamp: "Just now",
          confirmedFacts: [
            "Client-side Firebase AI Logic SDK with GoogleAIBackend",
            "Direct streaming tokens with App Check protection",
            "Repository-aware file tree and symbol inspection",
          ],
        },
      ],
    },
  ]);

  const [activeConversationId, setActiveConversationId] = useState<string>("conv-welcome");
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch real GitHub repositories if signed in with GitHub
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = sessionStorage.getItem("codeatlas_github_token");
    if (!token) return;

    fetch("https://api.github.com/user/repos?per_page=20&sort=updated", {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: GitHubRepoItem[] = data.map((r) => ({
            id: r.id,
            name: r.name,
            full_name: r.full_name,
            default_branch: r.default_branch || "main",
            language: r.language || "Code",
          }));
          setGitHubRepos(mapped);
          if (mapped.length > 0) {
            setSelectedRepo(mapped[0].full_name);
          }
        }
      })
      .catch((err) => {
        console.warn("[CodeAtlas] Could not load GitHub repos list:", err);
      });
  }, [user]);

  // Load conversations per user from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const userKey = `codeatlas_chat_history_${user?.id || "guest"}`;
    try {
      const stored = localStorage.getItem(userKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          setActiveConversationId(parsed[0].id);
        }
      }
    } catch (e) {
      console.warn("Failed to read chat history:", e);
    }
  }, [user?.id]);

  // Persist conversations to localStorage whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const userKey = `codeatlas_chat_history_${user?.id || "guest"}`;
    try {
      localStorage.setItem(userKey, JSON.stringify(conversations));
    } catch (e) {
      console.warn("Failed to persist chat history:", e);
    }
  }, [conversations, user?.id]);

  const currentConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const messages = useMemo(() => currentConversation?.messages || [], [currentConversation]);

  // Auto-scroll as messages update or tokens stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleStartNewConversation = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: "New Codebase Query",
      repositoryId: selectedRepo,
      createdAt: "Today",
      updatedAt: "Just now",
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
    setConfirmClearOpen(false);
  };

  const handleDeleteConversation = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    abortControllerRef.current?.abort();
    setIsLoading(false);

    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== idToDelete);
      if (remaining.length === 0) {
        const fresh: Conversation = {
          id: `conv-${Date.now()}`,
          title: "New Codebase Query",
          repositoryId: selectedRepo,
          createdAt: "Today",
          updatedAt: "Just now",
          messages: [],
        };
        setActiveConversationId(fresh.id);
        return [fresh];
      }
      if (activeConversationId === idToDelete) {
        setActiveConversationId(remaining[0].id);
      }
      return remaining;
    });
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

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMessage: AssistantMessage = {
      id: `msg-u-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: timeStr,
    };

    const aiMessageId = `msg-ai-${Date.now()}`;
    const placeholderAIMessage: AssistantMessage = {
      id: aiMessageId,
      sender: "ai",
      text: "",
      timestamp: timeStr,
    };

    const updatedTitle =
      messages.length === 0
        ? q.slice(0, 32) + (q.length > 32 ? "..." : "")
        : currentConversation.title;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              title: updatedTitle,
              messages: [...c.messages, userMessage, placeholderAIMessage],
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
      // 1. Build system instruction with optional repository context
      let repoContext = "";
      if (selectedRepo && selectedRepo !== "none") {
        if (selectedRepo.includes("/")) {
          // Real GitHub repo (e.g. "owner/repo")
          repoContext = await aiService.fetchGitHubRepoContext(selectedRepo, q);
        } else if (selectedRepo === "sample-project") {
          repoContext = `\n\n--- REPOSITORY CONTEXT (sample-project) ---\nStack: Next.js 14 App Router, TypeScript, Tailwind CSS, FastAPI Backend.\nKey Files: \n- src/services/auth.ts: Authentication token issuance, user verification.\n- src/components/LoginForm.tsx: Client login form submission.\n- src/utils/validation.ts: Schema validation for auth.\n- backend/app/main.py: FastAPI entry point.`;
        }
      }

      const baseInstruction =
        "You are CodeAtlas AI, an expert software architect and codebase intelligence assistant. " +
        "You answer questions clearly, thoroughly, and helpfully. " +
        "Format code with Markdown code blocks indicating the programming language. " +
        "When explaining or referencing repository files, ALWAYS cite exact file paths and line ranges in the format `file/path.ext:start-end`.\n" +
        repoContext;

      // 2. Format history for Gemini
      const geminiHistory: ChatHistoryItem[] = currentConversation.messages
        .filter((m) => !m.isError && m.text.trim())
        .map((m) => ({
          role: m.sender === "user" ? ("user" as const) : ("model" as const),
          parts: [{ text: m.text }],
        }));

      // 3. Stream response
      let finalAccumulated = "";
      await aiService.streamChat({
        history: geminiHistory,
        message: q,
        systemInstruction: baseInstruction,
        onChunk: (accumulated) => {
          finalAccumulated = accumulated;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversationId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === aiMessageId ? { ...m, text: accumulated } : m
                    ),
                    updatedAt: "Just now",
                  }
                : c
            )
          );
        },
        signal: controller.signal,
      });

      // 4. Extract citations from response
      const fileMatches = finalAccumulated.matchAll(/`([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)(?::(\d+)(?:-(\d+))?)?`/g);
      const extractedCitations: Array<{ file: string; lineRange: string; startLine?: number; endLine?: number }> = [];
      const seen = new Set<string>();

      for (const match of fileMatches) {
        const file = match[1];
        if (file.includes("/") && (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".py") || file.endsWith(".js") || file.endsWith(".json"))) {
          if (!seen.has(file)) {
            seen.add(file);
            const start = match[2] ? parseInt(match[2], 10) : 1;
            const end = match[3] ? parseInt(match[3], 10) : start;
            extractedCitations.push({
              file,
              lineRange: match[2] ? `${start}-${end}` : "1-30",
              startLine: start,
              endLine: end,
            });
          }
        }
      }

      if (extractedCitations.length > 0) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === aiMessageId ? { ...m, citations: extractedCitations.slice(0, 5) } : m
                  ),
                }
              : c
          )
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError" || controller.signal.aborted) {
        return;
      }
      setLastFailedQuery(q);
      const errInfo = aiService.classifyError(err);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMessageId
                    ? {
                        ...m,
                        text: errInfo.userMessage,
                        isError: true,
                      }
                    : m
                ),
              }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate last AI response
  const handleRegenerate = useCallback(() => {
    if (isLoading) return;
    const currentMsgs = currentConversation.messages;
    const lastUserMsg = [...currentMsgs].reverse().find((m) => m.sender === "user");
    if (lastUserMsg) {
      handleAskQuestion(lastUserMsg.text);
    }
  }, [currentConversation, isLoading]);

  return (
    <div className="space-y-4">
      {/* Top Workspace Toolbar: Repository Context Picker + Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
        {/* Left: Repository Context Selector */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <FolderGit2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span className="text-[var(--text-secondary)]">Context:</span>
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            aria-label="Select active repository context"
            className={`py-1 px-2.5 rounded-lg text-xs font-bold border outline-none cursor-pointer max-w-[280px] truncate ${
              isDark
                ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                : "bg-white border-[#E5E5E0] text-[#1E2022]"
            }`}
          >
            {gitHubRepos.length > 0 && (
              <optgroup label="Connected GitHub Repositories">
                {gitHubRepos.map((r) => (
                  <option key={r.full_name} value={r.full_name}>
                    {r.full_name} ({r.language})
                  </option>
                ))}
              </optgroup>
            )}

            <optgroup label="Sample Repositories">
              {sampleRepos.length > 0 ? (
                sampleRepos.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name} ({repo.status === "ready" ? `${repo.symbolCount || 0} symbols` : repo.status})
                  </option>
                ))
              ) : (
                <option value="sample-project">sample-project (5 files indexed)</option>
              )}
            </optgroup>

            <option value="none">— No repository (General CS / Programming) —</option>
          </select>

          {gitHubRepos.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
              <Github className="w-3 h-3" /> Live GitHub Context
            </span>
          )}
        </div>

        {/* Right: Cross-navigation actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/visual-code-explorer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>CodeLens Explorer</span>
          </Link>

          <Link
            href="/architecture"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
          >
            <Network className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Architecture</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Conversation History Sidebar (col-span-3) + Chat Area (col-span-9) */}
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
                Chat History
              </span>
              <button
                type="button"
                onClick={handleStartNewConversation}
                className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                  isDark
                    ? "bg-[#161B22] border-[#30363D] text-[#29D3C2] hover:bg-[#202735]"
                    : "bg-[#FAF9FF] border-[#E8E5F4] text-[#6C4DFF] hover:bg-[#F3F1FF]"
                }`}
                title="Start a new chat"
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
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all border cursor-pointer group flex items-start justify-between ${
                      isActive
                        ? isDark
                          ? "bg-[#161B22] border-[#29D3C2]/50 text-[#F3F5FA] shadow-xs"
                          : "bg-[#FAF9FF] border-[#6C4DFF]/40 text-[#19143D] shadow-xs"
                        : isDark
                        ? "border-transparent text-[var(--text-secondary)] hover:bg-[#111725] hover:text-[#F3F5FA]"
                        : "border-transparent text-[var(--text-secondary)] hover:bg-[#FAF9FF] hover:text-[#19143D]"
                    }`}
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="font-bold text-xs truncate block">{conv.title}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono opacity-60 pl-5">
                        <span>{conv.messages.length} msgs</span>
                        <span>{conv.updatedAt}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-red-500 transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Clear History Action */}
          <div className="pt-3 border-t border-[var(--border-color)]">
            {confirmClearOpen ? (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 space-y-2">
                <p className="font-semibold">Clear this chat?</p>
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
                className="w-full text-left text-[11px] font-mono text-[var(--text-secondary)] hover:text-red-400 flex items-center gap-1.5 p-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear current chat</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Chat Column: Messages View + Input Box */}
        <div
          className={`lg:col-span-9 rounded-2xl border flex flex-col justify-between overflow-hidden ${
            isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-white border-[#E8E5F4]"
          }`}
        >
          {/* Scrollable Messages Container */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[580px] flex-1">
            {messages.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center font-bold">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                    Ask CodeAtlas Anything
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md">
                    Answers software architecture, code logic, bugs, and API relationships with grounded receipts.
                  </p>
                </div>

                {/* Suggested Questions Grid */}
                <div className="grid gap-2 sm:grid-cols-2 max-w-xl w-full text-left pt-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAskQuestion(q)}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                        isDark
                          ? "bg-[#111725] border-[#242B39] text-[#E6EDF3] hover:border-[var(--primary)]"
                          : "bg-[#FAF9FF] border-[#E8E5F4] text-[#19143D] hover:border-[var(--primary)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{q}</span>
                        <ArrowRight className="w-3 h-3 text-[var(--primary)] shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  repositoryId={selectedRepo}
                  onRetry={() => handleAskQuestion(lastFailedQuery || undefined)}
                  onRegenerate={handleRegenerate}
                />
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 text-xs font-mono text-[var(--primary)] animate-pulse">
                <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                <span>Gemini is generating response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
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
