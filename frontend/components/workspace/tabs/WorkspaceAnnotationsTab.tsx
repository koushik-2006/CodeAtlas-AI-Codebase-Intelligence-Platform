"use client";

import { useState } from "react";
import Link from "next/link";
import {
  StickyNote,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Code2,
  ShieldAlert,
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileCode,
} from "lucide-react";
import { DbCodeAnnotation } from "@/types/workspace";
import { apiClient } from "@/services/api-client";
import { SAMPLE_PROJECT_CODE } from "@/lib/sample-repository-files";

interface WorkspaceAnnotationsTabProps {
  workspaceId: string;
  annotations: DbCodeAnnotation[];
  repositories: any[];
  canManage: boolean;
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export default function WorkspaceAnnotationsTab({
  workspaceId,
  annotations,
  repositories,
  canManage,
  onRefresh,
  showToast,
}: WorkspaceAnnotationsTabProps) {
  // Add Annotation Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [repoId, setRepoId] = useState(repositories[0]?.id || "sample-project");
  const [filePath, setFilePath] = useState("src/services/auth.ts");
  const [startLine, setStartLine] = useState<number>(1);
  const [endLine, setEndLine] = useState<number>(10);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("architecture");
  const [addingNote, setAddingNote] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Annotation Modal state
  const [editingNote, setEditingNote] = useState<DbCodeAnnotation | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete Annotation state
  const [deletingNote, setDeletingNote] = useState<DbCodeAnnotation | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Helper to extract preview code snippet
  const getCodeSnippet = (note: DbCodeAnnotation) => {
    if ((note as any).codeSnippet) return (note as any).codeSnippet;

    // Fallback extraction from SAMPLE_PROJECT_CODE
    const fileObj = (SAMPLE_PROJECT_CODE as any)[note.filePath];
    if (fileObj?.code) {
      const lines = fileObj.code.split("\n");
      const start = Math.max(0, (note.startLine || 1) - 1);
      const end = Math.min(lines.length, note.endLine || start + 6);
      return lines.slice(start, end).join("\n");
    }
    return `// Code region ${note.filePath}:${note.startLine}-${note.endLine}\nexport function verifyContext() {\n  return executeSecurityAudit();\n}`;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setAddError("Please provide both a title and annotation content");
      return;
    }

    try {
      setAddingNote(true);
      setAddError(null);

      const res = await apiClient.post<any>(`/api/workspaces/${workspaceId}/annotations`, {
        repositoryId: repoId,
        filePath: filePath.trim(),
        startLine: Number(startLine) || 1,
        endLine: Number(endLine) || 10,
        title: title.trim(),
        content: content.trim(),
        category,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to create code note");
      }

      showToast("Code note pinned to file!");
      setAddModalOpen(false);
      setTitle("");
      setContent("");
      onRefresh();
    } catch (err: any) {
      setAddError(err.message || "Failed to add annotation");
    } finally {
      setAddingNote(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editTitle.trim() || !editContent.trim()) return;

    try {
      setEditLoading(true);
      const res = await apiClient.patch<any>(`/api/workspaces/${workspaceId}/annotations`, {
        annotationId: editingNote.id,
        title: editTitle.trim(),
        content: editContent.trim(),
      });

      if (res.success) {
        showToast("Code note updated!");
        setEditingNote(null);
        onRefresh();
      } else {
        alert(res.message || "Failed to update annotation");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update annotation");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingNote) return;
    try {
      setDeleteLoading(true);
      const res = await apiClient.delete<any>(
        `/api/workspaces/${workspaceId}/annotations?annotationId=${deletingNote.id}`
      );
      if (res.success) {
        showToast("Code note deleted");
        setDeletingNote(null);
        onRefresh();
      } else {
        alert(res.message || "Failed to delete note");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete note");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case "security":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="w-3 h-3" />
            Security
          </span>
        );
      case "tech-debt":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
            Tech Debt
          </span>
        );
      case "optimization":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            Optimization
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-400">
            Architecture
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)]/60 pb-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">Code Annotations & Notes</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Persistent notes pinned directly to source lines, functions, and architecture boundaries.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Annotation</span>
          </button>
        )}
      </div>

      {/* Annotations List */}
      {annotations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-10 text-center bg-[var(--bg-card)]/40">
          <StickyNote className="w-10 h-10 text-[var(--text-secondary)]/60 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
            No code annotations pinned yet
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
            Annotate tricky algorithms, capture architectural constraints, and leave documentation for your teammates.
          </p>
          {canManage && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary)]/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Note</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {annotations.map((note) => {
            const snippet = getCodeSnippet(note);
            const snippetLines = snippet.split("\n");
            const startLineNum = note.startLine || 1;

            return (
              <div
                key={note.id}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 hover:border-[var(--border-color)]/90 transition-all"
              >
                {/* Note Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center flex-shrink-0">
                      <StickyNote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm text-[var(--text-primary)]">
                          {(note as any).title || "Code Note"}
                        </h3>
                        {getCategoryBadge(note.category)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-secondary)] flex-wrap">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-400 bg-[var(--bg-surface)] px-2 py-0.5 rounded-md border border-[var(--border-color)]">
                          <FolderGit2 className="w-3 h-3" />
                          {note.repositoryId}:{note.filePath}:{note.startLine}-{note.endLine}
                        </span>
                        {note.symbolName && (
                          <span className="text-[11px] font-mono text-purple-400">
                            symbol: {note.symbolName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canManage && (
                      <>
                        <button
                          onClick={() => {
                            setEditingNote(note);
                            setEditTitle((note as any).title || "Code Note");
                            setEditContent(note.content);
                          }}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors"
                          title="Edit note"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingNote(note)}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Note Content / Markdown */}
                <p className="text-xs text-[var(--text-primary)] leading-relaxed mb-4 pl-12 pr-2">
                  {note.content}
                </p>

                {/* Code Preview Card */}
                <div className="ml-12 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden font-mono text-xs">
                  <div className="px-3 py-1.5 bg-[var(--bg-card)] border-b border-[var(--border-color)]/60 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>{note.filePath}</span>
                    </span>
                    <span>Lines {note.startLine} - {note.endLine}</span>
                  </div>

                  <div className="p-3 overflow-x-auto text-[11px] space-y-0.5 leading-relaxed bg-[#0A0F19]/40">
                    {snippetLines.map((line: string, idx: number) => (
                      <div key={idx} className="flex gap-3 hover:bg-[var(--primary)]/5">
                        <span className="text-[var(--text-secondary)]/50 select-none w-7 text-right">
                          {startLineNum + idx}
                        </span>
                        <span className="text-[var(--text-primary)] whitespace-pre">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer link to repository file view */}
                <div className="flex items-center justify-end pt-3 mt-3 border-t border-[var(--border-color)]/40">
                  <Link
                    href={`/repositories/${note.repositoryId}?file=${encodeURIComponent(note.filePath)}&line=${note.startLine}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    <span>View in Repository</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Annotation Modal */}
      {addModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-6 relative">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <StickyNote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Add Code Annotation</h3>
                <p className="text-xs text-[var(--text-secondary)]">Pin notes to specific files and lines.</p>
              </div>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Annotation Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Critical Auth Challenge Replay Vulnerability"
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
                    value={repoId}
                    onChange={(e) => setRepoId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    {repositories.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    File Path
                  </label>
                  <input
                    type="text"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    placeholder="src/services/auth.ts"
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Start Line
                  </label>
                  <input
                    type="number"
                    value={startLine}
                    onChange={(e) => setStartLine(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    End Line
                  </label>
                  <input
                    type="number"
                    value={endLine}
                    onChange={(e) => setEndLine(Number(e.target.value))}
                    min={1}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="architecture">Architecture</option>
                    <option value="security">Security</option>
                    <option value="tech-debt">Tech Debt</option>
                    <option value="optimization">Optimization</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Annotation Note *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Explain why this code was written this way, known edge cases, or remediation plans..."
                  rows={3}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)]/60">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingNote || !title.trim() || !content.trim()}
                  className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold shadow-md shadow-[var(--primary)]/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addingNote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Annotation Modal */}
      {editingNote && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl p-6 relative">
            <button
              onClick={() => setEditingNote(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              Edit Code Note
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Update annotation content and title.
            </p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Note Content
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)]/60">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading || !editTitle.trim() || !editContent.trim()}
                  className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary)]/90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {editLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingNote && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[var(--bg-card)] shadow-2xl p-6 relative">
            <button
              onClick={() => setDeletingNote(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-400">Delete Annotation</h3>
                <p className="text-xs text-[var(--text-secondary)]">Remove note from code</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Are you sure you want to remove this code annotation? Teammates will no longer see this note pinned to {deletingNote.filePath}.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-color)]/60">
              <button
                type="button"
                onClick={() => setDeletingNote(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-red-600/20"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Annotation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
