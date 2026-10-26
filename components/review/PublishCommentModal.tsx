"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { ReviewFinding } from "@/types/review";
import { codeReviewService } from "@/services/code-review-service";
import {
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Loader2,
} from "lucide-react";

interface PublishCommentModalProps {
  finding: ReviewFinding;
  repositoryId: string;
  pullRequestNumber: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (commentUrl?: string) => void;
}

export function PublishCommentModal({
  finding,
  repositoryId,
  pullRequestNumber,
  isOpen,
  onClose,
  onSuccess,
}: PublishCommentModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const defaultComment = `### [CodeAtlas Review] ${finding.title}\n\n**Severity:** \`${finding.severity.toUpperCase()}\` | **Category:** \`${finding.category.toUpperCase()}\`\n**File:** \`${finding.file}${finding.line ? `:${finding.line}` : ""}\`\n\n${finding.description}\n\n**Suggested Remediation:**\n\`\`\`\n${finding.suggestedRemediation}\n\`\`\``;

  const [commentBody, setCommentBody] = useState<string>(defaultComment);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePublish = async () => {
    setIsSubmitting(true);
    setResultMessage(null);

    try {
      const res = await codeReviewService.publishCommentToGitHub(
        repositoryId,
        pullRequestNumber,
        finding.id,
        commentBody
      );

      if (res.success) {
        setResultMessage(res.message || "Comment published successfully to GitHub pull request.");
        setTimeout(() => {
          onSuccess(res.commentUrl);
          onClose();
        }, 1200);
      } else {
        setResultMessage(`Error: ${res.message || "Failed to publish comment"}`);
      }
    } catch (err: any) {
      setResultMessage(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-lg rounded-2xl border p-5 shadow-xl transition-all ${
          isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Publish Comment to Pull Request #{pullRequestNumber}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-page)] text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-3 space-y-3">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Review and edit the comment before submitting to GitHub. The comment will be posted under your authorized identity or recorded in repository review history.
          </p>

          <div>
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">
              Markdown Comment Body
            </label>
            <textarea
              rows={8}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              className={`w-full p-3 rounded-xl font-mono text-xs border outline-none leading-relaxed ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                  : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
              }`}
            />
          </div>

          {resultMessage && (
            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              isDark
                ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
                : "bg-[#6C4DFF] text-white hover:bg-[#5b3ee0]"
            } disabled:opacity-50`}
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isSubmitting ? "Publishing..." : "Confirm & Post Comment"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
