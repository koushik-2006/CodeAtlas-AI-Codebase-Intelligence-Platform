"use client";

import React, { useState } from "react";
import { ReviewFinding, PullRequestDetail, PRReviewStatus } from "@/types/review";
import {
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  XCircle,
  Globe,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  updatePullRequest,
  logActivity,
  getStore,
} from "@/lib/demo/store";

interface PublishCommentModalProps {
  pr: PullRequestDetail;
  findings: ReviewFinding[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (status: PRReviewStatus) => void;
}

export function PublishCommentModal({
  pr,
  findings,
  isOpen,
  onClose,
  onSuccess,
}: PublishCommentModalProps) {
  const [reviewAction, setReviewAction] = useState<"approve" | "request_changes" | "comment">("comment");
  const [summaryText, setSummaryText] = useState<string>(
    pr.aiSummary?.recommendedAction
      ? `### Review Summary\n\n${pr.aiSummary.what}\n\n**Recommendation:** ${pr.aiSummary.recommendedAction}`
      : "Overall look good, reviewed against security policies and test criteria."
  );
  const [selectedFindingIds, setSelectedFindingIds] = useState<string[]>(() =>
    findings.filter((f) => f.severity === "critical" || f.severity === "warning").map((f) => f.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGitHubConfirmation, setShowGitHubConfirmation] = useState(false);

  if (!isOpen) return null;

  const toggleFindingSelection = (id: string) => {
    setSelectedFindingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePublishReview = async () => {
    // If it's a real GitHub PR and not confirmed yet, show confirmation screen
    if (pr.isRealGitHubPr && !showGitHubConfirmation) {
      setShowGitHubConfirmation(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const statusMap: Record<string, PRReviewStatus> = {
        approve: "approved",
        request_changes: "changes_requested",
        comment: "commented",
      };
      const finalStatus = statusMap[reviewAction] || "commented";

      // Append review event to PR timeline
      const store = getStore();
      const existingPr = store.pullRequests?.find((p: any) => p.id === pr.id || String(p.number) === pr.id);
      if (existingPr) {
        if (!existingPr.timeline) existingPr.timeline = [];
        existingPr.timeline.push({
          id: `tl_rev_${Date.now()}`,
          type: reviewAction === "approve" ? "approved" : reviewAction === "request_changes" ? "changes_requested" : "commented",
          title:
            reviewAction === "approve"
              ? "Alex Chen approved these changes"
              : reviewAction === "request_changes"
              ? "Alex Chen requested changes"
              : "Alex Chen submitted a review comment",
          actor: {
            name: "Alex Chen",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
          },
          timestamp: new Date().toISOString(),
          description: summaryText.slice(0, 120),
        });

        existingPr.reviewStatus = finalStatus;
      }

      updatePullRequest(pr.id, { reviewStatus: finalStatus });

      logActivity({
        type: `review_${reviewAction}`,
        title: `${
          reviewAction === "approve"
            ? "Approved"
            : reviewAction === "request_changes"
            ? "Requested Changes on"
            : "Reviewed"
        } PR #${pr.number}`,
        description: summaryText.slice(0, 100),
        href: `/code-review?pr=${pr.id}`,
        status: reviewAction === "approve" ? "success" : reviewAction === "request_changes" ? "warning" : "info",
      });

      onSuccess(finalStatus);
      onClose();
    } catch (err) {
      console.error("Failed to publish review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#7C5CFC]" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              Submit Review for PR #{pr.number}: {pr.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GitHub Confirmation Screen (if real GitHub PR) */}
        {showGitHubConfirmation ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/30 flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-[#7C5CFC] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-[var(--text-primary)] block font-bold">
                  Publish to GitHub API
                </strong>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  This review will be dispatched via GitHub REST endpoint{" "}
                  <code className="text-[#7C5CFC]">POST /repos/{pr.repositoryId}/pulls/{pr.number}/reviews</code>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-[var(--border-color)] font-mono text-[11px] space-y-1">
              <div><strong>Action:</strong> {reviewAction.toUpperCase()}</div>
              <div><strong>Selected Findings:</strong> {selectedFindingIds.length} attached</div>
              <div className="truncate"><strong>Summary:</strong> {summaryText.slice(0, 80)}...</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGitHubConfirmation(false)}
                className="text-xs"
              >
                Back to Edit
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePublishReview}
                disabled={isSubmitting}
                className="bg-[#7C5CFC] text-white text-xs gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Post to GitHub</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Review Decision Radios */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase">
                Review Decision
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewAction("comment")}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    reviewAction === "comment"
                      ? "bg-[#7C5CFC]/15 border-[#7C5CFC] font-bold text-[#7C5CFC] shadow-xs"
                      : "bg-[var(--bg-card-hover)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                  <span>Comment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewAction("approve")}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    reviewAction === "approve"
                      ? "bg-emerald-500/15 border-emerald-500 font-bold text-emerald-400 shadow-xs"
                      : "bg-[var(--bg-card-hover)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <span>Approve</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewAction("request_changes")}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    reviewAction === "request_changes"
                      ? "bg-rose-500/15 border-rose-500 font-bold text-rose-400 shadow-xs"
                      : "bg-[var(--bg-card-hover)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <XCircle className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                  <span>Request Changes</span>
                </button>
              </div>
            </div>

            {/* Summary Textarea */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase mb-1">
                Review Summary & Guidance (Markdown)
              </label>
              <textarea
                rows={5}
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Leave an overall summary of the pull request changes..."
                className="w-full p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]"
              />
            </div>

            {/* Include findings checkboxes */}
            {findings.length > 0 && (
              <div>
                <label className="block text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase mb-1">
                  Include Findings in Official Review ({selectedFindingIds.length}/{findings.length})
                </label>
                <div className="max-h-36 overflow-y-auto p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-1.5">
                  {findings.map((f) => {
                    const isSelected = selectedFindingIds.includes(f.id);
                    return (
                      <label
                        key={f.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-card)] cursor-pointer text-[11px]"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFindingSelection(f.id)}
                          className="accent-[#7C5CFC] rounded cursor-pointer"
                        />
                        <span className="font-bold text-[var(--text-primary)] truncate flex-1">
                          [{f.severity.toUpperCase()}] {f.title}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-secondary)] shrink-0">
                          {f.file}:{f.line || 1}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePublishReview}
                disabled={isSubmitting}
                className="bg-[#7C5CFC] text-white hover:bg-[#6A4BE2] text-xs gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Review</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
