"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import City from "@/components/City";
import { ArchitectureNode, ArchitectureEdge, ArchitectureNodeType, ArchitectureRelationshipType } from "@/types/architecture";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Filter,
  Layers,
  Sparkles,
  Move,
  MapPin,
  HelpCircle,
} from "lucide-react";

interface ArchitectureCanvasProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  viewStyle: "graph" | "city";
  searchQuery: string;
  onSearchChange: (q: string) => void;
  highlightedNodeIds?: string[];
}

export function ArchitectureCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  viewStyle,
  searchQuery,
  onSearchChange,
  highlightedNodeIds = [],
}: ArchitectureCanvasProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging State
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter states
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [selectedRelFilter, setSelectedRelFilter] = useState<string>("all");
  const [showMinimap, setShowMinimap] = useState<boolean>(true);

  // Initialize node positions when nodes change
  useEffect(() => {
    const initialPositions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n, idx) => {
      initialPositions[n.id] = {
        x: n.x ?? (100 + (idx % 4) * 200),
        y: n.y ?? (80 + Math.floor(idx / 4) * 120),
      };
    });
    setNodePositions(initialPositions);
  }, [nodes]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.15, 2.2));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.15, 0.45));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };
  const handleFitToScreen = () => {
    setZoomLevel(0.92);
    setPanOffset({ x: 20, y: 20 });
  };

  // Canvas Panning Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if not dragging a node
    if (draggedNodeId) return;
    setIsPanning(true);
    startPanRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      // Calculate new node coordinates taking canvas zoom & pan into account
      const currentX = (e.clientX - panOffset.x - dragOffsetRef.current.x) / zoomLevel;
      const currentY = (e.clientY - panOffset.y - dragOffsetRef.current.y) / zoomLevel;

      setNodePositions((prev) => ({
        ...prev,
        [draggedNodeId]: { x: Math.round(currentX), y: Math.round(currentY) },
      }));
    } else if (isPanning) {
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

  // Node Drag Start Handler
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggedNodeId(nodeId);
    onSelectNode(nodeId);

    const pos = nodePositions[nodeId] || { x: 100, y: 100 };
    dragOffsetRef.current = {
      x: e.clientX - panOffset.x - pos.x * zoomLevel,
      y: e.clientY - panOffset.y - pos.y * zoomLevel,
    };
  };

  // Filtering Logic
  const queryLower = searchQuery.toLowerCase().trim();
  const matchedNodeIds = new Set(
    nodes
      .filter((n) => {
        const matchesQuery =
          !queryLower ||
          n.label.toLowerCase().includes(queryLower) ||
          n.file.toLowerCase().includes(queryLower) ||
          n.type.toLowerCase().includes(queryLower);

        const matchesType =
          selectedTypeFilter === "all" || n.type.toLowerCase().includes(selectedTypeFilter.toLowerCase());

        return matchesQuery && matchesType;
      })
      .map((n) => n.id)
  );

  // Directly connected node IDs for focus highlighting
  const connectedNodeIds = new Set<string>();
  if (selectedNodeId) {
    connectedNodeIds.add(selectedNodeId);
    edges.forEach((e) => {
      if (e.source === selectedNodeId) connectedNodeIds.add(e.target);
      if (e.target === selectedNodeId) connectedNodeIds.add(e.source);
    });
  }

  // Filter edges
  const filteredEdges = edges.filter((e) => {
    if (selectedRelFilter === "all") return true;
    return e.type?.toLowerCase().includes(selectedRelFilter.toLowerCase());
  });

  const highlightedSet = new Set(highlightedNodeIds);

  return (
    <div
      className={`app-card flex flex-col justify-between relative overflow-hidden transition-all shadow-sm rounded-2xl border ${
        isDark ? "bg-[#0D111B] border-[#242B39]" : "bg-white border-[#E8E5F4]"
      }`}
    >
      {/* Canvas Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 border-b border-[var(--border-color)] bg-[var(--bg-page)]/40 shrink-0">
        {/* Left: Search input */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search files, functions, APIs..."
              aria-label="Filter architecture nodes"
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium border outline-none ${
                isDark
                  ? "bg-[#0A0F19] border-[#242B39] text-[#F3F5FA] focus:border-[#29D3C2]"
                  : "bg-white border-[#E8E5F4] text-[#19143D] focus:border-[#6C4DFF]"
              }`}
            />
          </div>
        </div>

        {/* Center: Filter by Entity Type & Relationship */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className={`py-1 px-2.5 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
              isDark
                ? "bg-[#0A0F19] border-[#30363D] text-[#E6EDF3]"
                : "bg-white border-[#E5E5E0] text-[#1E2022]"
            }`}
            aria-label="Filter by Entity Type"
          >
            <option value="all">All Entity Types</option>
            <option value="Function">Functions</option>
            <option value="API endpoint">API Endpoints</option>
            <option value="Service">Services</option>
            <option value="Database">Database Models</option>
            <option value="Test">Tests</option>
            <option value="Class">Classes</option>
            <option value="External">Dependencies</option>
          </select>

          <select
            value={selectedRelFilter}
            onChange={(e) => setSelectedRelFilter(e.target.value)}
            className={`py-1 px-2.5 rounded-lg text-xs font-bold border outline-none cursor-pointer hidden sm:block ${
              isDark
                ? "bg-[#0A0F19] border-[#30363D] text-[#E6EDF3]"
                : "bg-white border-[#E5E5E0] text-[#1E2022]"
            }`}
            aria-label="Filter by Relationship Type"
          >
            <option value="all">All Relationships</option>
            <option value="Calls">Function Calls</option>
            <option value="API">API Calls</option>
            <option value="Data">Data Access</option>
            <option value="Test">Test Coverage</option>
          </select>
        </div>

        {/* Right: Zoom & Canvas Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleFitToScreen}
            className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
            title="Fit to Screen"
            aria-label="Fit to screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
            title="Reset View"
            aria-label="Reset view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[10px] text-[var(--text-secondary)] ml-1">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        className="relative flex-1 min-h-[500px] overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {viewStyle === "city" ? (
          <div className="my-auto py-4">
            <City
              selected={selectedNodeId}
              onPick={onSelectNode}
              className="w-full max-h-[500px] mx-auto"
              forceMode={isDark ? "dark" : "light"}
            />
          </div>
        ) : (
          /* Graph View: SVG Interactive DAG */
          <svg
            className="w-full h-full min-h-[500px]"
            viewBox="0 0 1000 500"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: isPanning || draggedNodeId ? "none" : "transform 0.1s ease-out",
            }}
          >
            <defs>
              <marker
                id="arrowhead-sync"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill={isDark ? "#29D3C2" : "#6C4DFF"}
                  opacity="0.85"
                />
              </marker>
              <marker
                id="arrowhead-test"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#FF5A5F" opacity="0.85" />
              </marker>
              <marker
                id="arrowhead-path"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#FFC53D" opacity="1" />
              </marker>
            </defs>

            {/* Background Grid Dots */}
            <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle
                cx="2"
                cy="2"
                r="1"
                fill={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid-dots)" />

            {/* Render Edges */}
            {filteredEdges.map((edge) => {
              const sourcePos = nodePositions[edge.source] || { x: 100, y: 100 };
              const targetPos = nodePositions[edge.target] || { x: 300, y: 200 };

              const isPathEdge =
                highlightedSet.has(edge.source) && highlightedSet.has(edge.target);
              const isConnected =
                edge.source === selectedNodeId || edge.target === selectedNodeId;
              const isDimmed =
                (selectedNodeId && !isConnected && !isPathEdge) ||
                (highlightedNodeIds.length > 0 && !isPathEdge);

              const sx = sourcePos.x;
              const sy = sourcePos.y;
              const tx = targetPos.x;
              const ty = targetPos.y;

              const mx = (sx + tx) / 2;
              const pathData = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;

              return (
                <g key={edge.id} opacity={isDimmed ? 0.12 : 1} className="transition-opacity">
                  <path
                    d={pathData}
                    fill="none"
                    stroke={
                      isPathEdge
                        ? "#FFC53D"
                        : edge.type === "Test coverage"
                        ? "#FF5A5F"
                        : isDark
                        ? "#29D3C2"
                        : "#6C4DFF"
                    }
                    strokeWidth={isPathEdge ? 3.5 : isConnected ? 2.5 : 1.5}
                    strokeDasharray={edge.type === "Test coverage" ? "4 3" : undefined}
                    markerEnd={
                      isPathEdge
                        ? "url(#arrowhead-path)"
                        : edge.type === "Test coverage"
                        ? "url(#arrowhead-test)"
                        : "url(#arrowhead-sync)"
                    }
                  />
                  {edge.label && (
                    <text
                      x={mx}
                      y={(sy + ty) / 2 - 8}
                      textAnchor="middle"
                      fill={isDark ? "#8B949E" : "#71717A"}
                      fontSize="9"
                      fontFamily="monospace"
                      className="select-none pointer-events-none"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isConnected = connectedNodeIds.has(node.id);
              const isMatch = matchedNodeIds.has(node.id);
              const isPathNode = highlightedSet.has(node.id);
              const isDimmed =
                (!isMatch && !isSelected) ||
                (selectedNodeId && !isConnected && !isPathNode) ||
                (highlightedNodeIds.length > 0 && !isPathNode);

              const pos = nodePositions[node.id] || { x: 100, y: 100 };
              const width = 145;
              const height = 54;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x - width / 2}, ${pos.y - height / 2})`}
                  onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(node.id);
                  }}
                  opacity={isDimmed ? 0.2 : 1}
                  className="cursor-move transition-all"
                >
                  {/* Node Background Rect */}
                  <rect
                    width={width}
                    height={height}
                    rx="12"
                    fill={isDark ? "#111725" : "#FFFFFF"}
                    stroke={
                      isPathNode
                        ? "#FFC53D"
                        : isSelected
                        ? isDark
                          ? "#29D3C2"
                          : "#6C4DFF"
                        : isDark
                        ? "#242B39"
                        : "#E8E5F4"
                    }
                    strokeWidth={isPathNode ? 3 : isSelected ? 2.5 : 1.5}
                    filter={
                      isPathNode
                        ? "drop-shadow(0 0 10px rgba(255,197,61,0.5))"
                        : isSelected
                        ? isDark
                          ? "drop-shadow(0 0 10px rgba(41,211,194,0.35))"
                          : "drop-shadow(0 0 10px rgba(108,77,255,0.25))"
                        : undefined
                    }
                  />

                  {/* Left Category Indicator Stripe */}
                  <rect
                    x="0"
                    y="0"
                    width="4.5"
                    height={height}
                    rx="2"
                    fill={isPathNode ? "#FFC53D" : node.color || "#6C4DFF"}
                  />

                  {/* Node Type Label */}
                  <text
                    x="12"
                    y="18"
                    fill={isDark ? "#8B949E" : "#6E6B7B"}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    letterSpacing="0.05em"
                  >
                    {node.type.toUpperCase()}
                  </text>

                  {/* Node Label / Name */}
                  <text
                    x="12"
                    y="36"
                    fill={isDark ? "#F3F5FA" : "#19143D"}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                  >
                    {node.label.length > 18 ? node.label.slice(0, 16) + "..." : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Compact Minimap */}
        {showMinimap && viewStyle === "graph" && (
          <div
            className={`absolute bottom-3 right-3 w-32 h-20 rounded-xl border p-1 shadow-md pointer-events-none select-none ${
              isDark ? "bg-[#0A0F19]/90 border-[#242B39]" : "bg-white/90 border-[#E8E5F4]"
            }`}
          >
            <div className="w-full h-full relative overflow-hidden">
              <svg viewBox="0 0 1000 500" className="w-full h-full">
                {nodes.map((n) => {
                  const pos = nodePositions[n.id] || { x: 100, y: 100 };
                  return (
                    <circle
                      key={n.id}
                      cx={pos.x}
                      cy={pos.y}
                      r="12"
                      fill={selectedNodeId === n.id ? "#29D3C2" : n.color || "#6C4DFF"}
                      opacity="0.8"
                    />
                  );
                })}
              </svg>
              <div
                className="absolute inset-0 border border-teal-500/40 rounded pointer-events-none"
                style={{
                  transform: `scale(${1 / zoomLevel})`,
                  transformOrigin: "top left",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Graph Legend & Entity Types */}
      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-page)]/50 shrink-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[var(--text-secondary)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-[var(--text-primary)]">Node Types:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#6C4DFF]" /> Function
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FF8C42]" /> API Endpoint
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2FD6A0]" /> Service
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#29D3C2]" /> Database
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FF5A5F]" /> Test
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#8B7CFF]" /> Class / Source
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#A0AEC0]" /> External
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-[var(--text-primary)]">Edges:</span>
            <span>&rarr; Calls / Imports</span>
            <span className="text-[#FF5A5F]">&bull;&bull;&bull; Test Coverage</span>
            <span className="text-[#FFC53D] font-bold">&rarr; Traced Path</span>
          </div>
        </div>
      </div>
    </div>
  );
}
