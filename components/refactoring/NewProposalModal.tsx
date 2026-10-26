"use client";

import React, { useState } from "react";
import {
  X,
  Wrench,
  Sparkles,
  AlertTriangle,
  Layers,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RefactoringOperationType, ProposeRefactoringRequest } from "@/types/refactoring";

interface NewProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositoryId: string;
  initialFilePath?: string;
  initialSymbolName?: string;
  initialLineRange?: { start: number; end: number };
  initialOperation?: RefactoringOperationType;
  onSubmit: (req: ProposeRefactoringRequest) => Promise<void>;
}

export default function NewProposalModal({
  isOpen,
  onClose,
  repositoryId,
  initialFilePath = "src/services/auth.ts",
  initialSymbolName = "loginUser",
  initialLineRange,
  initialOperation = "extract_function",
  onSubmit,
}: NewProposalModalProps) {
  const [filePath, setFilePath] = useState(initialFilePath);
  const [symbolName, setSymbolName] = useState(initialSymbolName);
  const [startLine, setStartLine] = useState<number | undefined>(initialLineRange?.start);
  const [endLine, setEndLine] = useState<number | undefined>(initialLineRange?.end);
  const [operation, setOperation] = useState<RefactoringOperationType>(initialOperation);
  const [customInstructions, setCustomInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!filePath.trim()) {
      setError("File path is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        repositoryId,
        filePath,
        symbolName: symbolName.trim() || undefined,
        startLine: startLine ? Number(startLine) : undefined,
        endLine: endLine ? Number(endLine) : undefined,
        operation,
        customInstructions: customInstructions.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to generate refactoring proposal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#29D3C2]/15 text-[#29D3C2] flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                Propose Safe Refactoring
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Minimal diff generation grounded in AST parse tree and repository intelligence.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-1">
                Target File Path *
              </label>
              <input
                type="text"
                required
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="e.g. src/services/auth.ts"
                className="w-full text-xs font-mono bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[#29D3C2]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-1">
                Target Symbol Name
              </label>
              <input
                type="text"
                value={symbolName}
                onChange={(e) => setSymbolName(e.target.value)}
                placeholder="e.g. loginUser"
                className="w-full text-xs font-mono bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[#29D3C2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-1">
                Start Line
              </label>
              <input
                type="number"
                value={startLine || ""}
                onChange={(e) => setStartLine(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Auto (Symbol start)"
                className="w-full text-xs font-mono bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[#29D3C2]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-[var(--text-primary)] mb-1">
                End Line
              </label>
              <input
                type="number"
                value={endLine || ""}
                onChange={(e) => setEndLine(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Auto (Symbol end)"
                className="w-full text-xs font-mono bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[#29D3C2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Refactoring Operation *
            </label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value as RefactoringOperationType)}
              className="w-full text-xs bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[#29D3C2]"
            >
              <option value="extract_function">Extract Function / Helper Subroutine</option>
              <option value="simplify_conditionals">Simplify Conditionals & Guard Clauses</option>
              <option value="separate_responsibilities">Separate Responsibilities (Decouple Storage/Transport)</option>
              <option value="improve_error_handling">Improve Error Handling & Typed Propagation</option>
              <option value="reduce_duplication">Reduce Duplicated Code</option>
              <option value="improve_type_clarity">Improve Type Clarity & Strict Narrowing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Custom Objectives & Constraints (Optional)
            </label>
            <textarea
              rows={2}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Ensure backward compatibility with existing LoginForm call site."
              className="w-full text-xs bg-[var(--bg-card-hover)] border border-[var(--border-color)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:border-[#29D3C2]"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
              {isSubmitting ? "Synthesizing Diff..." : "Generate Proposal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
