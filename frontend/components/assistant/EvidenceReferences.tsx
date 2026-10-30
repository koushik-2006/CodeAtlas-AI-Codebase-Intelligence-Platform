"use client";

import { useTheme } from "@/hooks/useTheme";
import { ExternalLink } from "lucide-react";

interface EvidenceReferencesProps {
  citations: string[];
  onSelectCitation?: (citation: string) => void;
}

export function EvidenceReferences({
  citations,
  onSelectCitation,
}: EvidenceReferencesProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-2.5 pt-2 border-t border-[var(--border-color)]/60">
      <span className="text-[10px] font-bold text-[var(--text-secondary)] block mb-1">
        CITATIONS BESIDE ANSWER:
      </span>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((cite) => (
          <button
            key={cite}
            onClick={() => onSelectCitation && onSelectCitation(cite)}
            className={`inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded transition-transform hover:scale-105 ${
              isDark
                ? "bg-[#29D3C2]/15 text-[#29D3C2] hover:bg-[#29D3C2]/25"
                : "bg-[#6C4DFF]/10 text-[#6C4DFF] hover:bg-[#6C4DFF]/20"
            }`}
          >
            <ExternalLink className="w-2.5 h-2.5" />
            {cite}
          </button>
        ))}
      </div>
    </div>
  );
}
