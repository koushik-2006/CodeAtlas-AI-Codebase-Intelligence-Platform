"use client";

import { useTheme } from "@/hooks/useTheme";
import { FileCode, ExternalLink } from "lucide-react";
import { SourceCitation } from "@/types/source-code";

interface SourceReferenceProps {
  citation: SourceCitation;
  onClick?: (citation: SourceCitation) => void;
}

export function SourceReference({ citation, onClick }: SourceReferenceProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const filePath = citation.filePath || citation.file;
  const lineRange =
    citation.lineRange ||
    (citation.startLine && citation.endLine
      ? `${citation.startLine}-${citation.endLine}`
      : "");

  return (
    <button
      onClick={() => onClick && onClick(citation)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all text-left ${
        isDark
          ? "bg-[#111725] border-[#242B39] text-[#29D3C2] hover:border-[#29D3C2]/50 hover:bg-[#161F32]"
          : "bg-[#F3F1FF] border-[#E8E5F4] text-[#6C4DFF] hover:border-[#6C4DFF]/50 hover:bg-[#EAE5FF]"
      }`}
    >
      <FileCode className="w-3.5 h-3.5 shrink-0" />
      <span>{filePath}</span>
      {lineRange && (
        <span className="text-[10px] opacity-75">
          :{lineRange}
        </span>
      )}
      <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
    </button>
  );
}
