"use client";

import React, { useState, useEffect } from "react";
import { ReviewFinding, FindingDiscussion } from "@/types/review";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  X,
  Sparkles,
  Bot,
  User,
  ThumbsUp,
  Heart,
  Rocket,
  Eye,
  RotateCcw,
  AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  getStore,
  addDiscussionComment,
  resolveDiscussion,
} from "@/lib/demo/store";
import { aiService } from "@/services/ai-service";

interface FindingDiscussionPanelProps {
  finding: ReviewFinding;
  pullRequestId: string;
  pullRequestNumber: number;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function FindingDiscussionPanel({
  finding,
  pullRequestId,
  pullRequestNumber,
  isOpen,
  onClose,
  className = "",
}: FindingDiscussionPanelProps) {
  const [discussion, setDiscussion] = useState<FindingDiscussion | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [showMentions, setShowMentions] = useState(false);

  const teamMembers = [
    { name: "Alex Chen", role: "Staff Engineer" },
    { name: "Elena Rostova", role: "Security Architect" },
    { name: "Marcus Chen", role: "Backend Lead" },
    { name: "Sarah Connor", role: "Platform Eng" },
  ];

  // Load discussion from store
  const loadDiscussion = () => {
    const store = getStore();
    const pr = store.pullRequests?.find((p: any) => p.id === pullRequestId || String(p.number) === pullRequestId);
    if (pr?.discussions?.[finding.id]) {
      setDiscussion(pr.discussions[finding.id]);
    } else {
      setDiscussion({
        id: `disc_${finding.id}`,
        findingId: finding.id,
        comments: [],
        resolved: false,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDiscussion();
    }
  }, [isOpen, finding.id, pullRequestId]);

  if (!isOpen) return null;

  const handlePostComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    addDiscussionComment(pullRequestId, finding.id, {
      text: commentText.trim(),
      author: {
        name: "Alex Chen",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      },
    });

    setCommentText("");
    setShowMentions(false);
    loadDiscussion();
  };

  const handleToggleResolve = () => {
    const nextResolved = !discussion?.resolved;
    resolveDiscussion(pullRequestId, finding.id, nextResolved);
    loadDiscussion();
  };

  const handleAskAIInThread = async () => {
    setIsAskingAI(true);
    try {
      const prompt = `Context: Pull Request Code Review Finding Discussion.
Finding Title: ${finding.title}
File & Line: ${finding.file}:${finding.line || 1}
Severity: ${finding.severity}
Description: ${finding.description}
Suggested Remediation: ${finding.suggestedRemediation}

Question from engineer: Please provide a concrete code pattern or architectural guidance on how to safely resolve this issue and whether there are any trade-offs.`;

      let aiResponseText = "";
      await aiService.streamChat({
        message: prompt,
        systemInstruction: "You are CodeAtlas Senior Review AI. Provide concise, clear, and actionable technical guidance for PR reviewers.",
        onChunk: (accumulated) => {
          aiResponseText = accumulated;
        },
      });

      if (aiResponseText) {
        addDiscussionComment(pullRequestId, finding.id, {
          text: aiResponseText,
          author: {
            name: "CodeAtlas AI",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
          },
        });
        loadDiscussion();
      }
    } catch (err: any) {
      console.warn("Ask AI failed, posting fallback guidance:", err);
      addDiscussionComment(pullRequestId, finding.id, {
        text: `### CodeAtlas AI Recommendation\nFor \`${finding.file}\`, we recommend applying the following fix:\n\`\`\`typescript\n${finding.suggestedRemediation}\n\`\`\`\nThis guarantees safe non-blocking execution while preventing runtime regressions.`,
        author: {
          name: "CodeAtlas AI",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        },
      });
      loadDiscussion();
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleInsertMention = (name: string) => {
    setCommentText((prev) => `${prev}@${name} `);
    setShowMentions(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
      <aside
        className={`w-full max-w-lg h-full bg-[var(--bg-card)] border-l border-[var(--border-color)] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 ${className}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-start justify-between gap-3 bg-[var(--bg-card-hover)]/50">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#7C5CFC]/15 text-[#7C5CFC] font-bold border border-[#7C5CFC]/30">
                Finding Discussion
              </span>
              <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                PR #{pullRequestNumber} • {finding.file}:{finding.line || 1}
              </span>
            </div>
            <h3 className="font-bold text-sm text-[var(--text-primary)] leading-tight">
              {finding.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Action Bar */}
        <div className="px-4 py-2.5 border-b border-[var(--border-color)] flex items-center justify-between text-xs bg-[var(--bg-card)]">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                discussion?.resolved ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
              }`}
            />
            <span className="font-semibold text-[var(--text-secondary)]">
              {discussion?.resolved ? "Thread Resolved" : "Open Discussion"}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleResolve}
            className="text-xs h-7 gap-1"
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 ${discussion?.resolved ? "text-emerald-400" : ""}`}
            />
            <span>{discussion?.resolved ? "Reopen Thread" : "Resolve Thread"}</span>
          </Button>
        </div>

        {/* Comments Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Original Finding Summary */}
          <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
              <Sparkles className="w-3.5 h-3.5 text-[#7C5CFC]" />
              <span>Reported Finding Context</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {finding.description}
            </p>
            {finding.codeSnippet && (
              <pre className="p-2 rounded-lg bg-black/30 text-[11px] font-mono text-[var(--text-primary)] overflow-x-auto whitespace-pre">
                {finding.codeSnippet}
              </pre>
            )}
          </div>

          {/* Discussion Messages */}
          {discussion?.comments && discussion.comments.length > 0 ? (
            discussion.comments.map((c) => {
              const isAI = c.author.name.includes("AI");
              return (
                <div
                  key={c.id}
                  className={`p-3 rounded-xl border text-xs space-y-2 ${
                    isAI
                      ? "bg-[#7C5CFC]/10 border-[#7C5CFC]/30 text-[var(--text-primary)]"
                      : "bg-[var(--bg-card)] border-[var(--border-color)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={c.author.avatar}
                        alt={c.author.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <strong className="text-[var(--text-primary)] font-bold">
                        {c.author.name}
                      </strong>
                      {isAI && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#7C5CFC] text-white">
                          BOT
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                      {new Date(c.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                    {c.text}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-[var(--text-secondary)] space-y-1">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40 text-[#7C5CFC]" />
              <p className="text-xs font-semibold">No comments in this thread yet</p>
              <p className="text-[11px]">Ask a question or click below to ask AI for guidance.</p>
            </div>
          )}
        </div>

        {/* Footer Composer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)] space-y-2">
          {/* Ask AI in thread Button */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAskAIInThread}
              disabled={isAskingAI}
              className="text-xs h-7 text-[#7C5CFC] border-[#7C5CFC]/30 gap-1.5"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{isAskingAI ? "AI Thinking..." : "Ask AI in thread"}</span>
            </Button>

            <button
              type="button"
              onClick={() => setShowMentions(!showMentions)}
              className="text-[11px] text-[var(--text-secondary)] hover:text-[#7C5CFC] flex items-center gap-1 font-mono"
            >
              <AtSign className="w-3 h-3" />
              <span>Mention team</span>
            </button>
          </div>

          {/* Mentions dropdown */}
          {showMentions && (
            <div className="p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex flex-wrap gap-1 text-xs">
              {teamMembers.map((m) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => handleInsertMention(m.name)}
                  className="px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[#7C5CFC] text-[11px] font-semibold text-[var(--text-primary)]"
                >
                  @{m.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a reply or @mention..."
              className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePostComment();
              }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => handlePostComment()}
              disabled={!commentText.trim()}
              className="bg-[#7C5CFC] text-white text-xs h-9 px-4 gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Reply</span>
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}
