"use client";

import { useState } from "react";
import { X, StickyNote, Loader2, AlertCircle } from "lucide-react";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { apiClient } from "@/services/api-client";

interface AddAnnotationModalProps {
  isOpen: boolean;
  repoId: string;
  filePath: string;
  line: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddAnnotationModal({
  isOpen,
  repoId,
  filePath,
  line,
  onClose,
  onSuccess,
}: AddAnnotationModalProps) {
  const { activeWorkspace } = useWorkspaces();
  const workspaceId = activeWorkspace?.id || "ws_team_demo";

  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"architecture" | "decision" | "limitation" | "tip" | "review">("architecture");
  const [symbolName, setSymbolName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write note content");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.post<any>(`/api/workspaces/${workspaceId}/annotations`, {
        repositoryId: repoId,
        filePath,
        startLine: line,
        endLine: line,
        symbolName: symbolName.trim() || undefined,
        content: content.trim(),
        category,
      });

      const json = res.data || {};
      if (!res.success) {
        throw new Error(json.error || res.message || "Failed to add code note");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add code note");
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
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <StickyNote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Add Team Note</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Anchored to <span className="font-mono text-[var(--primary)]">{filePath}:{line}</span>
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
              Category *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "architecture", label: "Architecture" },
                { id: "decision", label: "Decision" },
                { id: "limitation", label: "Limitation" },
                { id: "tip", label: "Developer Tip" },
                { id: "review", label: "Review Note" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id as any)}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                    category === c.id
                      ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
                      : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]/20"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
              Associated Symbol Name (Optional)
            </label>
            <input
              type="text"
              value={symbolName}
              onChange={(e) => setSymbolName(e.target.value)}
              placeholder="e.g. loginUser, validateEmail"
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
              Note Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Explain why this module exists, an architectural decision, or known performance limitation..."
              rows={4}
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              disabled={loading}
              autoFocus
            />
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
              disabled={loading || !content.trim()}
              className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-medium transition-all shadow-md shadow-[var(--primary)]/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Note</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
