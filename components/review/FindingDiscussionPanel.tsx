"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Shield,
  Loader2,
  CornerDownRight,
} from "lucide-react";
import { DbReviewFindingDiscussion, DbFindingDecision } from "@/types/workspace";
import { useWorkspaces } from "@/hooks/useWorkspaces";

interface FindingDiscussionPanelProps {
  workspaceId?: string;
  repositoryId: string;
  reviewSessionId: string;
  findingId: string;
  findingTitle: string;
}

export function FindingDiscussionPanel({
  workspaceId: propWorkspaceId,
  repositoryId,
  reviewSessionId,
  findingId,
  findingTitle,
}: FindingDiscussionPanelProps) {
  const { activeWorkspace } = useWorkspaces();
  const workspaceId = propWorkspaceId || activeWorkspace?.id || "ws_team_demo";

  const [discussions, setDiscussions] = useState<DbReviewFindingDiscussion[]>([]);
  const [decision, setDecision] = useState<DbFindingDecision | null>(null);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Decision state
  const [status, setStatus] = useState<"open" | "acknowledged" | "dismissed">("open");
  const [dismissalReason, setDismissalReason] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [showDismissInput, setShowDismissInput] = useState(false);
  const [updatingDecision, setUpdatingDecision] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/workspaces/${workspaceId}/reviews/${reviewSessionId}/discussions?findingId=${findingId}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setDiscussions(json.data.discussions || []);
        if (json.data.decision) {
          setDecision(json.data.decision);
          setStatus(json.data.decision.status || "open");
          setDismissalReason(json.data.decision.dismissalReason || "");
          setAssigneeId(json.data.decision.assigneeId || "");
        }
      }
    } catch (err) {
      console.error("load finding discussions error:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, reviewSessionId, findingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await fetch(
        `/api/workspaces/${workspaceId}/reviews/${reviewSessionId}/discussions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            findingId,
            repositoryId,
            comment: newComment.trim(),
          }),
        }
      );
      const json = await res.json();
      if (json.success && json.data?.discussion) {
        setDiscussions((prev) => [...prev, json.data.discussion]);
        setNewComment("");
      } else {
        alert(json.error || "Failed to post comment");
      }
    } catch (err: any) {
      alert(err.message || "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateDecision = async (
    newStatus: "open" | "acknowledged" | "dismissed",
    reason?: string,
    assignee?: string
  ) => {
    try {
      setUpdatingDecision(true);
      setActionMessage(null);
      const res = await fetch(
        `/api/workspaces/${workspaceId}/reviews/${reviewSessionId}/discussions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            findingId,
            repositoryId,
            decision: {
              status: newStatus,
              dismissalReason: reason,
              assigneeId: assignee,
            },
          }),
        }
      );
      const json = await res.json();
      if (json.success && json.data?.decision) {
        setDecision(json.data.decision);
        setStatus(newStatus);
        setShowDismissInput(false);
        setActionMessage(
          newStatus === "acknowledged"
            ? "Finding acknowledged by team"
            : newStatus === "dismissed"
            ? "Finding dismissed with reason recorded"
            : "Finding reopened"
        );
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        alert(json.error || "Failed to update finding decision");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update decision");
    } finally {
      setUpdatingDecision(false);
    }
  };

  const teamMembers = [
    { userId: "usr_default", userName: "Alex Mercer (You)" },
    { userId: "usr_sarah", userName: "Sarah Lin (Architect)" },
    { userId: "usr_marcus", userName: "Marcus Vance (Backend)" },
    { userId: "usr_elena", userName: "Elena Rostova (Security)" },
  ];

  return (
    <div className="mt-3 pt-3 border-t border-[var(--border-color)]/60 space-y-3 bg-[var(--bg-surface)]/40 p-3 rounded-xl">
      {/* Header and Current Team Decision */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span className="text-xs font-bold text-[var(--text-primary)]">
            Team Collaboration & Decisions
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono border border-[var(--border-color)] text-[var(--text-secondary)]">
            {findingId}
          </span>
        </div>

        {/* Current status pill */}
        <div className="flex items-center gap-2">
          {decision ? (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-[var(--text-secondary)]">Decision:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold border ${
                  decision.status === "acknowledged"
                    ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
                    : decision.status === "dismissed"
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    : "bg-blue-500/15 border-blue-500/30 text-blue-400"
                }`}
              >
                {decision.status === "acknowledged"
                  ? `Acknowledged${decision.assigneeName ? ` (Assigned to ${decision.assigneeName})` : ""}`
                  : decision.status === "dismissed"
                  ? "Dismissed"
                  : "Open"}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-[var(--text-secondary)] italic">
              AI-generated finding (unresolved)
            </span>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Decision Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {status !== "acknowledged" ? (
          <button
            type="button"
            onClick={() => handleUpdateDecision("acknowledged", undefined, assigneeId)}
            disabled={updatingDecision}
            className="px-2.5 py-1 rounded-lg border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-[11px] font-semibold text-teal-400 transition-colors flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Acknowledge Issue</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleUpdateDecision("open")}
            disabled={updatingDecision}
            className="px-2.5 py-1 rounded-lg border border-[var(--border-color)] text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Reopen Finding
          </button>
        )}

        {status !== "dismissed" && !showDismissInput && (
          <button
            type="button"
            onClick={() => setShowDismissInput(true)}
            disabled={updatingDecision}
            className="px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-semibold text-amber-400 transition-colors flex items-center gap-1"
          >
            <XCircle className="w-3 h-3" />
            <span>Dismiss with Reason</span>
          </button>
        )}

        {/* Assignee selector */}
        <div className="flex items-center gap-1.5 ml-auto text-xs">
          <User className="w-3 h-3 text-[var(--text-secondary)]" />
          <span className="text-[10px] text-[var(--text-secondary)]">Assignee:</span>
          <select
            value={assigneeId}
            onChange={(e) => {
              const newAssignee = e.target.value;
              setAssigneeId(newAssignee);
              handleUpdateDecision(status, dismissalReason, newAssignee);
            }}
            className="rounded-md border border-[var(--border-color)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((m: any) => (
              <option key={m.userId} value={m.userId}>
                {m.userName || m.userId}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dismissal Reason Form */}
      {showDismissInput && (
        <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-2 animate-in fade-in">
          <label className="block text-[11px] font-semibold text-amber-400">
            Audit Justification for Dismissal *
          </label>
          <input
            type="text"
            value={dismissalReason}
            onChange={(e) => setDismissalReason(e.target.value)}
            placeholder="e.g. False positive due to test harness mock, or covered in ticket SEC-402"
            className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowDismissInput(false)}
              className="px-2 py-1 rounded text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleUpdateDecision("dismissed", dismissalReason, assigneeId)}
              disabled={!dismissalReason.trim() || updatingDecision}
              className="px-3 py-1 rounded bg-amber-500 text-black font-semibold text-[11px] hover:bg-amber-400 disabled:opacity-50"
            >
              Confirm Dismissal
            </button>
          </div>
        </div>
      )}

      {/* Dismissal details if already dismissed */}
      {decision?.status === "dismissed" && decision.dismissalReason && (
        <div className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Dismissal Reason: </span>
            <span>{decision.dismissalReason}</span>
            <span className="text-[10px] text-[var(--text-secondary)]/70 block mt-0.5">
              Recorded by {decision.updatedByName} on {new Date(decision.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {/* Discussion Comments List */}
      <div className="space-y-2 pt-1">
        {discussions.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {discussions.map((disc) => (
              <div
                key={disc.id}
                className="p-2 rounded-lg border border-[var(--border-color)]/70 bg-[var(--bg-card)]/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                    <div className="w-4 h-4 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-[9px]">
                      {disc.authorName.slice(0, 1)}
                    </div>
                    <span>{disc.authorName}</span>
                  </div>
                  <span>
                    {new Date(disc.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {new Date(disc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[var(--text-primary)] pl-5 whitespace-pre-wrap">{disc.comment}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add Comment Input */}
        <form onSubmit={handlePostComment} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Discuss this finding with your team..."
            className="flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            disabled={submittingComment}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submittingComment}
            className="px-3 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors disabled:opacity-50"
          >
            {submittingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            <span>Comment</span>
          </button>
        </form>
      </div>
    </div>
  );
}
