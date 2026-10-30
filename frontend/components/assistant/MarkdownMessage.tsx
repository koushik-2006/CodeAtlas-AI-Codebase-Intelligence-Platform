"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { Copy, Check, FileCode } from "lucide-react";

interface MarkdownMessageProps {
  content: string;
  repositoryId?: string;
}

export function MarkdownMessage({ content, repositoryId = "sample-project" }: MarkdownMessageProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Split content by code block delimiters ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 font-sans text-xs sm:text-[13px] leading-relaxed text-[var(--text-primary)]">
      {parts.map((part, index) => {
        if (!part) return null;

        // Code block
        if (part.startsWith("```") && part.endsWith("```")) {
          const firstLineEnd = part.indexOf("\n");
          let language = "code";
          let code = "";

          if (firstLineEnd !== -1) {
            language = part.slice(3, firstLineEnd).trim() || "code";
            code = part.slice(firstLineEnd + 1, -3);
          } else {
            code = part.slice(3, -3);
          }

          return (
            <CodeBlockView
              key={index}
              code={code.trim()}
              language={language}
              isDark={isDark}
            />
          );
        }

        // Regular markdown text
        return (
          <TextMarkdownBlock
            key={index}
            text={part}
            repositoryId={repositoryId}
            isDark={isDark}
          />
        );
      })}
    </div>
  );
}

function CodeBlockView({
  code,
  language,
  isDark,
}: {
  code: string;
  language: string;
  isDark: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`my-2.5 rounded-xl border overflow-hidden transition-all ${
        isDark
          ? "bg-[#070A12] border-[#242B39]"
          : "bg-[#19143D] text-white border-[#2b2361]"
      }`}
    >
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-white/10 bg-black/20 text-[10px] font-mono text-[var(--text-secondary)]">
        <span className="uppercase font-bold tracking-wider text-emerald-400">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code block"
          className="flex items-center gap-1 font-mono text-[10px] text-gray-300 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto">
        <pre className="font-mono text-xs sm:text-[12px] leading-relaxed text-gray-200">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function TextMarkdownBlock({
  text,
  repositoryId,
  isDark,
}: {
  text: string;
  repositoryId: string;
  isDark: boolean;
}) {
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-2">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Headings
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={pIdx} className="text-sm font-bold text-[var(--text-primary)] mt-3 mb-1">
              {formatInlineStyles(trimmed.slice(4), repositoryId, isDark)}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={pIdx} className="text-base font-bold text-[var(--text-primary)] mt-3.5 mb-1.5">
              {formatInlineStyles(trimmed.slice(3), repositoryId, isDark)}
            </h3>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={pIdx} className="text-lg font-bold text-[var(--text-primary)] mt-4 mb-2">
              {formatInlineStyles(trimmed.slice(2), repositoryId, isDark)}
            </h2>
          );
        }

        // Bullet list
        const lines = trimmed.split("\n");
        const isBulletList = lines.every((l) => l.trim().startsWith("- ") || l.trim().startsWith("* "));
        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-1 my-2 pl-4 list-disc text-[var(--text-primary)]">
              {lines.map((l, lIdx) => (
                <li key={lIdx}>
                  {formatInlineStyles(l.trim().slice(2), repositoryId, isDark)}
                </li>
              ))}
            </ul>
          );
        }

        // Numbered list
        const isNumberedList = lines.every((l) => /^\d+\.\s/.test(l.trim()));
        if (isNumberedList) {
          return (
            <ol key={pIdx} className="space-y-1 my-2 pl-4 list-decimal text-[var(--text-primary)] font-medium">
              {lines.map((l, lIdx) => (
                <li key={lIdx}>
                  {formatInlineStyles(l.trim().replace(/^\d+\.\s/, ""), repositoryId, isDark)}
                </li>
              ))}
            </ol>
          );
        }

        // Default Paragraph
        return (
          <p key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {formatInlineStyles(line, repositoryId, isDark)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parses bold, inline code, and clickable source file references in text strings.
 */
function formatInlineStyles(
  line: string,
  repositoryId: string,
  isDark: boolean
): React.ReactNode {
  // Regex tokenizing inline code `code`, bold **text**, and potential file references
  const tokens = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return tokens.map((token, idx) => {
    if (!token) return null;

    // Inline code `...`
    if (token.startsWith("`") && token.endsWith("`")) {
      const inner = token.slice(1, -1);
      // Check if inner is a recognizable file path
      if (inner.includes(".") && (inner.includes("/") || inner.endsWith(".ts") || inner.endsWith(".tsx") || inner.endsWith(".json") || inner.endsWith(".js"))) {
        const [filePath, lineNum] = inner.split(":");
        return (
          <Link
            key={idx}
            href={`/repositories/${repositoryId}?file=${encodeURIComponent(filePath)}${lineNum ? `&line=${lineNum}` : ""}`}
            className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
              isDark
                ? "bg-[#111725] border-[#29D3C2]/40 text-[#29D3C2] hover:underline"
                : "bg-[#EAE5FF] border-[#6C4DFF]/30 text-[#6C4DFF] hover:underline"
            }`}
            title={`Inspect ${inner} in Repository Explorer`}
          >
            <FileCode className="w-3 h-3 inline-block" />
            <span>{inner}</span>
          </Link>
        );
      }

      return (
        <code
          key={idx}
          className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${
            isDark
              ? "bg-[#111725] border-[#242B39] text-[#29D3C2]"
              : "bg-[#FAF9FF] border-[#E8E5F4] text-[#6C4DFF]"
          }`}
        >
          {inner}
        </code>
      );
    }

    // Bold **...**
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-[var(--text-primary)]">
          {token.slice(2, -2)}
        </strong>
      );
    }

    return token;
  });
}
