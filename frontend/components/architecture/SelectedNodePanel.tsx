"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { ArchitectureNode } from "@/types/architecture";
import {
  ExternalLink,
  Activity,
  FileCode,
  ShieldCheck,
  Layers,
  ArrowRight,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Sparkles,
  Database,
  Server,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface SelectedNodePanelProps {
  currentNode: ArchitectureNode;
  repositoryId?: string;
  viewStyle: "graph" | "city";
  onSelectNode?: (nodeId: string) => void;
}

export function SelectedNodePanel({
  currentNode,
  repositoryId = "sample-project",
  viewStyle,
  onSelectNode,
}: SelectedNodePanelProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [copied, setCopied] = useState<boolean>(false);

  const targetLine = currentNode.line || 1;
  const symbolForImpact = currentNode.symbolName || currentNode.name || currentNode.label;

  const handleCopyPath = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(`${currentNode.file}:${targetLine}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const aiQuestion = `Explain the role of ${currentNode.label} (${currentNode.type}) in ${currentNode.file}. What are its primary callers and dependencies?`;

  return (
    <aside
      className={`app-card p-5 flex flex-col justify-between h-full shadow-sm rounded-2xl border transition-all ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
      }`}
    >
      <div className="space-y-4 overflow-y-auto pr-1">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--primary)] font-bold">
            {viewStyle === "city" ? "SELECTED BUILDING" : "NODE INSPECTOR"}
          </span>
          <span className="font-mono text-[10px] text-[var(--text-secondary)] bg-[var(--border-color)]/50 px-2 py-0.5 rounded font-bold uppercase">
            {currentNode.type}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
            {currentNode.label}
          </h2>
          {currentNode.symbolName && (
            <p className="font-mono text-xs text-[var(--primary)] mt-0.5">
              Symbol: {currentNode.symbolName}
            </p>
          )}
          <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
            {currentNode.description}
          </p>
        </div>

        {/* File Path & Line Range + Copy */}
        <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase font-bold">
              Source Location
            </span>
            <button
              type="button"
              onClick={handleCopyPath}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--primary)] hover:underline"
              title="Copy file path and line"
            >
              {copied ? <Check className="w-3 h-3 text-teal-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy Path"}</span>
            </button>
          </div>
          <div className="flex items-center justify-between font-mono">
            <span className="font-bold text-[var(--text-primary)] truncate max-w-[190px]">
              {currentNode.file}
            </span>
            <span className="text-[var(--primary)] font-bold shrink-0">
              {currentNode.lines ? `Lines ${currentNode.lines}` : `Line ${targetLine}`}
            </span>
          </div>
        </div>

        {/* Code Snippet Preview */}
        {currentNode.code && (
          <div>
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase block mb-1 font-bold">
              AST Implementation Excerpt
            </span>
            <pre
              className={`p-3 rounded-xl overflow-x-auto font-mono text-xs leading-5 border max-h-40 ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA]"
                  : "bg-[#FAF9FF] border-[#E8E5F4] text-[#19143D]"
              }`}
            >
              {currentNode.code}
            </pre>
          </div>
        )}

        {/* Direct Callers (Upstream) */}
        {currentNode.incomingRelationships && currentNode.incomingRelationships.length > 0 && (
          <div>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block mb-1.5">
              Direct Callers & Inbound ({currentNode.incomingRelationships.length})
            </span>
            <div className="space-y-1.5">
              {currentNode.incomingRelationships.map((rel, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectNode && onSelectNode(rel.nodeId)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                    isDark
                      ? "bg-[#0A0F19] border-[#242B39] hover:border-[#29D3C2]"
                      : "bg-[var(--bg-page)] border-[#E8E5F4] hover:border-[#6C4DFF]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ArrowLeft className="w-3 h-3 text-[var(--primary)] shrink-0" />
                    <span className="font-bold truncate text-[var(--text-primary)]">
                      {rel.nodeName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] shrink-0">
                    {rel.relationship}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Direct Callees (Downstream) */}
        {currentNode.outgoingRelationships && currentNode.outgoingRelationships.length > 0 && (
          <div>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block mb-1.5">
              Dependencies & Outbound ({currentNode.outgoingRelationships.length})
            </span>
            <div className="space-y-1.5">
              {currentNode.outgoingRelationships.map((rel, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectNode && onSelectNode(rel.nodeId)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                    isDark
                      ? "bg-[#0A0F19] border-[#242B39] hover:border-[#29D3C2]"
                      : "bg-[var(--bg-page)] border-[#E8E5F4] hover:border-[#6C4DFF]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ArrowRight className="w-3 h-3 text-[var(--primary)] shrink-0" />
                    <span className="font-bold truncate text-[var(--text-primary)]">
                      {rel.nodeName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] shrink-0">
                    {rel.relationship}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Tests */}
        {currentNode.tests && currentNode.tests.length > 0 && (
          <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 text-xs">
            <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 uppercase font-bold flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Test Coverage
            </span>
            <ul className="space-y-1 font-mono text-[11px] text-[var(--text-secondary)]">
              {currentNode.tests.map((t, idx) => (
                <li key={idx} className="truncate">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-[var(--border-color)] space-y-2">
        <Link
          href={`/assistant?repo=${repositoryId}&q=${encodeURIComponent(aiQuestion)}`}
          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            isDark
              ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
              : "bg-[#6C4DFF] text-white hover:bg-[#5b3ee0]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI Assistant About Node</span>
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/repositories/${repositoryId}?file=${encodeURIComponent(currentNode.file)}&line=${targetLine}`}
            className="py-2 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all truncate"
            title="Open file in Repository Explorer"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">Source</span>
          </Link>

          <Link
            href={`/change-impact?repo=${repositoryId}&symbol=${encodeURIComponent(symbolForImpact)}&file=${encodeURIComponent(currentNode.file)}`}
            className="py-2 px-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-amber-500 hover:text-amber-500 transition-all truncate"
            title="Analyze potential change impact"
          >
            <Activity className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">Impact</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
