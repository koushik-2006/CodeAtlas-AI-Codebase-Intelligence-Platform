"use client";

import React, { useState } from "react";
import {
  Compass,
  Route,
  Repeat,
  ShieldAlert,
  BarChart2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Plus,
  Trash2,
  Wrench,
  ExternalLink,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  ArchitectureNode,
  ArchitectureEdge,
  LayerRule,
  LayerViolation,
  CycleFinding,
  ArchitectureMetricsSummary,
} from "@/types/architecture";
import {
  findShortestPath,
  generateArchitectureAiOverview,
} from "@/lib/demo/architecture-engine";
import { saveArchitectureLayerRules } from "@/lib/demo/store";
import { Button } from "@/components/ui/Button";

interface ArchitectureAnalysisPanelProps {
  repositoryId: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  cycles: CycleFinding[];
  violations: LayerViolation[];
  rules: LayerRule[];
  metrics: ArchitectureMetricsSummary;
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  onHighlightPath: (nodeIds: string[]) => void;
  onFilterNeighborhood: (nodeId: string, depth: number) => void;
  onHighlightCycle: (nodeIds: string[]) => void;
  onHighlightViolation: (edgeId: string) => void;
  onUpdateRules: (newRules: LayerRule[]) => void;
  onProposeFixCycle: (cycle: CycleFinding) => void;
}

