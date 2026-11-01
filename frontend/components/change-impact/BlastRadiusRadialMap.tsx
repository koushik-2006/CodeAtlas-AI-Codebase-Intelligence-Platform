"use client";

import React, { useState, useEffect } from "react";
import {
  Network,
  ListTree,
  Globe,
  Layers,
  Server,
  Database,
  TestTube2,
  ExternalLink,
  AlertTriangle,
  FileCode,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
} from "lucide-react";
import {
  AffectedItem,
  RadialGraphData,
  RadialGraphNode,
  ImpactSeverity,
  AffectedItemType,
} from "@/types/impact";
import { Button } from "@/components/ui/Button";

interface BlastRadiusRadialMapProps {
  radialData: RadialGraphData;
  selectedNodeId?: string;
  onSelectNode: (node: RadialGraphNode) => void;
  className?: string;
}

export function BlastRadiusRadialMap({
  radialData,
  selectedNodeId,
  onSelectNode,
  className = "",
}: BlastRadiusRadialMapProps) {
  const [viewMode, setViewMode] = useState<"radial" | "tree">("radial");
  const [hoveredNode, setHoveredNode] = useState<RadialGraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Auto-switch to tree view on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode("tree");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getNodeTypeColor = (type: AffectedItemType) => {
    switch (type) {
      case "endpoint":
        return { bg: "bg-cyan-500", stroke: "#06B6D4", text: "text-cyan-400" };
      case "component":
        return { bg: "bg-[#7C5CFC]", stroke: "#7C5CFC", text: "text-[#7C5CFC]" };
      case "service":
        return { bg: "bg-emerald-500", stroke: "#10B981", text: "text-emerald-400" };
      case "database":
        return { bg: "bg-amber-500", stroke: "#F59E0B", text: "text-amber-400" };
      case "test":
        return { bg: "bg-rose-500", stroke: "#F43F5E", text: "text-rose-400" };
      case "cross_repo":
        return { bg: "bg-indigo-500", stroke: "#6366F1", text: "text-indigo-400" };
      case "gap":
        return { bg: "bg-red-500", stroke: "#EF4444", text: "text-red-400" };
      default:
        return { bg: "bg-slate-500", stroke: "#64748B", text: "text-slate-400" };
    }
  };

  const getNodeIcon = (type: AffectedItemType) => {
    switch (type) {
      case "endpoint":
        return <Globe className="w-3.5 h-3.5" />;
      case "component":
        return <Layers className="w-3.5 h-3.5" />;
      case "service":
        return <Server className="w-3.5 h-3.5" />;
      case "database":
        return <Database className="w-3.5 h-3.5" />;
      case "test":
        return <TestTube2 className="w-3.5 h-3.5" />;
      case "cross_repo":
        return <ExternalLink className="w-3.5 h-3.5" />;
      case "gap":
        return <AlertTriangle className="w-3.5 h-3.5" />;
      default:
        return <FileCode className="w-3.5 h-3.5" />;
    }
  };

  const centerCoord = 260;

  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm flex flex-col ${className}`}>
      {/* Header & Controls */}
      <div className="p-3.5 sm:p-4 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-[#7C5CFC]" />
          <h3 className="font-bold text-sm text-[var(--text-primary)]">
            Blast Radius Concentric Visualization
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-secondary)]">
            {radialData.nodes.length} Affected Nodes
          </span>
        </div>

        {/* View Toggle & Zoom */}
        <div className="flex items-center gap-2">
          {viewMode === "radial" && (
            <div className="flex items-center rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
                className="p-1 hover:text-[var(--text-primary)] text-[var(--text-secondary)]"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[10px] text-[var(--text-secondary)]">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
                className="p-1 hover:text-[var(--text-primary)] text-[var(--text-secondary)]"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:text-[var(--text-primary)] text-[var(--text-secondary)]"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center rounded-xl bg-[var(--bg-card-hover)] p-0.5 border border-[var(--border-color)] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("radial")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                viewMode === "radial"
                  ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Radial Map</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
                viewMode === "tree"
                  ? "bg-[#7C5CFC] text-white shadow-xs font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>Hierarchy List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      {viewMode === "radial" ? (
        <div className="relative w-full h-[540px] flex items-center justify-center overflow-hidden bg-[var(--bg-canvas)] select-none">
          <svg
            viewBox="0 0 520 520"
            className="w-full h-full max-w-[560px] max-h-[560px] transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <defs>
              <radialGradient id="blastGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#7C5CFC" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#7C5CFC" stopOpacity="0" />
              </radialGradient>
              <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.35" />
              </filter>
            </defs>

            {/* Center Background Glow */}
            <circle cx={centerCoord} cy={centerCoord} r="140" fill="url(#blastGlow)" />

            {/* Concentric Hop Rings */}
            {radialData.rings.map((ring) => (
              <g key={ring.hop}>
                <circle
                  cx={centerCoord}
                  cy={centerCoord}
                  r={ring.radius}
                  fill="none"
                  stroke="var(--border-color)"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.6"
                />
                {/* Ring Hop Label */}
                <text
                  x={centerCoord}
                  y={centerCoord - ring.radius - 8}
                  textAnchor="middle"
                  fill="var(--text-secondary)"
                  fontSize="10"
                  fontFamily="monospace"
                  opacity="0.8"
                >
                  {ring.label} ({ring.count})
                </text>
              </g>
            ))}

            {/* Directed Edges */}
            {radialData.edges.map((edge) => {
              const srcNode = radialData.nodes.find((n) => n.id === edge.source);
              const tgtNode = radialData.nodes.find((n) => n.id === edge.target);
              if (!srcNode || !tgtNode) return null;

              const isEdgeActive =
                selectedNodeId === srcNode.id ||
                selectedNodeId === tgtNode.id ||
                hoveredNode?.id === srcNode.id ||
                hoveredNode?.id === tgtNode.id;

              return (
                <line
                  key={edge.id}
                  x1={srcNode.x}
                  y1={srcNode.y}
                  x2={tgtNode.x}
                  y2={tgtNode.y}
                  stroke={isEdgeActive ? "#7C5CFC" : "var(--border-color)"}
                  strokeWidth={isEdgeActive ? 2 : 1}
                  strokeOpacity={isEdgeActive ? 0.9 : 0.4}
                  strokeDasharray={edge.hop > 1 ? "3 3" : undefined}
                />
              );
            })}

            {/* Nodes */}
            {radialData.nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNode?.id === node.id;
              const isCenter = node.hop === 0;
              const colors = getNodeTypeColor(node.type);
              const nodeRadius = isCenter ? 26 : isSelected ? 20 : 16;

              return (
                <g
                  key={node.id}
                  data-testid="radial-node"
                  data-node-id={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => onSelectNode(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className="cursor-pointer transition-transform duration-150"
                  filter="url(#nodeShadow)"
                >
                  {/* Outer selection ring */}
                  {(isSelected || isHovered) && (
                    <circle
                      r={nodeRadius + 6}
                      fill="none"
                      stroke="#7C5CFC"
                      strokeWidth="2.5"
                      opacity="0.9"
                      className="animate-pulse"
                    />
                  )}

                  {/* Node Body */}
                  <circle
                    r={nodeRadius}
                    fill={isCenter ? "#7C5CFC" : "var(--bg-card)"}
                    stroke={isCenter ? "#FFFFFF" : colors.stroke}
                    strokeWidth={isCenter ? 3 : 2}
                  />

                  {/* Center Node Label or Icon */}
                  {isCenter ? (
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      HOP 0
                    </text>
                  ) : (
                    <circle r="4" fill={colors.stroke} />
                  )}

                  {/* Label below node */}
                  <text
                    y={nodeRadius + 14}
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontSize="10"
                    fontWeight={isSelected ? "bold" : "normal"}
                    fontFamily="monospace"
                    className="pointer-events-none select-none"
                  >
                    {node.name.length > 18 ? `${node.name.slice(0, 16)}...` : node.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Hover Tooltip */}
          {hoveredNode && (
            <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-[var(--bg-card)] border border-[#7C5CFC] shadow-xl text-xs space-y-1 z-30 pointer-events-none animate-in fade-in duration-150 max-w-xs">
              <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                <span className={getNodeTypeColor(hoveredNode.type).text}>
                  {getNodeIcon(hoveredNode.type)}
                </span>
                <span>{hoveredNode.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#7C5CFC]/15 text-[#7C5CFC]">
                  Hop {hoveredNode.hop}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[var(--text-secondary)]">
                {hoveredNode.repositoryName} • {hoveredNode.filePath}:{hoveredNode.line}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] italic">
                {hoveredNode.item.reason}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Hierarchy List / Tree View */
        <div className="p-4 overflow-y-auto max-h-[540px] space-y-4">
          {[0, 1, 2, 3].map((hop) => {
            const hopNodes = radialData.nodes.filter((n) => n.hop === hop);
            if (hopNodes.length === 0) return null;

            return (
              <div key={hop} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--text-secondary)] uppercase">
                  <span>
                    {hop === 0 ? "🎯 Origin of Change (Hop 0)" : hop === 1 ? "⚡ Direct Callers (Hop 1)" : `🔗 Indirect Dependents (Hop ${hop})`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--bg-card-hover)] border border-[var(--border-color)]">
                    {hopNodes.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {hopNodes.map((n) => {
                    const isSelected = selectedNodeId === n.id;
                    const colors = getNodeTypeColor(n.type);
                    return (
                      <div
                        key={n.id}
                        onClick={() => onSelectNode(n)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? "bg-[#7C5CFC]/15 border-[#7C5CFC] shadow-xs"
                            : "bg-[var(--bg-card-hover)] border-[var(--border-color)] hover:border-[#7C5CFC]/50"
                        }`}
                      >
                        <div className={`p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] ${colors.text}`}>
                          {getNodeIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--text-primary)] truncate text-xs">
                              {n.name}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-secondary)] uppercase">
                              {n.type}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-[var(--text-secondary)] truncate mt-1">
                            {n.repositoryName} • {n.filePath}:{n.line}
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-1 truncate">
                            {n.item.reason}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
