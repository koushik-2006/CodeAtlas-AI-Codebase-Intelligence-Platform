"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RenameSymbolPreview } from "@/types/refactoring";

interface RenameSymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositoryId: string;
  defaultFilePath?: string;
  defaultSymbolName?: string;
}

export default function RenameSymbolModal({
  isOpen,
  onClose,
  repositoryId,
  defaultFilePath = "src/services/auth.ts",
  defaultSymbolName = "loginUser",
}: RenameSymbolModalProps) {
  const [filePath, setFilePath] = useState(defaultFilePath);
  const [symbolName, setSymbolName] = useState(defaultSymbolName);
  const [newSymbolName, setNewSymbolName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<RenameSymbolPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validIdentifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    if (!validIdentifierRegex.test(newSymbolName)) {
      setErrorMessage(`'${newSymbolName}' is not a valid identifier. Must start with a letter, $, or _ and contain no spaces.`);
      return;
    }

    try {
      setIsAnalyzing(true);
      const res = await fetch("/api/refactoring/rename-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId,
          filePath,
          symbolName,
          newSymbolName,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to analyze rename references.");
      }

      setPreview(data.renamePreview);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to preview symbol rename.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#29D3C2]/15 text-[#29D3C2] flex items-center justify-center">
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
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-1">
                  File Path
                </label>
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="e.g. src/services/auth.ts"
                  className="w-full text-xs font-mono bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[#29D3C2]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-1">
                  Current Symbol
                </label>
                <input
                  type="text"
                  value={symbolName}
                  onChange={(e) => setSymbolName(e.target.value)}
                  placeholder="e.g. loginUser"
                  className="w-full text-xs font-mono bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[#29D3C2]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-1">
                  New Symbol Name
                </label>
                <input
                  type="text"
                  value={newSymbolName}
                  onChange={(e) => setNewSymbolName(e.target.value)}
                  placeholder="e.g. authenticateUser"
                  className="w-full text-xs font-mono bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[#29D3C2]"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="primary"
                type="submit"
                disabled={isAnalyzing || !newSymbolName.trim()}
                className="gap-2"
              >
                <Search className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                {isAnalyzing ? "Resolving AST References..." : "Preview Symbol References"}
              </Button>
            </div>
          </form>

          {/* Results Section */}
          {preview && (
            <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
              {/* Summary Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[#29D3C2]">{preview.symbolName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span className="font-mono font-bold text-[#2FD6A0]">{preview.newSymbolName}</span>
                  <span className="text-[var(--text-secondary)]">·</span>
                  <span className="text-[var(--text-primary)]">
                    {preview.totalReferences} references across {preview.affectedFiles.length} file(s)
                  </span>
                </div>

                <Badge variant={preview.isSupportedLanguage ? "mint" : "sun"}>
                  {preview.language}
                </Badge>
              </div>

              {/* Warnings */}
              {preview.warnings.map((w, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-xs text-orange-400 flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}

              {/* References Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  Resolved Reference Locations:
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {preview.references.map((ref, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[#29D3C2] font-semibold">
                          {ref.filePath}:{ref.line}
                        </span>

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

                      <pre className="font-mono text-[11px] text-[var(--text-secondary)] bg-[var(--bg-card)] p-2 rounded border border-[var(--border-color)] truncate">
                        {ref.contextSnippet}
                      </pre>
                    </div>
                  ))}
                </div>
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
