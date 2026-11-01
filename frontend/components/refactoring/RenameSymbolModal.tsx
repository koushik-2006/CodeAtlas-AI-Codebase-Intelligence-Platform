"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Tag,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Search,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Check,
  GitPullRequest,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RenameSymbolPreview, SymbolRenameReference } from "@/types/refactoring";
import { previewSymbolRename, applySymbolRenameToStore } from "@/lib/demo/refactoring-engine";
import { getStore } from "@/lib/demo/store";

interface RenameSymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositoryId: string;
  defaultFilePath?: string;
  defaultSymbolName?: string;
  onRenameSuccess?: () => void;
}

export default function RenameSymbolModal({
  isOpen,
  onClose,
  repositoryId,
  defaultFilePath = "src/services/auth.ts",
  defaultSymbolName = "loginUser",
  onRenameSuccess,
}: RenameSymbolModalProps) {
  const router = useRouter();
  const [filePath, setFilePath] = useState(defaultFilePath);
  const [symbolName, setSymbolName] = useState(defaultSymbolName);
  const [newSymbolName, setNewSymbolName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [preview, setPreview] = useState<RenameSymbolPreview | null>(null);
  const [references, setReferences] = useState<SymbolRenameReference[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appliedPrInfo, setAppliedPrInfo] = useState<{ prId: string; prNumber: number; count: number } | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setAppliedPrInfo(null);

    const validIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    if (!validIdentifierRegex.test(newSymbolName.trim())) {
      setErrorMessage(`'${newSymbolName}' is not a valid identifier. Must start with a letter, $, or _ and contain no spaces or special symbols.`);
      return;
    }

    try {
      setIsAnalyzing(true);
      const store = getStore();
      const res = previewSymbolRename(store, repositoryId, filePath, symbolName.trim(), newSymbolName.trim());
      setPreview(res);
      setReferences(res.references);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to preview symbol rename.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleReference = (idx: number) => {
    setReferences((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, checked: !r.checked } : r))
    );
  };

  const handleToggleAll = () => {
    const allChecked = references.every((r) => r.checked);
    setReferences((prev) => prev.map((r) => ({ ...r, checked: !allChecked })));
  };

  const handleApply = () => {
    const checkedCount = references.filter((r) => r.checked).length;
    if (checkedCount === 0) {
      setErrorMessage("Please select at least one reference to apply the rename.");
      return;
    }

    try {
      setIsApplying(true);
      const store = getStore();
      const result = applySymbolRenameToStore(
        store,
        repositoryId,
        symbolName.trim(),
        newSymbolName.trim(),
        references
      );
      setAppliedPrInfo({
        prId: result.prId,
        prNumber: result.prNumber,
        count: checkedCount,
      });
      onRenameSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to apply rename.");
    } finally {
      setIsApplying(false);
    }
  };

  const checkedReferencesCount = references.filter((r) => r.checked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7C5CFC]/15 text-[#7C5CFC] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                Symbol-Aware Rename Workflow
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                AST-grounded reference resolution distinguishing verified call sites from text-only matches.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Applied Success State */}
          {appliedPrInfo && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Symbol Rename Applied Successfully!</span>
              </div>
              <p className="text-[var(--text-secondary)]">
                Updated {appliedPrInfo.count} references across repository files. Pull Request{" "}
                <strong>#{appliedPrInfo.prNumber}</strong> has been opened in <strong>/code-review</strong>.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    router.push(`/code-review?pr=${appliedPrInfo.prId}`);
                  }}
                  className="bg-[#7C5CFC] text-white gap-1.5 text-xs"
                >
                  <GitPullRequest className="w-3.5 h-3.5" />
                  View PR #{appliedPrInfo.prNumber}
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-1">
                  Declaration File Path
                </label>
                <input
                  type="text"
                  required
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  className="w-full text-xs font-mono bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[#7C5CFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-1">
                  Existing Symbol Name
                </label>
                <input
                  type="text"
                  required
                  value={symbolName}
                  onChange={(e) => setSymbolName(e.target.value)}
                  className="w-full text-xs font-mono bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[#7C5CFC]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-1">
                New Target Symbol Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. authenticateUserCredentials"
                value={newSymbolName}
                onChange={(e) => setNewSymbolName(e.target.value)}
                className="w-full text-xs font-mono bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-xl p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[#7C5CFC]"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="primary"
                type="submit"
                disabled={isAnalyzing || !newSymbolName.trim()}
                className="gap-2 bg-[#7C5CFC] hover:bg-[#6A4BE2] text-white"
              >
                <Search className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                {isAnalyzing ? "Resolving AST References..." : "Preview Symbol References"}
              </Button>
            </div>
          </form>

          {/* Results Section */}
          {preview && references.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
              {/* Summary Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[#7C5CFC]">{preview.symbolName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span className="font-mono font-bold text-[#2FD6A0]">{preview.newSymbolName}</span>
                  <span className="text-[var(--text-secondary)]">·</span>
                  <span className="text-[var(--text-primary)]">
                    {references.length} references across {preview.affectedFiles.length} file(s)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="brand">{preview.language}</Badge>
                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className="text-xs text-[#7C5CFC] hover:underline font-semibold ml-2"
                  >
                    {references.every((r) => r.checked) ? "Uncheck All" : "Select All"}
                  </button>
                </div>
              </div>

              {/* Warnings */}
              {preview.warnings.map((w, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-400 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}

              {/* References Table with Checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                  <span>Resolved Reference Locations ({checkedReferencesCount} of {references.length} selected):</span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {references.map((ref, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                        ref.checked
                          ? "bg-[var(--bg-card-hover)] border-[var(--border-color)]"
                          : "bg-[var(--bg-card)] border-[var(--border-color)] opacity-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleReference(idx)}
                            className="text-[var(--text-secondary)] hover:text-[#7C5CFC]"
                          >
                            {ref.checked ? (
                              <CheckSquare className="w-4 h-4 text-[#7C5CFC]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                          <span className="font-mono text-[#7C5CFC] font-semibold">
                            {ref.filePath}:{ref.line}
                          </span>
                        </div>

                        <div>
                          {ref.isResolvedAstReference ? (
                            <Badge variant="mint">AST Verified</Badge>
                          ) : ref.isAmbiguous ? (
                            <Badge variant="coral">Ambiguous Match</Badge>
                          ) : (
                            <Badge variant="gray">Text Match</Badge>
                          )}
                        </div>
                      </div>

                      {/* Before / After Preview */}
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="text-red-400/90 bg-[var(--bg-card)] px-2 py-1 rounded border border-red-500/20 truncate">
                          - {ref.beforeLine || ref.contextSnippet}
                        </div>
                        <div className="text-emerald-400 bg-[var(--bg-card)] px-2 py-1 rounded border border-emerald-500/20 truncate font-semibold">
                          + {ref.afterLine || ref.contextSnippet.replace(new RegExp(`\\b${symbolName}\\b`, "g"), newSymbolName)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Updates {checkedReferencesCount} reference(s) and creates a Pull Request in /code-review.
                </span>

                <Button
                  variant="primary"
                  onClick={handleApply}
                  disabled={isApplying || checkedReferencesCount === 0}
                  className="gap-2 bg-[#7C5CFC] hover:bg-[#6A4BE2] text-white"
                >
                  <Check className="w-4 h-4" />
                  {isApplying ? "Applying..." : `Apply Rename (${checkedReferencesCount})`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between">
          <p className="text-[11px] text-[var(--text-secondary)]">
            Never executes automatic blind global string replacements without AST confirmation.
          </p>

          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
