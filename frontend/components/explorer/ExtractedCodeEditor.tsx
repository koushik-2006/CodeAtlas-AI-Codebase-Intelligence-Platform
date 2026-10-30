"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Copy, Check, Trash2, ArrowLeft, CheckCircle2 } from "lucide-react";

interface ExtractedCodeEditorProps {
  code: string;
  language: string;
  confidence?: number;
  errorMessage?: string | null;
  onChange: (code: string) => void;
  onLanguageChange: (lang: string) => void;
  onClear: () => void;
  onResetToInput?: () => void;
}

const LANGUAGES = [
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
];

export function ExtractedCodeEditor({
  code,
  language,
  confidence,
  errorMessage,
  onChange,
  onLanguageChange,
  onClear,
  onResetToInput,
}: ExtractedCodeEditorProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const lineCount = code ? code.split("\n").length : 0;
  const charCount = code ? code.length : 0;

  return (
    <div className="p-6 flex-1 flex flex-col justify-between">
      <div>
        {/* Header bar: Title + Language dropdown + Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Extracted Code · Editable
            </span>
            {confidence && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                {Math.round(confidence * 100)}% Confidence
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              aria-label="Code language"
              className={`py-1 px-2.5 rounded-lg text-xs font-semibold border outline-none cursor-pointer ${
                isDark
                  ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                  : "bg-white border-[#E5E5E0] text-[#1E2022]"
              }`}
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--primary)] px-2 py-1 rounded-lg border border-[var(--border-color)]"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            {/* Clear Button */}
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 text-xs font-mono text-red-500 hover:underline px-2 py-1"
              title="Clear code"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
          Review and correct any characters before requesting an analysis. The editor is fully interactive.
        </p>

        {errorMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Editable code editor textarea */}
        <div
          className={`rounded-2xl border p-4 font-mono text-xs sm:text-sm leading-6 transition-all ${
            isDark ? "bg-[#0A0F19] border-[#242B39]" : "bg-[#FAF9FF] border-[#E8E5F4]"
          }`}
        >
          <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            rows={12}
            placeholder="// Extracted code will appear here. You can also paste directly..."
            aria-label="Editable extracted code"
            className="w-full resize-y min-h-[220px] bg-transparent outline-none font-mono text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed"
          />
        </div>
      </div>

      {/* Footer Info & Return to Input */}
      <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] gap-2">
        <div className="flex items-center gap-2">
          <span>{lineCount} lines · {charCount} chars</span>
        </div>

        {onResetToInput && (
          <button
            type="button"
            onClick={onResetToInput}
            className="inline-flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Switch or Re-upload</span>
          </button>
        )}
      </div>
    </div>
  );
}
