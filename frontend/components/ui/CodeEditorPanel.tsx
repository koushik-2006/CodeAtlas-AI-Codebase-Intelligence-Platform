"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Copy, Check, FileCode } from "lucide-react";

interface CodeEditorPanelProps {
  title?: string;
  code: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (code: string) => void;
  height?: string;
}

export function CodeEditorPanel({
  title = "Source Code",
  code,
  language = "typescript",
  readOnly = false,
  onChange,
  height = "h-72",
}: CodeEditorPanelProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border-color)] overflow-hidden bg-[var(--bg-card)]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-page)]/50">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[var(--primary)]" />
          <span className="font-mono text-xs font-semibold">{title}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--border-color)] text-[var(--text-secondary)]">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className={`p-4 font-mono text-xs leading-6 overflow-auto ${height}`}>
        {readOnly ? (
          <pre className="whitespace-pre text-[var(--text-primary)]">
            {code}
          </pre>
        ) : (
          <textarea
            value={code}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full h-full resize-none bg-transparent outline-none font-mono text-xs leading-6 text-[var(--text-primary)]"
          />
        )}
      </div>
    </div>
  );
}
