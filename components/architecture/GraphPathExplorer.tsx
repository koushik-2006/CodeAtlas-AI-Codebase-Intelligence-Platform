"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { ArchitectureNode } from "@/types/architecture";
import { PathResult, PathStep, architectureService } from "@/services/architecture-service";
import {
  Route,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface GraphPathExplorerProps {
  repositoryId: string;
  nodes: ArchitectureNode[];
  onSelectNode: (nodeId: string) => void;
  onHighlightPath?: (nodeIds: string[]) => void;
}

export function GraphPathExplorer({
  repositoryId,
  nodes,
  onSelectNode,
  onHighlightPath,
}: GraphPathExplorerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [sourceId, setSourceId] = useState<string>(nodes[0]?.id || "");
  const [targetId, setTargetId] = useState<string>(nodes[Math.min(nodes.length - 1, 4)]?.id || "");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [pathResult, setPathResult] = useState<PathResult | null>(null);

  const handleTracePath = async () => {
    if (!sourceId || !targetId) return;
    setIsSearching(true);

    try {
      const res = await architectureService.findPath(repositoryId, sourceId, targetId);
      setPathResult(res);
      if (res.found && onHighlightPath) {
        onHighlightPath(res.steps.map((s) => s.nodeId));
      }
    } finally {
      setIsSearching(false);
    }
  };

  const sourceNode = nodes.find((n) => n.id === sourceId);
  const targetNode = nodes.find((n) => n.id === targetId);

  const aiQuestion = pathResult?.found
    ? `Explain this verified architecture path in ${repositoryId}: ${pathResult.steps
        .map((s) => `${s.nodeName} (${s.file})`)
        .join(" -> ")}`
    : `Why is there no direct path between ${sourceNode?.name || sourceId} and ${targetNode?.name || targetId}?`;

  return (
    <div
      className={`app-card p-4 rounded-2xl border transition-all ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
      }`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
            Graph Path Explorer
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-secondary)]">
          Shortest Verified Call Chain
        </span>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
        <div>
          <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">
            Source Component
          </label>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className={`w-full p-2 rounded-xl text-xs font-medium border outline-none cursor-pointer ${
              isDark
                ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
            }`}
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label} ({n.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase mb-1">
            Destination Target
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className={`w-full p-2 rounded-xl text-xs font-medium border outline-none cursor-pointer ${
              isDark
                ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
            }`}
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label} ({n.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={handleTracePath}
        disabled={isSearching || !sourceId || !targetId}
        className={`w-full py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
          isDark
            ? "bg-[#29D3C2] text-[#070A12] hover:bg-[#22b8a8]"
            : "bg-[#6C4DFF] text-white hover:bg-[#5b3ee0]"
        } disabled:opacity-50`}
      >
        {isSearching ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Finding Path...</span>
          </>
        ) : (
          <>
            <Search className="w-3.5 h-3.5" />
            <span>Trace Verified Path</span>
          </>
        )}
      </button>

      {/* Path Results */}
      {pathResult && (
        <div className="mt-4 pt-3 border-t border-[var(--border-color)] space-y-3">
          {pathResult.found ? (
            <>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified Path Found ({pathResult.length} hops)
                </span>
                <Link
                  href={`/assistant?repo=${repositoryId}&q=${encodeURIComponent(aiQuestion)}`}
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--primary)] hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  Ask AI to Explain Path
                </Link>
              </div>

              {/* Step list */}
              <div className="space-y-2">
                {pathResult.steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div
                      onClick={() => onSelectNode(step.nodeId)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs cursor-pointer transition-all ${
                        isDark
                          ? "bg-[#0A0F19] border-[#242B39] hover:border-[#29D3C2]"
                          : "bg-[var(--bg-page)] border-[#E8E5F4] hover:border-[#6C4DFF]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-[var(--text-primary)] block truncate">
                            {step.nodeName}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--text-secondary)] truncate block">
                            {step.file} {step.line ? `:${step.line}` : ""}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--border-color)]/60 text-[var(--text-secondary)] shrink-0 font-bold uppercase">
                        {step.nodeType}
                      </span>
                    </div>

                    {step.relationshipToNext && (
                      <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-[var(--text-secondary)] py-0.5">
                        <ArrowRight className="w-3 h-3 text-[var(--primary)]" />
                        <span>{step.relationshipToNext}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>No Path Discovered</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {pathResult.message}
              </p>
              <Link
                href={`/assistant?repo=${repositoryId}&q=${encodeURIComponent(aiQuestion)}`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline pt-1"
              >
                <Sparkles className="w-3 h-3" />
                Ask AI Assistant about relationship
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
