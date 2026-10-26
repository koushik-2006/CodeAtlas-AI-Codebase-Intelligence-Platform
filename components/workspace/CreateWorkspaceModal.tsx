"use client";

import { useState } from "react";
import { X, Building2, Loader2, Users, AlertCircle } from "lucide-react";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workspace: any) => void;
}

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allowMemberInvites, setAllowMemberInvites] = useState(true);
  const [requireReviewDismissalReason, setRequireReviewDismissalReason] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a workspace name");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          settings: {
            allowMemberInvites,
            requireReviewDismissalReason,
          },
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to create workspace");
      }

      onSuccess(json.data);
    } catch (err: any) {
      console.error("Create workspace error:", err);
      setError(err.message || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Create Team Workspace</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Collaborate with teammates on repositories, artifacts, and reviews.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
              Workspace Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Core Engineering, Platform Security"
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Shared workspace for authentication, architecture maps, and pull request intelligence."
              rows={2}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              disabled={loading}
            />
          </div>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={allowMemberInvites}
                onChange={(e) => setAllowMemberInvites(e.target.checked)}
                className="mt-0.5 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
                disabled={loading}
              />
              <span className="text-xs text-[var(--text-secondary)]">
                Allow workspace members and admins to invite teammates
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requireReviewDismissalReason}
                onChange={(e) => setRequireReviewDismissalReason(e.target.checked)}
                className="mt-0.5 rounded border-[var(--border-color)] text-[var(--primary)] focus:ring-[var(--primary)]"
                disabled={loading}
              />
              <span className="text-xs text-[var(--text-secondary)]">
                Require audit reason when teammates dismiss review findings
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)]/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-medium transition-all shadow-md shadow-[var(--primary)]/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Create Workspace</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
