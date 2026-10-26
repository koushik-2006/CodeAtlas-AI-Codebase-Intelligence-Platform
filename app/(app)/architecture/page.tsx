"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useTheme } from "@/hooks/useTheme";
import { useRepositories } from "@/hooks/useRepositories";
import { ArchitectureCanvas } from "@/components/architecture/ArchitectureCanvas";
import { SelectedNodePanel } from "@/components/architecture/SelectedNodePanel";
import { GraphPathExplorer } from "@/components/architecture/GraphPathExplorer";
import { ArchitectureTableAlternative } from "@/components/architecture/ArchitectureTableAlternative";
import {
  architectureService,
  SAMPLE_PROJECT_NODES,
  SAMPLE_PROJECT_EDGES,
  GraphMetrics,
} from "@/services/architecture-service";
import { ArchitectureNode, ArchitectureEdge } from "@/types/architecture";
import {
  Network,
  Building2,
  Table2,
  FolderGit2,
  Route,
  Activity,
  Layers,
  AlertCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";

function ArchitectureContent() {
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { repositories } = useRepositories();

  const [selectedRepo, setSelectedRepo] = useState<string>("sample-project");
  const [nodes, setNodes] = useState<ArchitectureNode[]>(SAMPLE_PROJECT_NODES);
  const [edges, setEdges] = useState<ArchitectureEdge[]>(SAMPLE_PROJECT_EDGES);
  const [metrics, setMetrics] = useState<GraphMetrics | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("node-login-user");
  const [viewStyle, setViewStyle] = useState<"graph" | "city" | "table">("graph");
  const [activeTab, setActiveTab] = useState<"inspector" | "path">("inspector");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [highlightedPathIds, setHighlightedPathIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load graph data on mount or repo change
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    architectureService.getGraphForRepository(selectedRepo).then(({ data, metrics: resMetrics }) => {
      if (!isMounted) return;
      setNodes(data.nodes);
      setEdges(data.edges);
      if (resMetrics) setMetrics(resMetrics);

      // Check if URL search param requests a specific node
      const nodeFromUrl = searchParams?.get("node");
      if (nodeFromUrl && data.nodes.some((n) => n.id === nodeFromUrl)) {
        setSelectedNodeId(nodeFromUrl);
      } else if (data.nodes.length > 0) {
        setSelectedNodeId(data.nodes[3]?.id || data.nodes[0].id);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedRepo, searchParams]);

  const currentNode =
    nodes.find((n) => n.id === selectedNodeId) || nodes[0] || {
      id: "loading",
      label: "Loading...",
      type: "Function",
      file: "src/services/auth.ts",
      description: "Loading node graph data...",
    };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Architecture Graph"
        sub="Visualize relationships between source files, functions, APIs, services, database models, and tests."
      />

      {/* Control Bar: Repository Selector + Metrics + View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)]">
        {/* Repository Selector */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <FolderGit2 className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-[var(--text-secondary)]">Repository:</span>
          <select
            value={selectedRepo}
            onChange={(e) => {
              setSelectedRepo(e.target.value);
              setHighlightedPathIds([]);
            }}
            aria-label="Select repository for architecture graph"
            className={`py-1 px-2.5 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
              isDark
                ? "bg-[#0D1117] border-[#30363D] text-[#E6EDF3]"
                : "bg-white border-[#E5E5E0] text-[#1E2022]"
            }`}
          >
            {repositories.length > 0 ? (
              repositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.status === "ready" ? "Indexed" : "Connected"})
                </option>
              ))
            ) : (
              <option value="sample-project">sample-project (Indexed)</option>
            )}
          </select>
        </div>

        {/* Quick Graph Summary Pill */}
        <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
            <strong className="text-[var(--text-primary)]">{nodes.length}</strong> Entities
          </span>
          <span className="inline-flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-teal-500" />
            <strong className="text-[var(--text-primary)]">{edges.length}</strong> Relationships
          </span>
          {metrics && metrics.circularDependencies.length > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              {metrics.circularDependencies.length} Cycle(s)
            </span>
          )}
        </div>

        {/* View Switcher: Graph View vs City Map View */}
        <div className="flex items-center gap-1 rounded-xl p-1 border border-[var(--border-color)] bg-[var(--bg-page)]">
          <button
            type="button"
            onClick={() => setViewStyle("graph")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewStyle === "graph"
                ? isDark
                  ? "bg-[#29D3C2] text-[#070A12] shadow-xs"
                  : "bg-[#6C4DFF] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Graph View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewStyle("city")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewStyle === "city"
                ? isDark
                  ? "bg-[#29D3C2] text-[#070A12] shadow-xs"
                  : "bg-[#6C4DFF] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>City Map View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewStyle("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewStyle === "table"
                ? isDark
                  ? "bg-[#29D3C2] text-[#070A12] shadow-xs"
                  : "bg-[#6C4DFF] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Accessible Table</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Architecture Canvas & Inspector / Path Tabs */}
      <div className="grid gap-5 lg:grid-cols-12 min-h-[600px] items-stretch">
        {/* Left Column: Canvas or Table */}
        <div className="lg:col-span-8 flex flex-col">
          {viewStyle === "table" ? (
            <ArchitectureTableAlternative
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              repositoryId={selectedRepo}
            />
          ) : (
            <ArchitectureCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              viewStyle={viewStyle}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              highlightedNodeIds={highlightedPathIds}
            />
          )}
        </div>

        {/* Right Column: Inspector or Path Explorer Tabs */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          {/* Sub Navigation: Inspector vs Path Explorer */}
          <div className="flex items-center rounded-xl p-1 border border-[var(--border-color)] bg-[var(--bg-surface)] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("inspector")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "inspector"
                  ? isDark
                    ? "bg-[#29D3C2] text-[#070A12]"
                    : "bg-[#6C4DFF] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Node Inspector</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("path")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "path"
                  ? isDark
                    ? "bg-[#29D3C2] text-[#070A12]"
                    : "bg-[#6C4DFF] text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              <span>Path Explorer</span>
            </button>
          </div>

          {/* Panel Display */}
          <div className="flex-1 flex flex-col">
            {activeTab === "inspector" ? (
              <SelectedNodePanel
                currentNode={currentNode}
                repositoryId={selectedRepo}
                viewStyle={viewStyle === "city" ? "city" : "graph"}
                onSelectNode={setSelectedNodeId}
              />
            ) : (
              <GraphPathExplorer
                repositoryId={selectedRepo}
                nodes={nodes}
                onSelectNode={setSelectedNodeId}
                onHighlightPath={setHighlightedPathIds}
              />
            )}
          </div>
        </div>
      </div>
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