export function ArchitectureAnalysisPanel({
  repositoryId,
  nodes,
  edges,
  cycles,
  violations,
  rules,
  metrics,
  selectedNodeId,
  onSelectNode,
  onHighlightPath,
  onFilterNeighborhood,
  onHighlightCycle,
  onHighlightViolation,
  onUpdateRules,
  onProposeFixCycle,
}: ArchitectureAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "neighborhood" | "path" | "cycles" | "rules" | "metrics" | "ai"
  >("neighborhood");

  // Neighborhood state
  const [neighborhoodCenter, setNeighborhoodCenter] = useState<string>(selectedNodeId || nodes[0]?.id || "");
  const [neighborhoodDepth, setNeighborhoodDepth] = useState<number>(2);

  // Path finder state
  const [pathSource, setPathSource] = useState<string>(nodes[0]?.id || "");
  const [pathTarget, setPathTarget] = useState<string>(nodes[Math.min(nodes.length - 1, 3)]?.id || "");
  const [pathResult, setPathResult] = useState<ReturnType<typeof findShortestPath> | null>(null);

  // AI Overview state
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiMermaid, setAiMermaid] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedMermaid, setCopiedMermaid] = useState<boolean>(false);

  // Rules state
  const [editingRules, setEditingRules] = useState<LayerRule[]>(rules);

  const handleApplyNeighborhood = () => {
    onFilterNeighborhood(neighborhoodCenter, neighborhoodDepth);
  };

  const handleTracePath = () => {
    if (!pathSource || !pathTarget) return;
    const res = findShortestPath(nodes, edges, pathSource, pathTarget);
    setPathResult(res);
    if (res.found) {
      onHighlightPath(res.pathNodeIds);
    }
  };

  const handleGenerateAiOverview = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const graphData = {
        repositoryId,
        nodes,
        edges,
        cycles,
        violations,
        metrics,
      };
      const res = await generateArchitectureAiOverview(graphData, repositoryId);
      setAiSummary(res.summary);
      setAiMermaid(res.mermaid);
    } catch (err: any) {
      setAiError(err.message || "Failed to generate AI architecture overview. Please retry.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleRule = (ruleId: string) => {
    const next = editingRules.map((r) => (r.id === ruleId ? { ...r, allowed: !r.allowed } : r));
    setEditingRules(next);
    onUpdateRules(next);
  };

  const handleCopyMermaid = () => {
    if (navigator?.clipboard && aiMermaid) {
      navigator.clipboard.writeText(aiMermaid);
      setCopiedMermaid(true);
      setTimeout(() => setCopiedMermaid(false), 2000);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-2 border-b border-[var(--border-color)] bg-[var(--bg-card-hover)] overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("neighborhood")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "neighborhood"
              ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Neighborhood</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("path")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "path"
              ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Route className="w-3.5 h-3.5" />
          <span>Path Finder</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cycles")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "cycles"
              ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Cycles ({cycles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "rules"
              ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Layer Rules ({violations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("metrics")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "metrics"
              ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Metrics</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("ai");
            if (!aiSummary) handleGenerateAiOverview();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "ai"
              ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Overview</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {/* ================================================================= */}
        {/* TAB 1: NEIGHBORHOOD */}
        {/* ================================================================= */}
        {activeTab === "neighborhood" && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                Component Neighborhood Subgraph
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Isolate direct callers and downstream dependents within 1–3 hops.
              </p>
            </div>

            <div className="space-y-3 p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
              <div>
                <label className="block text-[11px] font-mono font-semibold text-[var(--text-secondary)] mb-1">
                  Focus Center Node
                </label>
                <select
                  value={neighborhoodCenter}
                  onChange={(e) => setNeighborhoodCenter(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] mb-1">
                  <span>Hop Depth:</span>
                  <span className="font-bold text-[#7C5CFC]">{neighborhoodDepth} hop(s)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={neighborhoodDepth}
                  onChange={(e) => setNeighborhoodDepth(parseInt(e.target.value, 10))}
                  className="w-full accent-[#7C5CFC]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFilterNeighborhood("", 1)}
                  className="text-xs"
                >
                  Clear Filter
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApplyNeighborhood}
                  className="bg-[#7C5CFC] text-white hover:bg-[#6A4BE2] text-xs"
                >
                  Isolate Neighborhood
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: PATH FINDER */}
        {/* ================================================================= */}
        {activeTab === "path" && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                Dependency Path & Call Chain Finder
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Computes shortest directed invocation chain between two components.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
              <div>
                <label className="block text-[11px] font-mono font-semibold text-[var(--text-secondary)] mb-1">
                  From (Source)
                </label>
                <select
                  value={pathSource}
                  onChange={(e) => setPathSource(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-[var(--text-secondary)] mb-1">
                  To (Target)
                </label>
                <select
                  value={pathTarget}
                  onChange={(e) => setPathTarget(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleTracePath}
                  className="bg-[#7C5CFC] text-white hover:bg-[#6A4BE2] text-xs gap-1.5"
                >
                  <Route className="w-3.5 h-3.5" />
                  Trace Shortest Path
                </Button>
              </div>
            </div>

            {pathResult && (
              <div className="space-y-2 pt-2">
                {pathResult.found ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Verified Path Found ({pathResult.steps.length} hops):</span>
                    </div>

                    <div className="space-y-2 font-mono text-[11px]">
                      {pathResult.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#7C5CFC]/20 text-[#7C5CFC] font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-[var(--text-primary)]">{step.fromName}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                            <span className="font-bold text-[#7C5CFC]">{step.toName}</span>
                          </div>
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            {step.file}:{step.line}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-400 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      No Path Discovered
                    </div>
                    <p className="text-[var(--text-secondary)]">
                      {pathResult.message || "These components are in disconnected dependency trees."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: CIRCULAR DEPENDENCIES (TARJAN SCC) */}
        {/* ================================================================= */}
        {activeTab === "cycles" && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                Circular Dependencies ({cycles.length})
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Tarjan Strongly Connected Components (SCC) detecting recursive dependency loops.
              </p>
            </div>

            {cycles.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <div className="font-bold">Zero Circular Dependencies</div>
                <p className="text-[var(--text-secondary)] text-[11px]">
                  All components in this scope form a strict Directed Acyclic Graph (DAG).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    onClick={() => onHighlightCycle(cycle.nodes)}
                    className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs space-y-2.5 cursor-pointer hover:border-red-500 transition-colors"
                  >
                    <div className="flex items-center justify-between font-bold text-red-400">
                      <span className="flex items-center gap-1.5">
                        <Repeat className="w-4 h-4" />
                        Cycle Loop ({cycle.length} nodes)
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProposeFixCycle(cycle);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#7C5CFC] hover:bg-[#6A4BE2] text-white font-bold text-[11px] flex items-center gap-1"
                      >
                        <Wrench className="w-3 h-3" />
                        Propose Fix
                      </button>
                    </div>

                    <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-red-500/20 font-mono text-[11px] text-[var(--text-primary)]">
                      {cycle.nodeLabels.join(" ⇄ ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: LAYER RULES & VIOLATIONS */}
        {/* ================================================================= */}
        {activeTab === "rules" && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                Architectural Boundary Rules & Violations
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Enforce strict layer boundaries. Disallowed cross-layer imports appear highlighted in red.
              </p>
            </div>

            {/* Violations List */}
            {violations.length > 0 && (
              <div className="space-y-2">
                <div className="font-bold text-red-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Detected Violations ({violations.length}):</span>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  {violations.map((v, idx) => (
                    <div
                      key={idx}
                      onClick={() => onHighlightViolation(v.edgeId)}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1.5 cursor-pointer hover:border-red-500 transition-colors"
                    >
                      <div className="flex items-center justify-between text-red-400 font-bold">
                        <span>{v.sourceLayer} → {v.targetLayer} Disallowed</span>
                        <span>Line {v.line}</span>
                      </div>
                      <div className="text-[var(--text-primary)]">
                        {v.sourceFile} directly imports {v.targetFile}
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] font-sans">
                        {v.ruleDescription}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editable Rules Table */}
            <div className="space-y-2 pt-2">
              <div className="font-bold text-[var(--text-primary)]">Boundary Enforcement Rules:</div>
              <div className="space-y-1.5">
                {editingRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-[var(--text-primary)]">
                        {rule.sourceLayer} → {rule.targetLayer}
                      </span>
                      <p className="text-[10px] text-[var(--text-secondary)] max-w-xs truncate">
                        {rule.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleRule(rule.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        rule.allowed
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/15 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {rule.allowed ? "Allowed" : "Disallowed"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: ARCHITECTURAL METRICS */}
        {/* ================================================================= */}
        {activeTab === "metrics" && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                Graph Centrality & Coupling Metrics
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Quantitative analysis of afferent/efferent coupling and Martin instability ($I$).
              </p>
            </div>

            {/* Most Depended-On Files */}
            <div className="space-y-2">
              <div className="font-bold text-[var(--text-primary)]">
                Most Depended-On Components (Highest In-Degree / Fan-In):
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                {metrics.mostDepended.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectNode(item.id)}
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-color)] cursor-pointer hover:border-[#7C5CFC]"
                  >
                    <span className="font-bold text-[var(--text-primary)] truncate">{item.label}</span>
                    <span className="text-[#7C5CFC] font-bold shrink-0">{item.fanIn} callers</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Module Instability Table */}
            <div className="space-y-2 pt-2">
              <div className="font-bold text-[var(--text-primary)]">
                Martin Module Instability Metric ($I = C_e / (C_a + C_e)$):
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {metrics.moduleInstability.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[var(--text-primary)]">{m.module}</span>
                      <span className="text-[#7C5CFC]">I = {m.instability.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                      <span>Afferent ($C_a$): {m.afferent} · Efferent ($C_e$): {m.efferent}</span>
                      <span className="font-semibold text-emerald-400">{m.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: AI ARCHITECTURE OVERVIEW */}
        {/* ================================================================= */}
        {activeTab === "ai" && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-[var(--text-primary)]">
                  Gemini Architecture Overview
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  AI-synthesized architectural blueprint and C4 flowchart.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAiOverview}
                disabled={isAiLoading}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className={`w-3 h-3 ${isAiLoading ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
            </div>

            {aiError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleGenerateAiOverview}>
                  Retry
                </Button>
              </div>
            )}

            {isAiLoading ? (
              <div className="p-12 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-[#7C5CFC] animate-spin mx-auto" />
                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  Synthesizing architectural analysis and Mermaid flowcharts...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Prose */}
                <div className="p-4 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed space-y-2">
                  {aiSummary ? (
                    <div className="whitespace-pre-wrap">{aiSummary}</div>
                  ) : (
                    <p className="italic text-[var(--text-secondary)]">Click Regenerate to analyze architecture.</p>
                  )}
                </div>

                {/* Mermaid Diagram Box */}
                {aiMermaid && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                      <span>C4 Flowchart Representation (Mermaid):</span>
                      <button
                        type="button"
                        onClick={handleCopyMermaid}
                        className="text-xs text-[#7C5CFC] hover:underline flex items-center gap-1 font-semibold"
                      >
                        {copiedMermaid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedMermaid ? "Copied" : "Copy Mermaid"}</span>
                      </button>
                    </div>

                    <pre className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] font-mono text-[11px] leading-relaxed overflow-x-auto text-[var(--text-primary)] border-l-4 border-l-[#7C5CFC]">
                      {aiMermaid}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
