"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { ArchitectureNode, ArchitectureLayerName } from "@/types/architecture";
import { getStore } from "@/lib/demo/store";
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
  Tag,
  CheckCircle2,
} from "lucide-react";

interface SelectedNodePanelProps {
  currentNode: ArchitectureNode;
  repositoryId?: string;
  viewStyle?: "graph" | "city";
  onSelectNode?: (nodeId: string) => void;
  onReassignLayer?: (itemPath: string, layer: string) => void;
}

export function SelectedNodePanel({
  currentNode,
  repositoryId = "sample-project",
  viewStyle = "graph",
  onSelectNode,
  onReassignLayer,
}: SelectedNodePanelProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [copied, setCopied] = useState<boolean>(false);
  const [selectedLayer, setSelectedLayer] = useState<string>(currentNode.layer || "Services");
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);

  const targetLine = currentNode.line || 1;
  const symbolForImpact = currentNode.symbolName || currentNode.name || currentNode.label;

  // Retrieve related findings from Refactoring & Debt
  const store = getStore();
  const repoDebt = store.debtOverviews?.[repositoryId] || store.debtOverviews?.["sample-project"];
  const relatedFindings = (repoDebt?.findings || []).filter(
    (f: any) => f.filePath === currentNode.file || f.filePath === currentNode.filePath
  );

  const handleCopyPath = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(`${currentNode.file}:${targetLine}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLayerChange = (newLayer: string) => {
    setSelectedLayer(newLayer);
    onReassignLayer?.(currentNode.file || currentNode.id, newLayer);
  };

  const handleExplainNode = () => {
    setIsExplaining(true);
    setTimeout(() => {
      setAiExplanation(
        `Component **${currentNode.label}** acts as a pivotal **${currentNode.layer} layer** entity in \`${currentNode.file}\`. It maintains ${currentNode.fanIn || 0} direct inbound dependencies and dispatches to ${currentNode.fanOut || 0} downstream callees. ${
          currentNode.isCycleMember ? "⚠️ It participates in a circular dependency loop that should be decoupled." : "✓ Its architectural boundary complies with project standards."
        }`
      );
      setIsExplaining(false);
    }, 600);
  };

  const aiQuestion = `Explain the architectural role of ${currentNode.label} (${currentNode.type}) in ${currentNode.file}. What are its primary callers and dependencies?`;

  return (
    <aside className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between h-full shadow-sm space-y-4 overflow-hidden">
      <div className="space-y-4 overflow-y-auto pr-1">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#7C5CFC] font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>NODE INSPECTOR</span>
          </span>
          <span className="font-mono text-[10px] text-[var(--text-secondary)] bg-[var(--bg-card-hover)] border border-[var(--border-color)] px-2 py-0.5 rounded-lg font-bold uppercase">
            {currentNode.type}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-lg font-black tracking-tight text-[var(--text-primary)]">
            {currentNode.label}
          </h2>
          {currentNode.symbolName && (
            <p className="font-mono text-xs text-[#7C5CFC] font-semibold mt-0.5">
              Symbol: {currentNode.symbolName}
            </p>
          )}
          <p className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
            {currentNode.description}
          </p>
        </div>

        {/* Centrality & Layer Reassignment Bar */}
        <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase font-bold">
              Layer Assignment
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-400">
              {currentNode.centralityRank || "Standard Hub"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-[#7C5CFC] shrink-0" />
            <select
              value={selectedLayer}
              onChange={(e) => handleLayerChange(e.target.value)}
              className="w-full text-xs p-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold"
            >
              {(["UI", "API", "Services", "Data", "Utils", "Tests", "External"] as ArchitectureLayerName[]).map(
                (l) => (
                  <option key={l} value={l}>
                    {l} Layer
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* File Path & Line Range + Copy */}
        <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--text-secondary)] uppercase font-bold">
              Source Location
            </span>
            <button
              type="button"
              onClick={handleCopyPath}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-[#7C5CFC] hover:underline"
              title="Copy file path and line"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy Path"}</span>
            </button>
          </div>
          <div className="flex items-center justify-between font-mono">
            <span className="font-bold text-[var(--text-primary)] truncate max-w-[200px]" title={currentNode.file}>
              {currentNode.file}
            </span>
            <span className="text-[#7C5CFC] font-bold shrink-0">
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
            <pre className="p-3 rounded-xl overflow-x-auto font-mono text-xs leading-5 border border-[var(--border-color)] bg-[var(--bg-card-hover)] max-h-36 text-[var(--text-primary)]">
              {currentNode.code}
            </pre>
          </div>
        )}

        {/* Direct Callers (Inbound / Fan-In) */}
        {currentNode.incomingRelationships && currentNode.incomingRelationships.length > 0 && (
          <div>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block mb-1.5">
              Direct Callers & Inbound ({currentNode.incomingRelationships.length})
            </span>
            <div className="space-y-1">
              {currentNode.incomingRelationships.map((rel, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectNode && onSelectNode(rel.nodeId)}
                  className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-hover)] hover:border-[#7C5CFC] text-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ArrowLeft className="w-3 h-3 text-[#7C5CFC] shrink-0" />
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

        {/* Direct Callees (Outbound / Fan-Out) */}
        {currentNode.outgoingRelationships && currentNode.outgoingRelationships.length > 0 && (
          <div>
            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block mb-1.5">
              Dependencies & Outbound ({currentNode.outgoingRelationships.length})
            </span>
            <div className="space-y-1">
              {currentNode.outgoingRelationships.map((rel, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectNode && onSelectNode(rel.nodeId)}
                  className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card-hover)] hover:border-[#7C5CFC] text-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ArrowRight className="w-3 h-3 text-[#7C5CFC] shrink-0" />
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

        {/* Related Findings from Refactoring & Debt */}
        {relatedFindings.length > 0 && (
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs space-y-1.5">
            <span className="text-[10px] font-mono text-orange-400 uppercase font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Quality Debt Findings ({relatedFindings.length})
            </span>
            <ul className="space-y-1 font-mono text-[11px] text-[var(--text-secondary)]">
              {relatedFindings.slice(0, 3).map((f: any) => (
                <li key={f.id} className="truncate">
                  • {f.title}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Explanation Box */}
        {aiExplanation && (
          <div className="p-3 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/30 text-xs text-[var(--text-primary)] space-y-1 animate-in fade-in">
            <span className="text-[10px] font-mono text-[#7C5CFC] uppercase font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Component Analysis
            </span>
            <p className="text-xs leading-relaxed">{aiExplanation}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-[var(--border-color)] space-y-2 shrink-0">
        <button
          type="button"
          onClick={handleExplainNode}
          disabled={isExplaining}
          className="w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-[#7C5CFC] hover:bg-[#6A4BE2] text-white transition-colors"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isExplaining ? "animate-spin" : ""}`} />
          <span>{isExplaining ? "Analyzing Component..." : "Explain with AI"}</span>
        </button>

        <div className="grid grid-cols-3 gap-2">
          <Link
            href={`/repositories/${repositoryId}?file=${encodeURIComponent(currentNode.file)}&line=${targetLine}`}
            className="py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 border border-[var(--border-color)] bg-[var(--bg-card-hover)] text-[var(--text-primary)] hover:border-[#7C5CFC] hover:text-[#7C5CFC] transition-colors truncate"
            title="Open in Repository Explorer"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">Open File</span>
          </Link>

          <Link
            href={`/change-impact?repo=${repositoryId}&symbol=${encodeURIComponent(symbolForImpact)}&file=${encodeURIComponent(currentNode.file)}`}
            className="py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 border border-[var(--border-color)] bg-[var(--bg-card-hover)] text-[var(--text-primary)] hover:border-amber-400 hover:text-amber-400 transition-colors truncate"
            title="Analyze Change Impact"
          >
            <Activity className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">Impact</span>
          </Link>

          <Link
            href={`/assistant?repo=${repositoryId}&q=${encodeURIComponent(aiQuestion)}`}
            className="py-1.5 px-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 border border-[var(--border-color)] bg-[var(--bg-card-hover)] text-[var(--text-primary)] hover:border-[#7C5CFC] hover:text-[#7C5CFC] transition-colors truncate"
            title="Ask Assistant"
          >
            <Sparkles className="w-3 h-3 text-[#7C5CFC] shrink-0" />
            <span className="truncate">Ask AI</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
