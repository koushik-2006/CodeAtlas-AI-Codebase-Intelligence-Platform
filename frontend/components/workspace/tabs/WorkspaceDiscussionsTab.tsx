"use client";

import { useState } from "react";
import {
  MessageSquare,
  Plus,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  Code2,
  Send,
  Loader2,
  X,
  AtSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiClient } from "@/services/api-client";

interface WorkspaceDiscussionsTabProps {
  workspaceId: string;
  discussions: any[];
  members: any[];
  repositories: any[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

const EMOJI_LIST = ["👍", "🚀", "👀", "❤️", "💡"];

export default function WorkspaceDiscussionsTab({
  workspaceId,
  discussions,
  members,
  repositories,
  onRefresh,
  showToast,
}: WorkspaceDiscussionsTabProps) {
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "resolved">("all");

  // New Thread Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadBody, setThreadBody] = useState("");
  const [selectedRepoId, setSelectedRepoId] = useState(repositories[0]?.id || "sample-project");
  const [filePath, setFilePath] = useState("src/services/auth.ts");
  const [lineNumber, setLineNumber] = useState<number>(42);
  const [creatingThread, setCreatingThread] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reply states: threadId -> input text
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [activeMentionThreadId, setActiveMentionThreadId] = useState<string | null>(null);
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  // Expanded replies state
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({
    disc_thread_1: true,
  });

  const filteredThreads = discussions.filter((t) => {
    if (filterStatus === "open") return t.status === "open";
    if (filterStatus === "resolved") return t.status === "resolved";
    return true;
  });

  const handleCreateThreadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadTitle.trim() || !threadBody.trim()) {
      setCreateError("Please provide both a thread title and description");
      return;
    }

    try {
      setCreatingThread(true);
      setCreateError(null);
      const res = await apiClient.post<any>(`/api/workspaces/${workspaceId}/discussions`, {
        title: threadTitle.trim(),
        body: threadBody.trim(),
        repositoryId: selectedRepoId,
        filePath: filePath.trim() || undefined,
        lineNumber: Number(lineNumber) || undefined,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to create discussion");
      }

      showToast("Discussion thread posted!");
      setCreateModalOpen(false);
      setThreadTitle("");
      setThreadBody("");
      onRefresh();
    } catch (err: any) {
      setCreateError(err.message || "Failed to post discussion");
    } finally {
      setCreatingThread(false);
    }
  };

  const handleToggleResolve = async (thread: any) => {
    const newStatus = thread.status === "resolved" ? "open" : "resolved";
    try {
      const res = await apiClient.patch<any>(`/api/workspaces/${workspaceId}/discussions`, {
        threadId: thread.id,
        status: newStatus,
      });
      if (res.success) {
        showToast(`Thread marked as ${newStatus}`);
        onRefresh();
      } else {
        alert(res.message || "Failed to update thread status");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleReaction = async (threadId: string, emoji: string) => {
    try {
      await apiClient.post<any>(`/api/workspaces/${workspaceId}/discussions`, {
        threadId,
        action: "react",
        emoji,
      });
      onRefresh();
    } catch (err: any) {
      console.error("Reaction failed:", err);
    }
  };

  const handleReplySubmit = async (threadId: string) => {
    const text = replyTexts[threadId]?.trim();
    if (!text) return;

    try {
      setSubmittingReplyId(threadId);
      const res = await apiClient.post<any>(`/api/workspaces/${workspaceId}/discussions`, {
        threadId,
        action: "reply",
        body: text,
      });

      if (res.success) {
        setReplyTexts((prev) => ({ ...prev, [threadId]: "" }));
        setActiveMentionThreadId(null);
        showToast("Reply posted!");
        onRefresh();
      } else {
        alert(res.message || "Failed to post reply");
      }
    } catch (err: any) {
      alert(err.message || "Failed to post reply");
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const insertMention = (threadId: string, userName: string) => {
    const current = replyTexts[threadId] || "";
    const updated = current.endsWith("@")
      ? `${current}${userName} `
      : `${current} @${userName} `;
    setReplyTexts((prev) => ({ ...prev, [threadId]: updated }));
    setActiveMentionThreadId(null);
  };

  const toggleExpand = (threadId: string) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [threadId]: !prev[threadId],
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)]/60 pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">Code Discussions</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Collaborative technical threads anchored to repositories, source files, and review findings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Filter Chips */}
          <div className="flex items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-1">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("open")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === "open"
                  ? "bg-emerald-500 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilterStatus("resolved")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === "resolved"
                  ? "bg-purple-600 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Resolved
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Thread</span>
          </button>
        </div>
      </div>

      {/* Discussion Threads List */}
      {filteredThreads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-10 text-center bg-[var(--bg-card)]/40">
          <MessageSquare className="w-10 h-10 text-[var(--text-secondary)]/60 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
            No discussion threads found
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
            Start a discussion to ask questions about code structure, coordinate refactors, or debate architectural decisions.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary)]/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start Discussion</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredThreads.map((thread) => {
            const isResolved = thread.status === "resolved";
            const isExpanded = expandedThreads[thread.id] ?? true;
            const replies = thread.replies || [];
            const reactions = thread.reactions || {};

            return (
              <div
                key={thread.id}
                className={`rounded-2xl border p-5 transition-all bg-[var(--bg-card)] ${
                  isResolved
                    ? "border-[var(--border-color)]/70 opacity-90"
                    : "border-[var(--border-color)] hover:border-[var(--border-color)]/90"
                }`}
              >
                {/* Thread Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        thread.authorAvatar ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${thread.authorId}`
                      }
                      alt={thread.authorName || "Author"}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-[var(--border-color)] bg-neutral-800 flex-shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-[var(--text-primary)] leading-snug">
                        {thread.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-secondary)] flex-wrap">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {thread.authorName}
                        </span>
                        <span>&bull;</span>
                        <span>{thread.createdAt ? new Date(thread.createdAt).toLocaleDateString() : "Recently"}</span>

                        {thread.repositoryId && (
                          <>
                            <span>&bull;</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-color)] text-[10px] font-mono text-cyan-400">
                              <FolderGit2 className="w-3 h-3" />
                              {thread.repositoryId}
                              {thread.filePath ? `:${thread.filePath}` : ""}
                              {thread.lineNumber ? `:${thread.lineNumber}` : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Toggle Button */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isResolved
                          ? "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                          : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isResolved ? "Resolved" : "Open"}
                    </span>

                    <button
                      onClick={() => handleToggleResolve(thread)}
                      className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] hover:bg-[var(--border-color)]/30 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {isResolved ? "Reopen" : "Resolve"}
                    </button>
                  </div>
                </div>

                {/* Thread Body */}
                <div className="text-xs text-[var(--text-primary)]/90 leading-relaxed mb-4 pl-12 pr-2 whitespace-pre-wrap">
                  {thread.body}
                </div>

                {/* Emoji Reactions Bar */}
                <div className="flex items-center gap-1.5 pl-12 mb-4 flex-wrap">
                  {EMOJI_LIST.map((emoji) => {
                    const count = reactions[emoji] || 0;
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(thread.id, emoji)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-medium transition-all hover:scale-105 ${
                          count > 0
                            ? "bg-[var(--primary)]/15 border-[var(--primary)]/30 text-[var(--text-primary)]"
                            : "bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]/50"
                        }`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="font-mono text-[11px]">{count}</span>}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => toggleExpand(thread.id)}
                    className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <span>{replies.length} replies</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Collapsible Replies & Reply Box */}
                {isExpanded && (
                  <div className="pl-12 pt-3 border-t border-[var(--border-color)]/40 space-y-3">
                    {replies.map((reply: any) => (
                      <div
                        key={reply.id}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]/50"
                      >
                        <img
                          src={
                            reply.authorAvatar ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${reply.authorId}`
                          }
                          alt={reply.authorName}
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-[var(--border-color)] bg-neutral-800 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[var(--text-primary)]">
                              {reply.authorName}
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)]">
                              {reply.createdAt ? new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                            {reply.body}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Reply Input with @mention Autocomplete */}
                    <div className="relative pt-1">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={replyTexts[thread.id] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setReplyTexts((prev) => ({ ...prev, [thread.id]: val }));
                              if (val.endsWith("@")) {
                                setActiveMentionThreadId(thread.id);
                              } else if (!val.includes("@")) {
                                setActiveMentionThreadId(null);
                              }
                            }}
                            placeholder="Write a reply... (type @ to mention a teammate)"
                            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] pl-3 pr-8 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMentionThreadId(
                                activeMentionThreadId === thread.id ? null : thread.id
                              )
                            }
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--primary)]"
                            title="Mention teammate"
                          >
                            <AtSign className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleReplySubmit(thread.id)}
                          disabled={
                            submittingReplyId === thread.id || !replyTexts[thread.id]?.trim()
                          }
                          className="px-3.5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {submittingReplyId === thread.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Reply</span>
                        </button>
                      </div>

