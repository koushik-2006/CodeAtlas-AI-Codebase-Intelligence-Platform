"use client";

import React, { useState } from "react";
import { FolderGit2, GitPullRequest, GitBranch, FileCode, X, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createPullRequest } from "@/lib/demo/store";

interface NewReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (prId: string) => void;
  repositories: Array<{ id: string; name: string }>;
  defaultRepoId?: string;
}

export function NewReviewModal({
  isOpen,
  onClose,
  onCreated,
  repositories,
  defaultRepoId = "sample-project",
}: NewReviewModalProps) {
  const [selectedRepo, setSelectedRepo] = useState(defaultRepoId);
  const [mode, setMode] = useState<"diff" | "versions">("diff");
  const [title, setTitle] = useState("feat(security): Implement rate limiting & CSRF defense");
  const [body, setBody] = useState("Introduces strict token bucket rate limiter and double-submit cookie verification.");
  const [baseBranch, setBaseBranch] = useState("main");
  const [headBranch, setHeadBranch] = useState("feat/rate-limiting");

  const sampleDiff = `diff --git a/src/middleware/rate-limit.ts b/src/middleware/rate-limit.ts
new file mode 100644
--- /dev/null
+++ b/src/middleware/rate-limit.ts
@@ -0,0 +1,15 @@
+import { Request, Response, NextFunction } from 'express';
+
+const ipBuckets = new Map<string, number>();
+
+export function rateLimiter(req: Request, res: Response, next: NextFunction) {
+  const ip = req.ip || '127.0.0.1';
+  const count = (ipBuckets.get(ip) || 0) + 1;
+  ipBuckets.set(ip, count);
+  if (count > 100) {
+    return res.status(429).json({ error: 'Too many requests' });
+  }
+  next();
+}`;

  const [rawDiff, setRawDiff] = useState(sampleDiff);
  const [targetFile, setTargetFile] = useState("src/middleware/rate-limit.ts");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!title.trim() || !rawDiff.trim()) return;

    setIsSubmitting(true);

    try {
      // Calculate additions/deletions from diff
      const lines = rawDiff.split("\n");
      const additions = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
      const deletions = lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length;

      const newPr = createPullRequest({
        repositoryId: selectedRepo,
        source: "Demo",
        title: title.trim(),
        body: body.trim(),
        baseBranch,
        headBranch,
        additions,
        deletions,
        files: [
          {
            filename: targetFile,
            status: "added",
            additions,
            deletions,
            changes: additions + deletions,
            patch: rawDiff,
          },
        ],
      });

      onCreated(newPr.id);
      onClose();
    } catch (err) {
      console.error("Failed to create review PR:", err);
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
            <GitPullRequest className="w-4 h-4 text-[#7C5CFC]" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              Create Pull Request for Code Review
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

        {/* Form Fields */}
        <div className="space-y-3.5 text-xs">
          {/* Repository Selector */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase mb-1">
              Target Repository *
            </label>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
              <FolderGit2 className="w-4 h-4 text-[#7C5CFC] shrink-0" />
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full bg-transparent font-semibold text-[var(--text-primary)] outline-none cursor-pointer"
              >
                {repositories.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title & Branches */}
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase mb-1">
                Pull Request Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. feat(auth): Add WebAuthn challenge replay check"
                className="w-full p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-semibold outline-none focus:border-[#7C5CFC]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-[var(--text-secondary)] uppercase mb-1">
                  Head Branch (Changes)
                </label>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
                  <GitBranch className="w-3.5 h-3.5 text-[#7C5CFC] shrink-0" />
                  <input
                    type="text"
                    value={headBranch}
                    onChange={(e) => setHeadBranch(e.target.value)}
                    className="w-full bg-transparent font-mono text-[11px] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[var(--text-secondary)] uppercase mb-1">
                  Base Branch (Target)
                </label>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
                  <GitBranch className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    value={baseBranch}
                    onChange={(e) => setBaseBranch(e.target.value)}
                    className="w-full bg-transparent font-mono text-[11px] text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMode("diff")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                mode === "diff"
                  ? "bg-[#7C5CFC] text-white"
                  : "bg-[var(--bg-card-hover)] text-[var(--text-secondary)]"
              }`}
            >
              Paste a Diff
            </button>
            <button
              type="button"
              onClick={() => setMode("versions")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                mode === "versions"
                  ? "bg-[#7C5CFC] text-white"
                  : "bg-[var(--bg-card-hover)] text-[var(--text-secondary)]"
              }`}
            >
              Compare Two Files / Versions
            </button>
          </div>

          {/* Diff Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase">
                Unified Git Diff *
              </label>
              <button
                type="button"
                onClick={() => setRawDiff(sampleDiff)}
                className="text-[10px] font-mono text-[#7C5CFC] hover:underline"
              >
                Load Sample Diff
              </button>
            </div>
            <textarea
              rows={6}
              value={rawDiff}
              onChange={(e) => setRawDiff(e.target.value)}
              placeholder="diff --git a/src/index.ts b/src/index.ts..."
              className="w-full p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)] outline-none focus:border-[#7C5CFC]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            disabled={isSubmitting || !title.trim() || !rawDiff.trim()}
            className="bg-[#7C5CFC] text-white hover:bg-[#6A4BE2] text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create PR & Review</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

