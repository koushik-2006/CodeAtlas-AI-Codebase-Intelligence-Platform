"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { ReviewChangedFile, ReviewFinding, InlineComment } from "@/types/review";
import {
  FileCode,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  MessageSquare,
  Send,
  X,
  Check,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Info,
  CornerDownRight,
  Columns,
  List,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DiffViewerProps {
  files: ReviewChangedFile[];
  findings?: ReviewFinding[];
  inlineComments?: InlineComment[];
  viewedFiles?: Record<string, boolean>;
  onToggleViewedFile?: (filename: string) => void;
  onAddInlineComment?: (file: string, line: number, text: string) => void;
  onReplyInlineComment?: (commentId: string, text: string) => void;
  highlightLocation?: { file: string; line: number } | null;
  className?: string;
}

export function DiffViewer({
  files,
  findings = [],
  inlineComments = [],
  viewedFiles = {},
  onToggleViewedFile,
  onAddInlineComment,
  onReplyInlineComment,
  highlightLocation,
  className = "",
}: DiffViewerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [diffMode, setDiffMode] = useState<"unified" | "split">("unified");
  const [activeCommentLine, setActiveCommentLine] = useState<{ file: string; line: number } | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    files.forEach((f) => {
      init[f.filename] = true;
    });
    return init;
  });

  const highlightedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (highlightLocation) {
      // Ensure file is expanded
      setExpandedFiles((prev) => ({ ...prev, [highlightLocation.file]: true }));

      // Scroll to line
      setTimeout(() => {
        const el = document.getElementById(`diff-line-${highlightLocation.file}-${highlightLocation.line}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-[#7C5CFC]", "bg-[#7C5CFC]/20");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-[#7C5CFC]", "bg-[#7C5CFC]/20");
          }, 3000);
        }
      }, 150);
    }
  }, [highlightLocation]);

  const toggleExpand = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  };

  const handlePostInlineComment = (file: string, line: number) => {
    if (!newCommentText.trim()) return;
    onAddInlineComment?.(file, line, newCommentText.trim());
    setNewCommentText("");
    setActiveCommentLine(null);
  };

  const handlePostReply = (commentId: string) => {
    if (!replyText.trim()) return;
    onReplyInlineComment?.(commentId, replyText.trim());
    setReplyText("");
    setActiveReplyId(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Toolbar: View Mode & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-[var(--text-secondary)]">
            {files.length} file(s) changed
          </span>
          <span className="text-[var(--border-color)]">•</span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            +{files.reduce((acc, f) => acc + (f.additions || 0), 0)}
          </span>
          <span className="text-xs font-mono font-bold text-rose-400">
            -{files.reduce((acc, f) => acc + (f.deletions || 0), 0)}
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-semibold">
          <button
            type="button"
            onClick={() => setDiffMode("unified")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
              diffMode === "unified"
                ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Unified</span>
          </button>
          <button
            type="button"
            onClick={() => setDiffMode("split")}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
              diffMode === "split"
                ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split</span>
          </button>
        </div>
      </div>

      {/* Files List */}
      {files.map((file) => {
        const isExpanded = expandedFiles[file.filename] !== false;
        const isViewed = !!viewedFiles[file.filename];
        const rawLines = (file.patch || "").split("\n");

        let currentOldLine = 1;
        let currentNewLine = 1;

        return (
          <div
            key={file.filename}
            id={`file-diff-${file.filename.replace(/[^a-zA-Z0-9]/g, "-")}`}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xs transition-all"
          >
            {/* File Header */}
            <div className="p-3.5 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-card-hover)]/70">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleExpand(file.filename)}
                  className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  )}
                </button>

                <FileCode className="w-4 h-4 text-[#7C5CFC] shrink-0" />
                <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate">
                  {file.filename}
                </span>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                    file.status === "added"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : file.status === "deleted"
                      ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  }`}
                >
                  {file.status}
                </span>
              </div>

              {/* Right side: Viewed checkbox & Stats */}
              <div className="flex items-center gap-3 font-mono text-xs shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                  <span className="text-emerald-400 flex items-center">
                    <Plus className="w-3 h-3" />
                    {file.additions}
                  </span>
                  <span className="text-rose-400 flex items-center">
                    <Minus className="w-3 h-3" />
                    {file.deletions}
                  </span>
                </div>

                <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={isViewed}
                    onChange={() => onToggleViewedFile?.(file.filename)}
                    className="accent-[#7C5CFC] rounded cursor-pointer"
                  />
                  <span>Viewed</span>
                </label>
              </div>
            </div>

            {/* Diff Patch Content */}
            {isExpanded && (
              <div className="overflow-x-auto text-xs font-mono leading-5 divide-y divide-[var(--border-color)]/20">
                {rawLines.length > 0 && file.patch ? (
                  rawLines.map((line, idx) => {
                    const isAdd = line.startsWith("+") && !line.startsWith("+++");
                    const isDel = line.startsWith("-") && !line.startsWith("---");
                    const isHunkHeader = line.startsWith("@@");

                    if (isHunkHeader) {
                      const match = line.match(/@@ -([0-9]+)(?:,[0-9]+)? \+([0-9]+)(?:,[0-9]+)? @@/);
                      if (match) {
                        currentOldLine = parseInt(match[1], 10);
                        currentNewLine = parseInt(match[2], 10);
                      }
                    } else if (isAdd) {
                      currentNewLine++;
                    } else if (isDel) {
                      currentOldLine++;
                    } else {
                      currentOldLine++;
                      currentNewLine++;
                    }

                    const effectiveLineNum = isDel ? currentOldLine - 1 : currentNewLine - 1;
                    const lineId = `diff-line-${file.filename}-${effectiveLineNum}`;

                    // Check for inline findings on this exact file + line
                    const lineFindings = findings.filter(
                      (f) =>
                        f.file === file.filename &&
                        (f.line === effectiveLineNum ||
                          (f.lineRange && f.lineRange.includes(String(effectiveLineNum))))
                    );

                    // Check for inline comments on this line
                    const lineComments = inlineComments.filter(
                      (c) => c.file === file.filename && c.line === effectiveLineNum
                    );

                    let lineBg = "";
                    let textColor = "text-[var(--text-primary)]";
                    if (isHunkHeader) {
                      lineBg = "bg-[#7C5CFC]/10";
                      textColor = "text-[#7C5CFC] font-bold";
                    } else if (isAdd) {
                      lineBg = "bg-emerald-500/10";
                      textColor = "text-emerald-400";
                    } else if (isDel) {
                      lineBg = "bg-rose-500/10";
                      textColor = "text-rose-400";
                    }

                    const isCommentOpen =
                      activeCommentLine?.file === file.filename &&
                      activeCommentLine?.line === effectiveLineNum;

                    return (
                      <div key={idx} id={lineId} className="group flex flex-col">
                        <div
                          className={`flex items-start px-2 py-0.5 hover:bg-[var(--bg-card-hover)] transition-colors ${lineBg}`}
                        >
                          {/* Line numbers */}
                          <div className="flex items-center shrink-0 w-16 text-[10px] text-[var(--text-secondary)] select-none opacity-60 font-mono">
                            <span className="w-8 text-right pr-2">
                              {!isAdd && !isHunkHeader ? currentOldLine - 1 : ""}
                            </span>
                            <span className="w-8 text-right pr-2">
                              {!isDel && !isHunkHeader ? currentNewLine - 1 : ""}
                            </span>
                          </div>

                          {/* Hover '+' action to add inline comment */}
                          <div className="w-5 shrink-0 flex items-center justify-center">
                            {!isHunkHeader && (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCommentLine(
                                    isCommentOpen ? null : { file: file.filename, line: effectiveLineNum }
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-[#7C5CFC] text-white hover:scale-110 transition-all text-[10px]"
                                title="Add inline comment"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Code line content */}
                          <div className={`flex-1 whitespace-pre font-mono pl-2 ${textColor}`}>
                            {line}
                          </div>
                        </div>

                        {/* Inline Finding Banner at exact line */}
                        {lineFindings.map((finding) => (
                          <div
                            key={finding.id}
                            className={`mx-10 my-1.5 p-3 rounded-xl border text-xs font-sans ${
                              finding.severity === "critical"
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                : finding.severity === "warning"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 font-bold">
                                {finding.severity === "critical" ? (
                                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                                ) : finding.severity === "warning" ? (
                                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                ) : (
                                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                                )}
                                <span>
                                  [{finding.severity.toUpperCase()}] {finding.title}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/20 uppercase">
                                {finding.category}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                              {finding.description}
                            </p>
                            {finding.suggestedRemediation && (
                              <div className="mt-2 p-2 rounded-lg bg-black/30 text-[11px] font-mono text-[var(--text-primary)]">
                                <strong>Remediation:</strong> {finding.suggestedRemediation}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Existing Inline Comments on this line */}
                        {lineComments.map((comment) => (
                          <div
                            key={comment.id}
                            className="mx-10 my-1.5 p-3 rounded-xl bg-[var(--bg-card)] border border-[#7C5CFC]/40 shadow-sm text-xs font-sans space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img
                                  src={comment.author.avatar}
                                  alt={comment.author.name}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                                <strong className="text-[var(--text-primary)] font-bold">
                                  {comment.author.name}
                                </strong>
                                <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                                  {new Date(comment.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                              {comment.text}
                            </p>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="pl-4 border-l-2 border-[#7C5CFC]/30 space-y-2 mt-2">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="text-xs space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                                      <CornerDownRight className="w-3 h-3 text-[#7C5CFC]" />
                                      <span>{reply.author.name}</span>
                                    </div>
                                    <p className="text-[var(--text-secondary)] pl-4">{reply.text}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input Box */}
                            {activeReplyId === comment.id ? (
                              <div className="pt-2 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Reply in thread..."
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handlePostReply(comment.id);
                                  }}
                                />
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handlePostReply(comment.id)}
                                  className="bg-[#7C5CFC] text-white text-xs h-7 px-3"
                                >
                                  Reply
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveReplyId(null)}
                                  className="text-xs h-7 px-2"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveReplyId(comment.id)}
                                className="text-[11px] font-bold text-[#7C5CFC] hover:underline pt-1 inline-flex items-center gap-1"
                              >
                                Reply &rarr;
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Inline Comment Composer Box */}
                        {isCommentOpen && (
                          <div className="mx-10 my-2 p-3 rounded-xl bg-[var(--bg-card)] border border-[#7C5CFC] shadow-md text-xs font-sans space-y-2 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                              <span>Add comment on line {effectiveLineNum}</span>
                              <button
                                type="button"
                                onClick={() => setActiveCommentLine(null)}
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              placeholder="Leave an inline review note, question, or suggestion..."
                              className="w-full p-2.5 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]"
                            />
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveCommentLine(null)}
                                className="text-xs h-7 px-3"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handlePostInlineComment(file.filename, effectiveLineNum)}
                                disabled={!newCommentText.trim()}
                                className="bg-[#7C5CFC] text-white text-xs h-7 px-3 gap-1.5"
                              >
                                <Send className="w-3 h-3" />
                                <span>Add Comment</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-xs font-mono text-[var(--text-secondary)] text-center">
                    (No patch content or binary file)
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
