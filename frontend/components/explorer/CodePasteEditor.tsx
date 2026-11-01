"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
  Trash2,
  FileCode,
  Check,
  FolderGit2,
  Bug,
  Sparkles,
  ChevronRight,
  X,
  AlertCircle,
  Copy,
} from "lucide-react";
import { SAMPLE_SNIPPETS, BUGGY_SNIPPET, detectLanguage, BugMarker } from "@/lib/demo/explorer-engine";
import { getStore } from "@/lib/demo/store";

interface CodePasteEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  onLoadSnippet: (snippetKey: string) => void;
  onClear: () => void;
  bugMarkers?: BugMarker[];
  highlightLine?: number | null;
}

const LANGUAGES = [
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "go", label: "Go" },
  { id: "sql", label: "SQL" },
  { id: "rust", label: "Rust" },
  { id: "cpp", label: "C++" },
];

export function CodePasteEditor({
  code,
  onChange,
  language,
  onLanguageChange,
  onLoadSnippet,
  onClear,
  bugMarkers = [],
  highlightLine = null,
}: CodePasteEditorProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Repositories picker modal state
  const [showRepoModal, setShowRepoModal] = useState<boolean>(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("sample-project");
  const [selectedFilePath, setSelectedFilePath] = useState<string>("");
  const [lineRangeStart, setLineRangeStart] = useState<number>(1);
  const [lineRangeEnd, setLineRangeEnd] = useState<number>(100);

  // Line numbers & gutter synchronization
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = code ? code.split("\n") : [""];
  const lineCount = lines.length;
  const chars = code ? code.length : 0;
  const isTooLarge = chars > 50000;

  // Auto-detect language when code changes significantly if user hasn't explicitly locked
  useEffect(() => {
    if (code && code.length > 20) {
      const detected = detectLanguage(code);
      if (detected.confidence > 0.9 && detected.language !== language) {
        // Soft suggestion or auto-update
      }
    }
  }, [code, language]);

  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Repository files from demo store
  const store = getStore();
  const repositories = store.repositories || [];
  const repoFilesMap = store.repositoryFiles?.[selectedRepoId] || {};
  const availableFiles = Object.keys(repoFilesMap);

  const handleLoadFromRepo = () => {
    if (!selectedFilePath || !repoFilesMap[selectedFilePath]) return;
    const fileData = repoFilesMap[selectedFilePath];
    const rawLines = fileData.code.split("\n");

    const start = Math.max(1, Math.min(lineRangeStart, rawLines.length));
    const end = Math.max(start, Math.min(lineRangeEnd, rawLines.length));

    const slice = rawLines.slice(start - 1, end).join("\n");
    onChange(slice);
    if (fileData.language) {
      onLanguageChange(fileData.language);
    }
    setShowRepoModal(false);
  };

  return (
    <div className="space-y-3">
      {/* Top Controls: Language + Snippet pills + Repository Picker */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="lang-select-input" className="text-xs font-bold text-[var(--text-secondary)]">
            Language:
          </label>
          <select
            id="lang-select-input"
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

          {/* Pick from repo button */}
          <button
            type="button"
            onClick={() => setShowRepoModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 active:scale-95 transition-all"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Pick from Repository</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-500 hover:underline"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Snippet Quick Picker Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-mono text-[var(--text-secondary)] mr-1">
          Sample Snippets:
        </span>

        {/* Buggy Sample button with distinct badge */}
        <button
          type="button"
          onClick={() => {
            onLoadSnippet("buggy");
            onLanguageChange("typescript");
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-rose-500/15 border border-rose-500/30 text-rose-500 hover:bg-rose-500/25 active:scale-95 transition-all"
        >
          <Bug className="w-3 h-3" />
          <span>Buggy Code (Find Bugs)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onLoadSnippet("typescript");
            onLanguageChange("typescript");
          }}
          className="px-2.5 py-1 rounded-lg text-[11px] font-mono border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]"
        >
          TS / JS
        </button>

        <button
          type="button"
          onClick={() => {
            onLoadSnippet("python");
            onLanguageChange("python");
          }}
          className="px-2.5 py-1 rounded-lg text-[11px] font-mono border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]"
        >
          Python
        </button>

        <button
          type="button"
          onClick={() => {
            onLoadSnippet("java");
            onLanguageChange("java");
          }}
          className="px-2.5 py-1 rounded-lg text-[11px] font-mono border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]"
        >
          Java
        </button>

        <button
          type="button"
          onClick={() => {
            onLoadSnippet("go");
            onLanguageChange("go");
          }}
          className="px-2.5 py-1 rounded-lg text-[11px] font-mono border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]"
        >
          Go
        </button>

        <button
          type="button"
          onClick={() => {
            onLoadSnippet("sql");
            onLanguageChange("sql");
          }}
          className="px-2.5 py-1 rounded-lg text-[11px] font-mono border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]"
        >
          SQL
        </button>
      </div>

      {/* Code Editor with Line Number Gutter + Inline Bug Markers */}
      <div
        className={`relative rounded-2xl border flex overflow-hidden ${
          isDark
            ? "bg-[#0A0E17] border-[#242B39]"
            : "bg-[#1E2022] border-[#2A2E35] text-white"
        }`}
      >
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className={`w-12 select-none overflow-hidden py-4 text-right pr-3 font-mono text-xs leading-6 border-r ${
            isDark
              ? "bg-[#070A10] border-[#1C2230] text-[#48536A]"
              : "bg-[#16181A] border-[#2A2E35] text-[#71767D]"
          }`}
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const hasBug = bugMarkers.some((b) => b.line === lineNum);
            const isHighlighted = highlightLine === lineNum;

            return (
              <div
                key={i}
                className={`relative h-6 ${
                  hasBug
                    ? "text-rose-500 font-extrabold"
                    : isHighlighted
                    ? "text-amber-400 font-bold"
                    : ""
                }`}
              >
                {hasBug && (
                  <span
                    className="absolute left-1 top-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"
                    title="Bug detected on line"
                  />
                )}
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            placeholder="// Paste or edit source code here...&#10;export function authenticateUser(credentials) {&#10;  return authService.verify(credentials);&#10;}"
            rows={15}
            spellCheck={false}
            aria-label="Source code editor"
            className="w-full h-full p-4 font-mono text-xs sm:text-sm leading-6 outline-none bg-transparent resize-y min-h-[340px] text-emerald-400 placeholder-white/30"
          />
        </div>
      </div>

      {/* Inline Bug Notice Bar (if any bug markers present) */}
      {bugMarkers.length > 0 && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{bugMarkers.length} Inline Bug Markers in Editor:</span>
          </div>
          <div className="space-y-1 pl-5">
            {bugMarkers.map((b, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px]">
                <span className="font-mono px-1.5 py-0.5 rounded bg-rose-500/20 font-bold">
                  Line {b.line}
                </span>
                <span className="opacity-90">{b.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buffer metadata footer */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
        <span>
          {lineCount} lines · {chars} characters
        </span>
        <span className="capitalize">
          Mode: {LANGUAGES.find((l) => l.id === language)?.label || language}
        </span>
      </div>

      {/* Pick From Repository Modal */}
      {showRepoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-3xl border p-6 space-y-5 shadow-2xl ${
              isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-white border-[#E8E5F4]"
            }`}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Pick File from Indexed Repository
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRepoModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">
                  Repository:
                </label>
                <select
                  value={selectedRepoId}
                  onChange={(e) => {
                    setSelectedRepoId(e.target.value);
                    setSelectedFilePath("");
                  }}
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                    isDark
                      ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                      : "bg-[#FAF9FF] border-[#E8E5F4] text-[#1E2022]"
                  }`}
                >
                  {repositories.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.language || "Multi-repo"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-[var(--text-secondary)] block mb-1">
                  Select File:
                </label>
                <select
                  value={selectedFilePath}
                  onChange={(e) => setSelectedFilePath(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-semibold font-mono ${
                    isDark
                      ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                      : "bg-[#FAF9FF] border-[#E8E5F4] text-[#1E2022]"
                  }`}
                >
                  <option value="">— Choose a source file —</option>
                  {availableFiles.map((fp) => (
                    <option key={fp} value={fp}>
                      {fp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-[var(--text-secondary)] block mb-1">
                    Start Line:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lineRangeStart}
                    onChange={(e) => setLineRangeStart(parseInt(e.target.value) || 1)}
                    className={`w-full p-2 rounded-xl border font-mono text-xs ${
                      isDark
                        ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                        : "bg-[#FAF9FF] border-[#E8E5F4]"
                    }`}
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--text-secondary)] block mb-1">
                    End Line:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lineRangeEnd}
                    onChange={(e) => setLineRangeEnd(parseInt(e.target.value) || 100)}
                    className={`w-full p-2 rounded-xl border font-mono text-xs ${
                      isDark
                        ? "bg-[#161B22] border-[#30363D] text-[#E6EDF3]"
                        : "bg-[#FAF9FF] border-[#E8E5F4]"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setShowRepoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--border-color)] hover:bg-[var(--bg-card)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFilePath}
                onClick={handleLoadFromRepo}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-40 shadow-sm"
              >
                Load Into Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
