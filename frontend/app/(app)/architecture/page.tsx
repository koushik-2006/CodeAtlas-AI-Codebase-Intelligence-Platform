"use client";

import React, { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/hooks/useTheme";
import { useRepositories } from "@/hooks/useRepositories";
import { ReactFlowProvider } from "@xyflow/react";
import { ArchitectureCanvas } from "@/components/architecture/ArchitectureCanvas";
import { SelectedNodePanel } from "@/components/architecture/SelectedNodePanel";
import { ArchitectureToolbar } from "@/components/architecture/ArchitectureToolbar";
import { ArchitectureLegend } from "@/components/architecture/ArchitectureLegend";
import { ArchitectureAnalysisPanel } from "@/components/architecture/ArchitectureAnalysisPanel";
import { ArchitectureTableAlternative } from "@/components/architecture/ArchitectureTableAlternative";
import {
  buildArchitectureGraph,
  DEFAULT_LAYER_RULES,
  generateMermaidDiagram,
} from "@/lib/demo/architecture-engine";
import {
  ArchitectureNode,
  ArchitectureEdge,
  ArchitectureLevel,
  ArchitectureLayout,
  LayerRule,
  CycleFinding,
} from "@/types/architecture";
import {
  getStore,
  saveArchitecturePositions,
  saveArchitectureLayerOverride,
  saveArchitectureLayerRules,
  logActivity,
} from "@/lib/demo/store";
import {
  Network,
  Table2,
  Activity,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FolderPlus,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

function ArchitectureContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { repositories } = useRepositories();

  // Read URL query parameters
  const initialRepo = searchParams?.get("repo") || "sample-project";
  const initialNode = searchParams?.get("node") || "";
  const initialLevel = (searchParams?.get("level") as ArchitectureLevel) || "layers";
  const initialLayout = (searchParams?.get("layout") as ArchitectureLayout) || "hierarchical";

  // Core state
  const [selectedRepo, setSelectedRepo] = useState<string>(initialRepo);
  const [level, setLevel] = useState<ArchitectureLevel>(initialLevel);
  const [layout, setLayout] = useState<ArchitectureLayout>(initialLayout);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string>(initialNode);
  const [sizeMode, setSizeMode] = useState<"loc" | "fanIn">("loc");
  const [viewMode, setViewMode] = useState<"canvas" | "table">("canvas");
  const [sidePanelTab, setSidePanelTab] = useState<"inspector" | "analysis">("inspector");

  // Filters state
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [layerFilter, setLayerFilter] = useState<string>("all");
  const [onlyCycles, setOnlyCycles] = useState<boolean>(false);
  const [onlyViolations, setOnlyViolations] = useState<boolean>(false);
  const [hideTests, setHideTests] = useState<boolean>(false);
  const [hideExternal, setHideExternal] = useState<boolean>(false);

  // Drill-down breadcrumbs
  const [breadcrumbPath, setBreadcrumbPath] = useState<
    Array<{ label: string; filterModule?: string; filterFile?: string; level: ArchitectureLevel }>
  >([{ label: "Layers View", level: "layers" }]);

  // Active highlights
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<string[]>([]);

  // Neighborhood filter
  const [neighborhoodNodeId, setNeighborhoodNodeId] = useState<string | undefined>(undefined);
  const [neighborhoodDepth, setNeighborhoodDepth] = useState<number>(1);

  // Layer rules state
  const [layerRules, setLayerRules] = useState<LayerRule[]>(DEFAULT_LAYER_RULES);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Sync with searchParams
  useEffect(() => {
    const urlRepo = searchParams?.get("repo");
    const urlNode = searchParams?.get("node");
    const urlLevel = searchParams?.get("level") as ArchitectureLevel;
    const urlLayout = searchParams?.get("layout") as ArchitectureLayout;

    if (urlRepo && urlRepo !== selectedRepo) setSelectedRepo(urlRepo);
    if (urlNode && urlNode !== selectedNodeId) setSelectedNodeId(urlNode);
    if (urlLevel && urlLevel !== level) setLevel(urlLevel);
    if (urlLayout && urlLayout !== layout) setLayout(urlLayout);
  }, [searchParams]);

  // Compute Graph Data
  const currentFilterModule = breadcrumbPath[breadcrumbPath.length - 1]?.filterModule;
  const currentFilterFile = breadcrumbPath[breadcrumbPath.length - 1]?.filterFile;

  const graphData = useMemo(() => {
    const store = getStore();
    return buildArchitectureGraph(
      selectedRepo,
      {
        level,
        layout,
        languageFilter,
        layerFilter,
        onlyCycles,
        onlyViolations,
        hideTests,
        hideExternal,
        filterModule: currentFilterModule,
        filterFile: currentFilterFile,
        neighborhoodNodeId,
        neighborhoodDepth,
      },
      store
    );
  }, [
    selectedRepo,
    level,
    layout,
    languageFilter,
    layerFilter,
    onlyCycles,
    onlyViolations,
    hideTests,
    hideExternal,
    currentFilterModule,
    currentFilterFile,
    neighborhoodNodeId,
    neighborhoodDepth,
    layerRules,
  ]);

  // Fallback selected node
  useEffect(() => {
    if (graphData.nodes.length > 0) {
      if (!selectedNodeId || !graphData.nodes.some((n) => n.id === selectedNodeId)) {
        // Prefer auth.ts or first node
        const defaultNode =
          graphData.nodes.find((n) => n.file.includes("auth.ts") || n.label.includes("auth.ts")) ||
          graphData.nodes[0];
        setSelectedNodeId(defaultNode.id);
      }
    }
  }, [graphData.nodes, selectedNodeId]);

  // Search match highlight
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matched = graphData.nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.file.toLowerCase().includes(q) ||
          n.type.toLowerCase().includes(q)
      );
      if (matched.length > 0) {
        setHighlightedNodeIds(matched.map((n) => n.id));
        setSelectedNodeId(matched[0].id);
      }
    } else if (!neighborhoodNodeId) {
      setHighlightedNodeIds([]);
    }
  }, [searchQuery, graphData.nodes, neighborhoodNodeId]);

  // Handlers
  const handleRepoChange = (repoId: string) => {
    setSelectedRepo(repoId);
    setHighlightedNodeIds([]);
    setHighlightedEdgeIds([]);
    setNeighborhoodNodeId(undefined);
    setBreadcrumbPath([{ label: "Layers View", level: "layers" }]);
    setLevel("layers");
    router.push(`/architecture?repo=${repoId}&level=layers`);
    logActivity({
      type: "architecture_repo_selected",
      title: "Viewed Architecture Graph",
      description: `Inspected codebase architecture for ${repoId}.`,
      href: `/architecture?repo=${repoId}`,
      status: "success",
    });
  };

  const handleLevelChange = (newLevel: ArchitectureLevel) => {
    setLevel(newLevel);
    setBreadcrumbPath([{ label: `${newLevel.charAt(0).toUpperCase() + newLevel.slice(1)} View`, level: newLevel }]);
    router.push(`/architecture?repo=${selectedRepo}&level=${newLevel}`);
    logActivity({
      type: "architecture_level_change",
      title: "Changed Architecture Level",
      description: `Switched architecture abstraction to '${newLevel}' in ${selectedRepo}.`,
      href: `/architecture?repo=${selectedRepo}&level=${newLevel}`,
      status: "success",
    });
  };

  const handleLayoutChange = (newLayout: ArchitectureLayout) => {
    setLayout(newLayout);
    showToast(`Switched layout to ${newLayout}`);
  };

  const handleDrillDown = (nodeId: string, nodeType: string) => {
    const node = graphData.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    if (level === "layers") {
      setLevel("modules");
      setBreadcrumbPath([
        { label: "Layers", level: "layers" },
        { label: node.label, level: "modules" },
      ]);
      showToast(`Drilled into ${node.label}`);
    } else if (level === "modules") {
      setLevel("files");
      setBreadcrumbPath((prev) => [
        ...prev,
        { label: node.label, filterModule: node.file, level: "files" },
      ]);
      showToast(`Drilled into module ${node.label}`);
    } else if (level === "files") {
      setLevel("symbols");
      setBreadcrumbPath((prev) => [
        ...prev,
        { label: node.label, filterFile: node.file, level: "symbols" },
      ]);
      showToast(`Inspecting symbols in ${node.label}`);
    }
  };

  const handleBreadcrumbClick = (idx: number) => {
    const target = breadcrumbPath[idx];
    if (!target) return;
    setBreadcrumbPath(breadcrumbPath.slice(0, idx + 1));
    setLevel(target.level);
  };

  const handleNodeDragStop = (nodeId: string, x: number, y: number) => {
    saveArchitecturePositions(selectedRepo, level, { [nodeId]: { x, y } });
  };

  const handleReassignLayer = (itemPath: string, newLayer: string) => {
    saveArchitectureLayerOverride(selectedRepo, itemPath, newLayer);
    showToast(`Reassigned ${itemPath} to ${newLayer} layer`);
  };

  const handleUpdateRules = (newRules: LayerRule[]) => {
    setLayerRules(newRules);
    saveArchitectureLayerRules(selectedRepo, newRules);
    showToast("Architecture boundary rules saved");
  };

  const handleFilterNeighborhood = (nodeId: string, depth: number) => {
    if (!nodeId) {
      setNeighborhoodNodeId(undefined);
      setHighlightedNodeIds([]);
      showToast("Cleared neighborhood filter");
      return;
    }
    setNeighborhoodNodeId(nodeId);
    setNeighborhoodDepth(depth);
    setSelectedNodeId(nodeId);
    showToast(`Showing neighborhood for node (depth: ${depth})`);
  };

  const handleHighlightCycle = (nodeIds: string[]) => {
    setHighlightedNodeIds(nodeIds);
    setHighlightedEdgeIds([]);
    if (nodeIds.length > 0) setSelectedNodeId(nodeIds[0]);
    showToast("Cycle highlighted on graph canvas");
  };

  const handleHighlightViolation = (edgeId: string) => {
    setHighlightedEdgeIds([edgeId]);
    const edge = graphData.edges.find((e) => e.id === edgeId);
    if (edge) {
      setHighlightedNodeIds([edge.source, edge.target]);
      setSelectedNodeId(edge.source);
    }
    showToast("Architectural violation highlighted");
  };

  const handleProposeFixCycle = (cycle: CycleFinding) => {
    const store = getStore();
    if (!store.refactoringProposals) store.refactoringProposals = [];

    const newProp = {
      id: `prop_cycle_fix_${Date.now()}`,
      userId: "usr_demo",
      workspaceId: "ws_team_demo",
      repositoryId: selectedRepo,
      repositoryName: selectedRepo,
      sourceRevision: "main (HEAD)",
      title: `Decouple circular dependency loop in ${cycle.nodeLabels[0] || "services"}`,
      operation: "extract_function",
      operationType: "extract_function",
      targetFile: cycle.nodes[0] || "src/services/auth.ts",
      filePath: cycle.nodes[0] || "src/services/auth.ts",
      targetSymbol: "CircularDecouplingInterface",
      lineRange: { start: 1, end: 30 },
      purpose: `Break circular dependency loop (${cycle.description}) by extracting shared interface into independent contract module.`,
      status: "proposed",
      beforeAfterMetrics: {
        linesBefore: 60,
        linesAfter: 45,
        complexityBefore: 14,
        complexityAfter: 6,
        effortReductionHours: 4.5,
      },
    };

    store.refactoringProposals.unshift(newProp);

    logActivity({
      type: "refactoring_proposal_created",
      title: "Created Architecture Refactoring Proposal",
      description: `Proposed decoupling fix for circular loop ${cycle.nodeLabels.join(" ⇄ ")}.`,
      href: `/refactoring?scope=${selectedRepo}`,
      status: "success",
    });

    showToast("Refactoring proposal created in /refactoring!");
    router.push(`/refactoring?scope=${selectedRepo}`);
  };

  // Export Engine
  const handleExport = (format: "png" | "svg" | "json" | "mermaid" | "share") => {
    const filenameBase = `CodeAtlas_Architecture_${selectedRepo}_${level}_${new Date().toISOString().split("T")[0]}`;

    if (format === "share") {
      const shareUrl = `${window.location.origin}${window.location.pathname}?repo=${selectedRepo}&node=${selectedNodeId}&level=${level}&layout=${layout}`;
      navigator.clipboard.writeText(shareUrl);
      showToast("Deep share link copied to clipboard!");
      return;
    }

    if (format === "json") {
      const dataStr = JSON.stringify(graphData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filenameBase}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Graph JSON downloaded successfully!");
      return;
    }

    if (format === "mermaid") {
      const mmd = generateMermaidDiagram(graphData);
      const blob = new Blob([mmd], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filenameBase}.mmd`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Mermaid diagram downloaded successfully!");
      return;
    }

    if (format === "svg" || format === "png") {
      // Generate clean SVG representation
      const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
        <rect width="100%" height="100%" fill="${isDark ? "#0B1020" : "#F8FAFC"}"/>
        <text x="40" y="50" font-family="sans-serif" font-size="20" font-weight="bold" fill="${isDark ? "#F8FAFC" : "#0F172A"}">CodeAtlas Architecture Graph — ${selectedRepo} (${level})</text>
        ${graphData.edges.map((e) => {
          const s = graphData.nodes.find((n) => n.id === e.source);
          const t = graphData.nodes.find((n) => n.id === e.target);
          if (!s || !t) return "";
          return `<line x1="${s.x || 100}" y1="${s.y || 100}" x2="${t.x || 300}" y2="${t.y || 300}" stroke="${e.isViolation ? "#EF4444" : "#7C5CFC"}" stroke-width="2"/>`;
        }).join("\n")}
        ${graphData.nodes.map((n) => {
          return `<g transform="translate(${n.x || 100}, ${n.y || 100})">
            <rect width="140" height="50" rx="8" fill="${isDark ? "#111827" : "#FFFFFF"}" stroke="#7C5CFC" stroke-width="1.5"/>
            <text x="12" y="30" font-family="sans-serif" font-size="12" font-weight="bold" fill="${isDark ? "#F8FAFC" : "#0F172A"}">${n.label.slice(0, 16)}</text>
          </g>`;
        }).join("\n")}
      </svg>`;

      if (format === "svg") {
        const blob = new Blob([svgHeader], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filenameBase}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("SVG graphic downloaded successfully!");
        return;
      }

      // Render to image canvas for PNG
      const img = new Image();
      const svgBlob = new Blob([svgHeader], { type: "image/svg+xml;charset=utf-8" });
      const URLObj = window.URL || window.webkitURL || window;
      const url = URLObj.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = `${filenameBase}.png`;
          a.click();
          showToast("PNG image exported successfully!");
        }
        URLObj.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  const currentNode =
    graphData.nodes.find((n) => n.id === selectedNodeId) ||
    graphData.nodes[0] || {
      id: "loading",
      label: "Selecting component...",
      type: "file",
      file: "src/services/auth.ts",
      description: "Loading architectural graph nodes...",
    };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <PageHeader
        title="Architecture Graph"
        sub="AST-verified structural visualization across Layers, Modules, Files, and Symbols with circular dependency detection and boundary enforcement."
      />

      {/* Toolbar */}
      <ArchitectureToolbar
        repositories={repositories}
        selectedRepo={selectedRepo}
        onRepoChange={handleRepoChange}
        level={level}
        onLevelChange={handleLevelChange}
        layout={layout}
        onLayoutChange={handleLayoutChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        languageFilter={languageFilter}
        onLanguageFilterChange={setLanguageFilter}
        layerFilter={layerFilter}
        onLayerFilterChange={setLayerFilter}
        onlyCycles={onlyCycles}
        onOnlyCyclesChange={setOnlyCycles}
        onlyViolations={onlyViolations}
        onOnlyViolationsChange={setOnlyViolations}
        hideTests={hideTests}
        onHideTestsChange={setHideTests}
        hideExternal={hideExternal}
        onHideExternalChange={setHideExternal}
        sizeMode={sizeMode}
        onSizeModeChange={setSizeMode}
        onFitView={() => {
          showToast("View centered and fitted");
        }}
        onResetView={() => {
          setSelectedNodeId(graphData.nodes[0]?.id || "");
          setHighlightedNodeIds([]);
          setNeighborhoodNodeId(undefined);
          showToast("View reset to defaults");
        }}
        onExport={handleExport}
      />

      {/* Legend & Stats Bar */}
      <ArchitectureLegend />

      {/* Main View Area: Graph Canvas / Table + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[600px]">
        {/* Left Column: Canvas or Table */}
        <div className="lg:col-span-8 flex flex-col space-y-2">
          {/* View Mode Toggle (Canvas vs Table Alternative) */}
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-mono text-[11px] text-[var(--text-secondary)]">
              Showing <strong className="text-[var(--text-primary)]">{graphData.nodes.length}</strong> entities,{" "}
              <strong className="text-[var(--text-primary)]">{graphData.edges.length}</strong> relationships
            </span>

            <div className="flex items-center rounded-xl bg-[var(--bg-card)] p-0.5 border border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setViewMode("canvas")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                  viewMode === "canvas" ? "bg-[#7C5CFC] text-white font-bold" : "text-[var(--text-secondary)]"
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
                  viewMode === "table" ? "bg-[#7C5CFC] text-white font-bold" : "text-[var(--text-secondary)]"
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Accessible Table</span>
              </button>
            </div>
          </div>

          {/* Empty State when no nodes exist */}
          {graphData.nodes.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-12 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
              <Layers className="w-12 h-12 text-[var(--text-secondary)] mx-auto" />
              <h3 className="font-bold text-base text-[var(--text-primary)]">
                No Architecture Nodes in Current Scope
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                No files matched the current filter criteria or repository indexing is pending.
              </p>
              <Link
                href="/repositories"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6A4BE2] text-white text-xs font-bold"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Add / Manage Repositories</span>
              </Link>
            </div>
          ) : viewMode === "table" ? (
            <ArchitectureTableAlternative
              nodes={graphData.nodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              repositoryId={selectedRepo}
            />
          ) : (
            <ReactFlowProvider>
              <ArchitectureCanvas
                nodes={graphData.nodes}
                edges={graphData.edges}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onDrillDown={handleDrillDown}
                breadcrumbPath={breadcrumbPath}
                onBreadcrumbClick={handleBreadcrumbClick}
                highlightedNodeIds={highlightedNodeIds}
                highlightedEdgeIds={highlightedEdgeIds}
                sizeMode={sizeMode}
                onNodeDragStop={handleNodeDragStop}
                onShowNeighborhood={(id) => handleFilterNeighborhood(id, 2)}
                onFindPathFromNode={(id) => {
                  setSidePanelTab("analysis");
                  showToast("Opened Path Finder with selected source");
                }}
                onOpenFile={(path) => {
                  router.push(`/repositories/${selectedRepo}?file=${encodeURIComponent(path)}`);
                }}
                onExplainNode={(id) => {
                  setSidePanelTab("inspector");
                  showToast("Opened Component Inspector");
                }}
                onAnalyzeImpact={(node) => {
                  router.push(
                    `/change-impact?repo=${selectedRepo}&file=${encodeURIComponent(node.file)}&symbol=${encodeURIComponent(
                      node.symbolName || node.label
                    )}`
                  );
                }}
              />
            </ReactFlowProvider>
          )}
        </div>

        {/* Right Column: Node Inspector & Analysis Tools Tabs */}
        <div className="lg:col-span-4 flex flex-col space-y-2">
          {/* Side Panel Tabs Switcher */}
          <div className="flex items-center rounded-xl bg-[var(--bg-card)] p-1 border border-[var(--border-color)] text-xs font-bold">
            <button
              type="button"
              onClick={() => setSidePanelTab("inspector")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors ${
                sidePanelTab === "inspector"
                  ? "bg-[#7C5CFC] text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Node Inspector</span>
            </button>

            <button
              type="button"
              onClick={() => setSidePanelTab("analysis")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors ${
                sidePanelTab === "analysis"
                  ? "bg-[#7C5CFC] text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analysis Tools</span>
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 flex flex-col">
            {sidePanelTab === "inspector" ? (
              <SelectedNodePanel
                currentNode={currentNode}
                repositoryId={selectedRepo}
                onSelectNode={setSelectedNodeId}
                onReassignLayer={handleReassignLayer}
              />
            ) : (
              <ArchitectureAnalysisPanel
                repositoryId={selectedRepo}
                nodes={graphData.nodes}
                edges={graphData.edges}
                cycles={graphData.cycles || []}
                violations={graphData.violations || []}
                rules={layerRules}
                metrics={
                  graphData.metrics || {
                    mostDepended: [],
                    mostDependent: [],
                    largestModules: [],
                    moduleInstability: [],
                  }
                }
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onHighlightPath={setHighlightedNodeIds}
                onFilterNeighborhood={handleFilterNeighborhood}
                onHighlightCycle={handleHighlightCycle}
                onHighlightViolation={handleHighlightViolation}
                onUpdateRules={handleUpdateRules}
                onProposeFixCycle={handleProposeFixCycle}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#7C5CFC] text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-mono text-[var(--text-secondary)]">
          Loading Architecture Graph...
        </div>
      }
    >
      <ArchitectureContent />
    </Suspense>
  );
}
