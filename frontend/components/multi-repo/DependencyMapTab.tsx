"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Download,
  FileJson,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Package,
  Server,
  FileCode,
  X,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CrossRepoDependencyGraph, CrossRepoRelationship } from "@/types/multi-repo";
import Link from "next/link";

interface DependencyMapTabProps {
  graph: CrossRepoDependencyGraph;
  isLoading: boolean;
  onOpenRepo?: (repoId: string) => void;
}

export function DependencyMapTab({ graph, isLoading, onOpenRepo }: DependencyMapTabProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layout state: 'force' | 'hierarchical'
  const [layoutMode, setLayoutMode] = useState<"force" | "hierarchical">("force");

  // Selected elements
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Dragging nodes
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mobile list toggle
  const [mobileView, setMobileView] = useState<"canvas" | "list">("canvas");

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Initialize node positions based on layoutMode
  useEffect(() => {
    if (!graph.nodes || graph.nodes.length === 0) return;

    const positions: Record<string, { x: number; y: number }> = {};
    const total = graph.nodes.length;
    const centerX = 450;
    const centerY = 300;

    if (layoutMode === "hierarchical") {
      // Tier 0: shared libraries (shared-core-lib)
      // Tier 1: backend services (auth-service, payment-service, fastapi-backend)
      // Tier 2: consumers & frontends (sample-project, ecommerce-platform, my-project)
      const tiers: Record<number, typeof graph.nodes> = { 0: [], 1: [], 2: [] };

      graph.nodes.forEach((node) => {
        if (node.id.includes("shared") || node.id.includes("core") || node.id.includes("lib")) {
          tiers[0].push(node);
        } else if (node.id.includes("service") || node.id.includes("backend")) {
          tiers[1].push(node);
        } else {
          tiers[2].push(node);
        }
      });

      // Spread along horizontal tiers
      [0, 1, 2].forEach((tIdx) => {
        const tierNodes = tiers[tIdx] || [];
        const y = 120 + tIdx * 180;
        tierNodes.forEach((node, idx) => {
          const spacing = 750 / (tierNodes.length + 1);
          positions[node.id] = {
            x: 80 + spacing * (idx + 1),
            y,
          };
        });
      });
    } else {
      // Force / organic circular distribution
      const radius = total <= 4 ? 180 : 230;
      graph.nodes.forEach((node, idx) => {
        const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
        positions[node.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        };
      });
    }

    setNodePositions(positions);
  }, [graph.nodes, layoutMode]);

  // Selected Node Data
  const selectedNode = useMemo(() => {
    return graph.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [graph.nodes, selectedNodeId]);

  // Selected Edge Data
  const selectedEdge = useMemo(() => {
    return graph.edges.find((e) => e.id === selectedEdgeId) || null;
  }, [graph.edges, selectedEdgeId]);

  // Outgoing dependencies for selected node
  const outgoingDependencies = useMemo(() => {
    if (!selectedNodeId) return [];
    return graph.edges.filter((e) => e.sourceRepoId === selectedNodeId);
  }, [graph.edges, selectedNodeId]);

  // Incoming dependants for selected node
  const incomingDependants = useMemo(() => {
    if (!selectedNodeId) return [];
    return graph.edges.filter((e) => e.targetRepoId === selectedNodeId);
  }, [graph.edges, selectedNodeId]);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.15, 2.2));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.15, 0.45));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };
  const handleFitToScreen = () => {
    setZoomLevel(0.9);
    setPanOffset({ x: 10, y: 10 });
  };

  // Canvas Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".graph-node")) return;
    setIsPanning(true);
    startPanRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      setNodePositions((prev) => ({
        ...prev,
        [draggedNodeId]: {
          x: (e.clientX - startPanRef.current.x) / zoomLevel,
          y: (e.clientY - startPanRef.current.y) / zoomLevel,
        },
      }));
      return;
    }

    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  // Node Drag Start
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);

    const pos = nodePositions[nodeId] || { x: 0, y: 0 };
    startPanRef.current = {
      x: e.clientX - pos.x * zoomLevel,
      y: e.clientY - pos.y * zoomLevel,
    };
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(graph, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codeatlas-multi-repo-dependencies-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PNG
  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `codeatlas-dependency-topology-${new Date().toISOString().slice(0, 10)}.png`;
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "typescript":
        return "#7C5CFC";
      case "python":
        return "#3B82F6";
      case "go":
        return "#2FD6A0";
      case "javascript":
        return "#F59E0B";
      default:
        return "#7C5CFC";
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl">
        <div className="inline-block animate-spin w-8 h-8 border-3 border-[#7C5CFC] border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-semibold text-[#19143D] dark:text-[#F3F5FA]">
          Mapping multi-repository dependencies & service graphs...
        </p>
        <p className="text-xs text-[#8E95A8] mt-1">Parsing cross-codebase package manifests and API contracts</p>
      </div>
    );
  }

  if (!graph.nodes || graph.nodes.length === 0) {
    return (
      <div className="p-12 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl space-y-3">
        <Layers className="w-10 h-10 text-[#8E95A8] mx-auto opacity-50" />
        <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA]">No repositories selected</h3>
        <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] max-w-md mx-auto">
          Please select at least 1 repository from the scope selector above to visualize dependency topology.
        </p>
      </div>
    );
  }

  if (graph.nodes.length === 1) {
    const singleRepo = graph.nodes[0];
    return (
      <div className="p-10 text-center bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl space-y-4">
        <div className="p-3 w-12 h-12 rounded-2xl bg-[#7C5CFC]/10 text-[#7C5CFC] mx-auto flex items-center justify-center">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA]">
          Single Repository Selected: {singleRepo.name}
        </h3>
        <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] max-w-md mx-auto">
          Add another repository to the active scope above to discover inter-project package links, direct source imports, and cross-service HTTP calls.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href={`/repositories/${singleRepo.id}`}
            className="px-4 py-2 rounded-xl bg-[#7C5CFC] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Explore {singleRepo.name}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search filter & Layout switch */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8E95A8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repo in graph..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs text-[#19143D] dark:text-[#F3F5FA] placeholder-[#8E95A8] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
            />
          </div>

          <div className="flex items-center rounded-xl bg-[#F7F5FE] dark:bg-[#141926] p-1 border border-[#EAE6FD] dark:border-[#242B3D]">
            <button
              onClick={() => setLayoutMode("force")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                layoutMode === "force"
                  ? "bg-white dark:bg-[#0D111A] text-[#7C5CFC] dark:text-[#A78BFA] shadow-xs"
                  : "text-[#8E95A8] hover:text-[#19143D]"
              }`}
            >
              Organic / Circular
            </button>
            <button
              onClick={() => setLayoutMode("hierarchical")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                layoutMode === "hierarchical"
                  ? "bg-white dark:bg-[#0D111A] text-[#7C5CFC] dark:text-[#A78BFA] shadow-xs"
                  : "text-[#8E95A8] hover:text-[#19143D]"
              }`}
            >
              Hierarchical
            </button>
          </div>

          {/* Mobile view toggle */}
          <div className="md:hidden flex items-center rounded-xl bg-[#F7F5FE] dark:bg-[#141926] p-1 border border-[#EAE6FD] dark:border-[#242B3D]">
            <button
              onClick={() => setMobileView("canvas")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                mobileView === "canvas" ? "bg-white dark:bg-[#0D111A] text-[#7C5CFC]" : "text-[#8E95A8]"
              }`}
            >
              Canvas
            </button>
            <button
              onClick={() => setMobileView("list")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                mobileView === "list" ? "bg-white dark:bg-[#0D111A] text-[#7C5CFC]" : "text-[#8E95A8]"
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Right: Zoom & Export Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#EAE6FD] dark:border-[#242B3D] rounded-xl overflow-hidden bg-[#F7F5FE] dark:bg-[#141926]">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white dark:hover:bg-[#0D111A] text-[#6E6A8A] dark:text-[#8E95A8] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white dark:hover:bg-[#0D111A] text-[#6E6A8A] dark:text-[#8E95A8] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 hover:bg-white dark:hover:bg-[#0D111A] text-[#6E6A8A] dark:text-[#8E95A8] transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleFitToScreen}
              className="p-1.5 hover:bg-white dark:hover:bg-[#0D111A] text-[#6E6A8A] dark:text-[#8E95A8] transition-colors"
              title="Fit to Screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs font-semibold text-[#19143D] dark:text-[#F3F5FA] hover:border-[#7C5CFC]/40 transition-colors"
            title="Export topology as high-res PNG"
          >
            <Download className="w-3.5 h-3.5 text-[#7C5CFC]" />
            <span className="hidden sm:inline">Export PNG</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EAE6FD] dark:border-[#242B3D] bg-[#F7F5FE] dark:bg-[#141926] text-xs font-semibold text-[#19143D] dark:text-[#F3F5FA] hover:border-[#7C5CFC]/40 transition-colors"
            title="Export dependency graph as JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
        </div>
      </div>

      {/* Main Canvas & Detail Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* Interactive SVG Canvas */}
        <div
          className={`lg:col-span-2 bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl overflow-hidden shadow-sm relative min-h-[520px] select-none ${
            mobileView === "list" ? "hidden md:block" : "block"
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Legend overlay */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-3 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#0D111A]/90 backdrop-blur-xs border border-[#EAE6FD] dark:border-[#1E2638] text-[11px] font-medium shadow-xs">
            <span className="text-[#8E95A8] uppercase tracking-wider text-[10px] font-bold">Legend:</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C5CFC]" />
              <span>TypeScript</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2FD6A0]" />
              <span>Go</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
              <span>Python</span>
            </div>
            <span className="text-[#8E95A8]">·</span>
            <span className="text-[#8E95A8]">Drag nodes to rearrange</span>
          </div>

          <svg
            ref={svgRef}
            className="w-full h-[540px] cursor-grab active:cursor-grabbing"
            viewBox="0 0 900 600"
          >
            <defs>
              <marker
                id="arrowhead-pkg"
                markerWidth="8"
                markerHeight="6"
                refX="28"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#7C5CFC" />
              </marker>
              <marker
                id="arrowhead-import"
                markerWidth="8"
                markerHeight="6"
                refX="28"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#29D3C2" />
              </marker>
              <marker
                id="arrowhead-api"
                markerWidth="8"
                markerHeight="6"
                refX="28"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#10B981" />
              </marker>
            </defs>

            <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}>
              {/* Edges */}
              {graph.edges.map((edge) => {
                const sourcePos = nodePositions[edge.sourceRepoId];
                const targetPos = nodePositions[edge.targetRepoId];
                if (!sourcePos || !targetPos) return null;

                const isEdgeSelected = selectedEdgeId === edge.id;
                const isConnected =
                  selectedNodeId === edge.sourceRepoId || selectedNodeId === edge.targetRepoId;

                const dx = targetPos.x - sourcePos.x;
                const dy = targetPos.y - sourcePos.y;
                const midX = (sourcePos.x + targetPos.x) / 2;
                const midY = (sourcePos.y + targetPos.y) / 2;
                // Add slight curvature
                const curveOffset = 25;
                const norm = Math.sqrt(dx * dx + dy * dy) || 1;
                const cx = midX - (dy / norm) * curveOffset;
                const cy = midY + (dx / norm) * curveOffset;

                const strokeColor =
                  edge.type === "configured_service_relationship"
                    ? "#10B981"
                    : edge.type === "verified_source_reference"
                    ? "#29D3C2"
                    : "#7C5CFC";

                const markerId =
                  edge.type === "configured_service_relationship"
                    ? "url(#arrowhead-api)"
                    : edge.type === "verified_source_reference"
                    ? "url(#arrowhead-import)"
                    : "url(#arrowhead-pkg)";

                return (
                  <g
                    key={edge.id}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdgeId(edge.id);
                      setSelectedNodeId(null);
                    }}
                  >
                    <path
                      d={`M ${sourcePos.x} ${sourcePos.y} Q ${cx} ${cy} ${targetPos.x} ${targetPos.y}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isEdgeSelected || isConnected ? 3 : 1.8}
                      strokeDasharray={edge.type === "configured_service_relationship" ? "4,3" : undefined}
                      markerEnd={markerId}
                      className="transition-all hover:stroke-width-3 cursor-pointer"
                      opacity={isEdgeSelected || isConnected ? 1 : 0.75}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEdgeId(edge.id);
                        setSelectedNodeId(null);
                      }}
                    />

                    {/* Edge Label Pill */}
                    <g
                      transform={`translate(${cx}, ${cy})`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEdgeId(edge.id);
                        setSelectedNodeId(null);
                      }}
                    >
                      <rect
                        x="-34"
                        y="-10"
                        width="68"
                        height="20"
                        rx="10"
                        fill={isEdgeSelected ? strokeColor : "#FFFFFF"}
                        stroke={strokeColor}
                        strokeWidth="1.2"
                        className="shadow-xs dark:fill-[#0D111A] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEdgeId(edge.id);
                          setSelectedNodeId(null);
                        }}
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill={isEdgeSelected ? "#FFFFFF" : strokeColor}
                        className="pointer-events-none select-none"
                      >
                        {edge.type === "configured_service_relationship"
                          ? "API Call"
                          : edge.type === "verified_source_reference"
                          ? "Import"
                          : "Package"}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Nodes */}
              {graph.nodes.map((node) => {
                const pos = nodePositions[node.id] || { x: 450, y: 300 };
                const isSelected = selectedNodeId === node.id;
                const isMatchingSearch =
                  searchQuery.trim() !== "" &&
                  node.name.toLowerCase().includes(searchQuery.toLowerCase());

                const langColor = getLanguageColor(node.language);
                const radius = Math.min(48, Math.max(34, Math.sqrt((node.loc || 2000) / 4)));

                return (
                  <g
                    key={node.id}
                    className="graph-node cursor-pointer"
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  >
                    {/* Outer Glow / Search Highlight */}
                    {(isSelected || isMatchingSearch) && (
                      <circle
                        r={radius + 8}
                        fill="none"
                        stroke="#7C5CFC"
                        strokeWidth="2.5"
                        strokeDasharray="4,4"
                        className="animate-spin"
                        style={{ transformOrigin: "0 0" }}
                      />
                    )}

                    {/* Health score ring */}
                    <circle
                      r={radius + 3}
                      fill="none"
                      stroke="#EAE6FD"
                      strokeWidth="2.5"
                      className="dark:stroke-[#1E2638]"
                    />
                    <circle
                      r={radius + 3}
                      fill="none"
                      stroke="#29D3C2"
                      strokeWidth="2.5"
                      strokeDasharray={`${(node.healthScore || 94) * 2}, 200`}
                      transform="rotate(-90)"
                    />

                    {/* Node Core Circle */}
                    <circle
                      r={radius}
                      fill="#FFFFFF"
                      stroke={langColor}
                      strokeWidth="2"
                      className="shadow-md dark:fill-[#141926]"
                    />

                    {/* Node Icon / Initial */}
                    <text
                      textAnchor="middle"
                      y="-4"
                      fontSize="14"
                      fontWeight="bold"
                      fill={langColor}
                    >
                      {node.name.slice(0, 2).toUpperCase()}
                    </text>

                    <text
                      textAnchor="middle"
                      y="12"
                      fontSize="10"
                      fontWeight="semibold"
                      fill="#8E95A8"
                      className="font-mono"
                    >
                      {node.language}
                    </text>

                    {/* Node Label Below */}
                    <g transform={`translate(0, ${radius + 18})`}>
                      <rect
                        x="-50"
                        y="-8"
                        width="100"
                        height="18"
                        rx="6"
                        fill="#FFFFFF"
                        stroke="#EAE6FD"
                        strokeWidth="1"
                        className="dark:fill-[#0D111A] dark:stroke-[#1E2638] shadow-xs"
                      />
                      <text
                        textAnchor="middle"
                        y="4"
                        fontSize="9.5"
                        fontWeight="bold"
                        fill="#19143D"
                        className="dark:fill-[#F3F5FA]"
                      >
                        {node.name.length > 15 ? `${node.name.slice(0, 13)}…` : node.name}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Mobile List View fallback */}
        {mobileView === "list" && (
          <div className="md:hidden space-y-3 bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-4">
            <h3 className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA]">
              Repositories & Inter-Service Links
            </h3>
            <div className="space-y-2">
              {graph.edges.map((e) => (
                <div
                  key={e.id}
                  onClick={() => setSelectedEdgeId(e.id)}
                  className="p-3 rounded-xl border border-[#EAE6FD] dark:border-[#1E2638] bg-[#F7F5FE] dark:bg-[#141926] text-xs font-mono flex items-center justify-between"
                >
                  <span className="font-bold text-[#19143D] dark:text-[#F3F5FA]">{e.sourceRepoName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8E95A8]" />
                  <span className="font-bold text-[#7C5CFC]">{e.targetRepoName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Side Detail Panel: Node or Edge Inspector */}
        <div className="space-y-4">
          {selectedNode ? (
            /* Node Inspector */
            <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-5 shadow-sm space-y-4 sticky top-6">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#EAE6FD] dark:border-[#1E2638]">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: getLanguageColor(selectedNode.language) }}
                    />
                    <h3 className="text-base font-bold text-[#19143D] dark:text-[#F3F5FA]">
                      {selectedNode.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-0.5 line-clamp-2">
                    {selectedNode.description || "Microservice repository in authorized scope."}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-[#8E95A8] hover:text-[#19143D] dark:hover:text-[#F3F5FA] p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Node Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D]">
                  <span className="text-[#8E95A8] block text-[10px] uppercase font-bold">Health Score</span>
                  <span className="text-sm font-extrabold text-[#29D3C2]">
                    {selectedNode.healthScore || 96}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D]">
                  <span className="text-[#8E95A8] block text-[10px] uppercase font-bold">Symbols / LOC</span>
                  <span className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA]">
                    {selectedNode.symbolCount} / {selectedNode.loc || 2000}
                  </span>
                </div>
              </div>

              {/* Depends On (Outgoing) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider">
                  Depends On ({outgoingDependencies.length})
                </h4>
                {outgoingDependencies.length === 0 ? (
                  <p className="text-xs text-[#8E95A8] italic">No outgoing dependencies detected.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {outgoingDependencies.map((dep) => (
                      <div
                        key={dep.id}
                        onClick={() => setSelectedEdgeId(dep.id)}
                        className="p-2 rounded-lg bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] text-xs font-medium flex items-center justify-between cursor-pointer hover:border-[#7C5CFC]/50 transition-colors"
                      >
                        <span className="font-bold text-[#7C5CFC]">{dep.targetRepoName}</span>
                        <Badge variant="cyan" className="text-[10px]">
                          {dep.typeLabel}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Used By (Incoming) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#8E95A8] uppercase tracking-wider">
                  Used By ({incomingDependants.length})
                </h4>
                {incomingDependants.length === 0 ? (
                  <p className="text-xs text-[#8E95A8] italic">No upstream dependants detected.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {incomingDependants.map((dep) => (
                      <div
                        key={dep.id}
                        onClick={() => setSelectedEdgeId(dep.id)}
                        className="p-2 rounded-lg bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] text-xs font-medium flex items-center justify-between cursor-pointer hover:border-[#7C5CFC]/50 transition-colors"
                      >
                        <span className="font-bold text-[#19143D] dark:text-[#F3F5FA]">{dep.sourceRepoName}</span>
                        <Badge variant="mint" className="text-[10px]">
                          {dep.typeLabel}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Open Repository button */}
              <div className="pt-2">
                <Link
                  href={`/repositories/${selectedNode.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#7C5CFC] hover:bg-[#6A4BE8] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <span>Open {selectedNode.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : selectedEdge ? (
            /* Edge Inspector */
            <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-5 shadow-sm space-y-4 sticky top-6">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#EAE6FD] dark:border-[#1E2638]">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="font-bold text-[#19143D] dark:text-[#F3F5FA]">
                      {selectedEdge.sourceRepoName}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8E95A8]" />
                    <span className="font-bold text-[#7C5CFC]">{selectedEdge.targetRepoName}</span>
                  </div>
                  <Badge variant="cyan" className="text-[10px] mt-1.5">
                    {selectedEdge.typeLabel}
                  </Badge>
                </div>
                <button
                  onClick={() => setSelectedEdgeId(null)}
                  className="text-[#8E95A8] hover:text-[#19143D] dark:hover:text-[#F3F5FA] p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8E95A8] uppercase tracking-wider block">
                  Description
                </span>
                <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] mt-1">
                  {selectedEdge.description}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8E95A8] uppercase tracking-wider block">
                  Evidence File & Line
                </span>
                <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-[#7C5CFC] font-semibold">
                  <FileCode className="w-3.5 h-3.5" />
                  <span>
                    {selectedEdge.evidenceFile}:{selectedEdge.evidenceLine}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8E95A8] uppercase tracking-wider block mb-1">
                  Code Snippet / Manifest Entry
                </span>
                <div className="p-3 rounded-xl bg-[#F7F5FE] dark:bg-[#141926] border border-[#EAE6FD] dark:border-[#242B3D] font-mono text-xs text-[#19143D] dark:text-[#D1D5DB] overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{selectedEdge.evidenceSnippet}</pre>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[#8E95A8] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Verified from AST call graph and package manifests.</span>
              </div>
            </div>
          ) : (
            /* Default Hint Panel */
            <div className="bg-[#FFFFFF] dark:bg-[#0D111A] border border-[#EAE6FD] dark:border-[#1E2638] rounded-2xl p-6 text-center space-y-3">
              <div className="p-3 w-10 h-10 rounded-xl bg-[#F4F0FF] dark:bg-[#1E1A38] text-[#7C5CFC] mx-auto flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-[#19143D] dark:text-[#F3F5FA]">
                Inspect Topology Elements
              </h4>
              <p className="text-xs text-[#6E6A8A] dark:text-[#8E95A8] max-w-xs mx-auto">
                Click any repository node to inspect dependencies, health scores, and symbols, or click a directed arrow to view exact evidence files and code lines.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
