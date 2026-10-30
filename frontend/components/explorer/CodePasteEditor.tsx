"use client";

import { useTheme } from "@/hooks/useTheme";
import { Trash2, FileCode, Check } from "lucide-react";

interface CodePasteEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  onLoadSnippet: (snippetKey: "auth" | "routes" | "ts") => void;
  onClear: () => void;
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

export function CodePasteEditor({
  code,
  onChange,
  language,
  onLanguageChange,
  onLoadSnippet,
  onClear,
}: CodePasteEditorProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const lines = code ? code.split("\n").length : 0;
  const chars = code ? code.length : 0;
  const isTooLarge = chars > 50000;

  return (
    <div className="space-y-3">
      {/* Control bar: Language selector + Presets + Clear */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <label htmlFor="lang-select" className="text-xs font-bold text-[var(--text-secondary)]">
            Language:
          </label>
          <select
            id="lang-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
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
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onLoadSnippet("auth")}
            className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--primary)] hover:underline"
          >
            Load auth.py
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onLoadSnippet("ts")}
            className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--primary)] hover:underline"
          >
            Load LoginForm.tsx
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-red-500 hover:underline ml-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          placeholder="// Paste or edit source code here...&#10;export function authenticateUser(credentials) {&#10;  return authService.verify(credentials);&#10;}"
          rows={14}
          aria-label="Paste source code editor"
          className={`w-full p-4 rounded-2xl font-mono text-xs sm:text-sm leading-6 outline-none border transition-all resize-y min-h-[300px] ${
            isDark
              ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3] placeholder-[#8B949E]/50 focus:border-[#29D3C2]"
              : "bg-[#1E2022] text-white border-transparent placeholder-white/40 focus:ring-2 focus:ring-[#6C4DFF]"
          } ${isTooLarge ? "border-red-500" : ""}`}
        />

        {isTooLarge && (
          <p className="mt-1 text-xs text-red-500 font-semibold">
            Input exceeds 50,000 characters. Please reduce snippet size for optimal AST parsing.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
        <span>{lines} lines · {chars} characters</span>
        <span>Selected: {LANGUAGES.find((l) => l.id === language)?.label || language}</span>
      </div>
    </div>
  );
}
