import React, { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { CodeLineNumbers } from "./CodeLineNumbers";
import { Copy, Check, FileCode, AlertCircle, FileText, Compass, Search, StickyNote } from "lucide-react";
import { SymbolNavigatorModal } from "@/components/intelligence/SymbolNavigatorModal";
import AddAnnotationModal from "@/components/workspace/AddAnnotationModal";
import { codeIntelligenceService } from "@/services/code-intelligence-service";
import { SymbolNavigationResult } from "@/types/symbol-navigation";

interface SourceCodeViewerProps {
  filePath: string;
  code: string;
  language?: string;
  highlightedLine?: number;
  highlightRange?: [number, number];
  onLineClick?: (line: number) => void;
  isLoading?: boolean;
  repoId?: string;
  onNavigateTarget?: (file: string, line: number) => void;
}

export function SourceCodeViewer({
  filePath,
  code,
  language = "typescript",
  highlightedLine,
  highlightRange,
  onLineClick,
  isLoading = false,
  repoId = "sample-project",
  onNavigateTarget,
}: SourceCodeViewerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [copied, setCopied] = useState(false);
  const [navModalOpen, setNavModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [navResult, setNavResult] = useState<SymbolNavigationResult | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleInspectSymbol = async (targetLine?: number) => {
    const lineToInspect = targetLine || highlightedLine || (highlightRange ? highlightRange[0] : 1);
    setIsNavigating(true);
    const res = await codeIntelligenceService.navigateSymbol(repoId, filePath, lineToInspect);
    setIsNavigating(false);
    if (res) {
      setNavResult(res);
      setNavModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-[var(--bg-surface)]">
        <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
          <div className="h-4 w-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span>Loading source file...</span>
        </div>
      </div>
    );
  }

  if (!code && !filePath) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-[var(--bg-surface)]">
        <FileCode className="w-12 h-12 text-[var(--text-secondary)]/40 mb-3" />
        <h3 className="text-base font-bold text-[var(--text-primary)]">No File Selected</h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Choose a file from the explorer tree to view its source code and call links.
        </p>
      </div>
    );
  }

  const lines = code ? code.split("\n") : [];

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLineHighlighted = (lineNum: number) => {
    if (highlightedLine === lineNum) return true;
    if (highlightRange && lineNum >= highlightRange[0] && lineNum <= highlightRange[1]) {
      return true;
    }
    return false;
  };

  // Lightweight theme-aware syntax styling for developer keywords, strings, types, and comments
  const formatSyntaxLine = (text: string) => {
    if (!text.trim()) return " ";

    // Comment check
    const trimmed = text.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*") || trimmed.startsWith("#")) {
      return <span className={isDark ? "text-[#8B949E] italic" : "text-[#71717A] italic"}>{text}</span>;
    }

    // Tokenize strings, words, and delimiters
    const tokens = text.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:export|import|from|function|return|const|let|var|async|await|interface|type|class|if|else|try|catch|new|throw|switch|case|default)\b|\b\d+\b)/g);

    return tokens.map((token, i) => {
      if (!token) return null;

      // String literal
      if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'")) || (token.startsWith("`") && token.endsWith("`"))) {
        return <span key={i} className={isDark ? "text-[#F3C969]" : "text-[#B38300]"}>{token}</span>;
      }

      // Keywords
      if (/^(?:export|import|from|function|return|const|let|var|async|await|interface|type|class|if|else|try|catch|new|throw|switch|case|default)$/.test(token)) {
        return <span key={i} className={isDark ? "text-[#29D3C2] font-semibold" : "text-[#6C4DFF] font-semibold"}>{token}</span>;
      }

      // Numbers
      if (/^\d+$/.test(token)) {
        return <span key={i} className={isDark ? "text-cyan-300" : "text-emerald-600"}>{token}</span>;
      }

      return token;
    });
  };

  const pathParts = filePath ? filePath.split("/") : [];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-surface)]">
      {/* File Header with Breadcrumbs */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-page)]/50 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <nav aria-label="File Breadcrumb" className="flex items-center gap-1 font-mono text-xs font-bold text-[var(--text-primary)] truncate">
            {pathParts.map((part, pIdx) => (
              <React.Fragment key={pIdx}>
                {pIdx > 0 && <span className="text-[var(--text-secondary)]/50">/</span>}
                <span className={pIdx === pathParts.length - 1 ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] font-medium"}>
                  {part}
                </span>
              </React.Fragment>
            ))}
          </nav>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--border-color)]/60 text-[var(--text-secondary)] shrink-0 font-semibold uppercase">
            {language}
          </span>
          <span className="text-xs text-[var(--text-secondary)] hidden sm:inline shrink-0">
            ({lines.length} lines)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleInspectSymbol()}
            disabled={isNavigating}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] shrink-0"
            title="Inspect symbol at active line (Definition, Callers, Callees, Tests)"
          >
            <Compass className={`w-3.5 h-3.5 ${isNavigating ? "animate-spin" : ""}`} />
            <span>{isNavigating ? "Resolving..." : "Inspect Symbol"}</span>
          </button>

          <button
            type="button"
            onClick={() => setNoteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 shrink-0"
            title="Attach a collaborative note to this line or symbol"
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy file source code"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border border-[var(--border-color)] hover:bg-[var(--border-color)]/20 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] shrink-0"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="flex-1 flex overflow-auto font-mono text-xs leading-6 select-text">
        <CodeLineNumbers
          totalLines={lines.length}
          highlightedLine={highlightedLine}
          onLineClick={onLineClick}
        />

        <div className="flex-1 py-3 px-4 min-w-[500px]">
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const highlighted = isLineHighlighted(lineNum);
            return (
              <div
                key={lineNum}
                id={`L${lineNum}`}
                onClick={() => onLineClick?.(lineNum)}
                className={`px-2 rounded transition-colors whitespace-pre cursor-pointer ${
                  highlighted
                    ? isDark
                      ? "bg-[#29D3C2]/20 text-[#29D3C2] font-semibold border-l-2 border-[#29D3C2]"
                      : "bg-[#6C4DFF]/15 text-[#4D2BD4] font-semibold border-l-2 border-[#6C4DFF]"
                    : "text-[var(--text-primary)] hover:bg-[var(--border-color)]/20"
                }`}
              >
                {formatSyntaxLine(line)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Symbol Navigator Popover Modal */}
      <SymbolNavigatorModal
        isOpen={navModalOpen}
        onClose={() => setNavModalOpen(false)}
        result={navResult}
        onNavigate={(targetFile, targetLine) => {
          onNavigateTarget?.(targetFile, targetLine);
          onLineClick?.(targetLine);
        }}
      />

      {/* Phase 14: Add Collaborative Team Note Modal */}
      <AddAnnotationModal
        isOpen={noteModalOpen}
        repoId={repoId}
        filePath={filePath}
        line={highlightedLine || (highlightRange ? highlightRange[0] : 1)}
        onClose={() => setNoteModalOpen(false)}
        onSuccess={() => {
          setNoteModalOpen(false);
        }}
      />
    </div>
  );
}
