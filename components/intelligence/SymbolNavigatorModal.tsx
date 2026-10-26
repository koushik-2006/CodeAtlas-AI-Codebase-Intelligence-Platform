"use client";

import { useTheme } from "@/hooks/useTheme";
import { SymbolNavigationResult, SymbolNavigationTarget } from "@/types/symbol-navigation";
import {
  X,
  Compass,
  FileCode,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Code2,
  TestTube2,
  Share2,
} from "lucide-react";
import { useState } from "react";

interface SymbolNavigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SymbolNavigationResult | null;
  onNavigate: (file: string, line: number) => void;
}

export function SymbolNavigatorModal({
  isOpen,
  onClose,
  result,
  onNavigate,
}: SymbolNavigatorModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<"def" | "callers" | "callees" | "refs" | "tests">("def");
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen || !result) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const jumpTo = (target: SymbolNavigationTarget) => {
    onNavigate(target.file, target.line);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-page)]/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-[var(--text-primary)] truncate">
                  {result.symbolName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                  {result.definition?.symbolType || "symbol"}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {result.queryFile}:{result.queryLine}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(result.symbolName, "name")}
              className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] text-xs flex items-center gap-1 transition-colors"
              title="Copy Symbol Name"
            >
              {copied === "name" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-mono">Copy Name</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy(`${result.queryFile}:${result.queryLine}`, "path")}
              className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] text-xs flex items-center gap-1 transition-colors"
              title="Copy Path"
            >
              {copied === "path" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline font-mono">Copy Path</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border-color)] px-4 bg-[var(--bg-surface)] overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("def")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "def"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Definition
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("callers")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "callers"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Callers ({result.callers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("callees")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "callees"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Callees ({result.callees.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("refs")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "refs"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            References ({result.references.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tests")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "tests"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <TestTube2 className="w-3.5 h-3.5" />
            Tests ({result.relatedTests.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: DEFINITION */}
          {activeTab === "def" && (
            <div className="space-y-4">
              {result.definition ? (
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-[var(--primary)]" />
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                        {result.definition.file}:{result.definition.line}
                      </span>
                      {result.definition.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                          <CheckCircle className="w-3 h-3" />
                          AST Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Text Heuristic
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => jumpTo(result.definition!)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
                    >
                      <span>Jump to Definition</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {result.definition.previewSnippet && (
                    <pre className="p-3 rounded-lg font-mono text-xs overflow-x-auto bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)]">
                      {result.definition.previewSnippet}
                    </pre>
                  )}

                  <p className="text-xs text-[var(--text-secondary)] italic">
                    {result.definition.reason}
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                  No explicit definition declaration found for &apos;{result.symbolName}&apos;.
                </div>
              )}

              {result.isAmbiguous && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-500 text-xs">
                  <span className="font-bold">Ambiguous Symbol:</span> Multiple declarations match this identifier. Select a candidate below.
                  <div className="mt-2 space-y-1">
                    {result.candidates.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => jumpTo(c)}
                        className="w-full text-left p-2 rounded-lg bg-[var(--bg-surface)] hover:border-[var(--primary)] border border-transparent font-mono text-[11px] flex justify-between"
                      >
                        <span>{c.file}:{c.line}</span>
                        <span className="text-[var(--text-secondary)]">{c.symbolType}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CALLERS */}
          {activeTab === "callers" && (
            <div className="space-y-2">
              {result.callers.length > 0 ? (
                result.callers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => jumpTo(c)}
                    className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/30 hover:border-[var(--primary)] cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                        {c.name}()
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                        {c.file}:{c.line}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--primary)] inline-flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                  No upstream callers identified in current repository index.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CALLEES */}
          {activeTab === "callees" && (
            <div className="space-y-2">
              {result.callees.length > 0 ? (
                result.callees.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => jumpTo(c)}
                    className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/30 hover:border-[var(--primary)] cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                        {c.name}()
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                        {c.file}:{c.line}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--primary)] inline-flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                  No downstream functions invoked by &apos;{result.symbolName}&apos;.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REFERENCES */}
          {activeTab === "refs" && (
            <div className="space-y-2">
              {result.references.length > 0 ? (
                result.references.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => jumpTo(r)}
                    className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/30 hover:border-[var(--primary)] cursor-pointer transition-colors space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[11px] font-bold text-[var(--primary)]">
                        {r.file}:{r.line}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">Line {r.line}</span>
                    </div>
                    <pre className="font-mono text-xs text-[var(--text-primary)] truncate">
                      {r.lineText}
                    </pre>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                  No cross-file references found for &apos;{result.symbolName}&apos;.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TESTS */}
          {activeTab === "tests" && (
            <div className="space-y-2">
              {result.relatedTests.length > 0 ? (
                result.relatedTests.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => jumpTo(t)}
                    className="p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-page)]/30 hover:border-[var(--primary)] cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <TestTube2 className="w-3.5 h-3.5 text-purple-500" />
                        {t.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                        {t.file}:{t.line}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[var(--primary)] inline-flex items-center gap-1">
                      Inspect Test <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                  No linked test assertions discovered targeting &apos;{result.symbolName}&apos;.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