                      {/* @Mention Autocomplete Dropdown */}
                      {activeMentionThreadId === thread.id && (
                        <div className="absolute left-0 bottom-full mb-1 w-64 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-color)]/60">
                            Mention Teammate
                          </div>
                          <div className="max-h-36 overflow-y-auto space-y-0.5 mt-1">
                            {members.map((m) => (
                              <button
                                key={m.userId || m.id}
                                type="button"
                                onClick={() => insertMention(thread.id, m.userName || "Teammate")}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--primary)]/10 text-left text-xs transition-colors"
                              >
                                <img
                                  src={
                                    m.userAvatar ||
                                    `https://api.dicebear.com/7.x/bottts/svg?seed=${m.userId}`
                                  }
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                                <div>
                                  <div className="font-semibold text-[var(--text-primary)]">
                                    {m.userName}
                                  </div>
                                  <div className="text-[10px] text-[var(--text-secondary)]">
                                    {m.userEmail}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Discussion Thread Modal */}
      {createModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-6 relative">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Start Discussion</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Create a technical thread linked to code context.
                </p>
              </div>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateThreadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Thread Title *
                </label>
                <input
                  type="text"
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                  placeholder="e.g. Auth Token Expiration & Refresh Flow"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Repository
                  </label>
                  <select
                    value={selectedRepoId}
                    onChange={(e) => setSelectedRepoId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
                  >
                    {repositories.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    File Path
                  </label>
                  <input
                    type="text"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    placeholder="src/services/auth.ts"
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Line Number
                  </label>
                  <input
                    type="number"
                    value={lineNumber}
                    onChange={(e) => setLineNumber(Number(e.target.value))}
                    placeholder="42"
                    min={1}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Discussion Body *
                </label>
                <textarea
                  value={threadBody}
                  onChange={(e) => setThreadBody(e.target.value)}
                  placeholder="Describe the architectural challenge, code review question, or proposed solution..."
                  rows={4}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)]/60">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingThread || !threadTitle.trim() || !threadBody.trim()}
                  className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creatingThread && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Post Discussion</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
