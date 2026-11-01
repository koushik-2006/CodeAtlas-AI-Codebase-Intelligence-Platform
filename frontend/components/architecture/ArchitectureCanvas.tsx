"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  ReactFlowInstance,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "@/hooks/useTheme";
import { ArchitectureNode, ArchitectureEdge, ArchitectureLevel } from "@/types/architecture";
import { ArchitectureCustomNode } from "./ArchitectureCustomNode";
import {
  ChevronRight,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Activity,
  Route,
  Compass,
  X,
} from "lucide-react";

interface ArchitectureCanvasProps {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  selectedNodeId: string;
  onSelectNode: (nodeId: string) => void;
  onDrillDown: (nodeId: string, nodeType: string) => void;
  breadcrumbPath: Array<{ label: string; filterModule?: string; filterFile?: string; level: ArchitectureLevel }>;
  onBreadcrumbClick: (idx: number) => void;
  highlightedNodeIds?: string[];
  highlightedEdgeIds?: string[];
  sizeMode?: "loc" | "fanIn";
  onNodeDragStop?: (nodeId: string, x: number, y: number) => void;
  onShowNeighborhood?: (nodeId: string) => void;
  onFindPathFromNode?: (nodeId: string) => void;
  onOpenFile?: (filePath: string) => void;
  onExplainNode?: (nodeId: string) => void;
  onAnalyzeImpact?: (node: ArchitectureNode) => void;
}

const nodeTypes: any = {
  architectureNode: ArchitectureCustomNode,
};

export function ArchitectureCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onDrillDown,
  breadcrumbPath,
  onBreadcrumbClick,
  highlightedNodeIds = [],
  highlightedEdgeIds = [],
  sizeMode = "loc",
  onNodeDragStop,
  onShowNeighborhood,
  onFindPathFromNode,
  onOpenFile,
  onExplainNode,
  onAnalyzeImpact,
}: ArchitectureCanvasProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // Hover state for neighbor dimming
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    node: ArchitectureNode | null;
  }>({ visible: false, x: 0, y: 0, node: null });

  const activeFocusId = hoveredNodeId || selectedNodeId;

  // Neighbors of active focused node
  const activeNeighbors = useMemo(() => {
    if (!activeFocusId) return null;
    const neighbors = new Set<string>([activeFocusId]);
    edges.forEach((e) => {
      if (e.source === activeFocusId) neighbors.add(e.target);
      if (e.target === activeFocusId) neighbors.add(e.source);
    });
    return neighbors;
  }, [activeFocusId, edges]);

  const highlightedSet = useMemo(() => new Set(highlightedNodeIds), [highlightedNodeIds]);
  const highlightedEdgeSet = useMemo(() => new Set(highlightedEdgeIds), [highlightedEdgeIds]);

  // Convert ArchitectureNode to ReactFlow Node
  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((n) => {
      const isSelected = selectedNodeId === n.id;
      const isHighlighted = highlightedSet.has(n.id);
      const isDimmed =
        (activeNeighbors !== null && !activeNeighbors.has(n.id) && !isHighlighted) ||
        (highlightedNodeIds.length > 0 && !isHighlighted);

      return {
        id: n.id,
        type: "architectureNode",
        position: { x: n.x ?? 100, y: n.y ?? 100 },
        data: {
          ...n,
          sizeMode,
          isSelected,
          isHighlighted,
          isDimmed,
          onDrillDown: (id: string, type: string) => onDrillDown(id, type),
        },
      };
    });
  }, [nodes, selectedNodeId, highlightedSet, activeNeighbors, highlightedNodeIds, sizeMode, onDrillDown]);

  // Convert ArchitectureEdge to ReactFlow Edge
  const flowEdges: Edge[] = useMemo(() => {
    return edges.map((e) => {
      const isPath = highlightedSet.has(e.source) && highlightedSet.has(e.target);
      const isSpecialEdge = highlightedEdgeSet.has(e.id);
      const isConnectedToFocus =
        activeFocusId ? e.source === activeFocusId || e.target === activeFocusId : true;

      let strokeColor = isDark ? "#7C5CFC" : "#6C4DFF";
      let strokeWidth = Math.min(4, Math.max(1.5, (e.referencesCount || 1) * 0.8));

      if (e.isViolation || e.isCycle || isSpecialEdge) {
        strokeColor = "#EF4444";
        strokeWidth = 2.5;
      } else if (isPath) {
        strokeColor = "#F59E0B";
        strokeWidth = 3;
      }

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        animated: isPath || e.isCycle,
        style: {
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: e.type === "external" ? "5,5" : undefined,
          opacity: activeNeighbors && !isConnectedToFocus && !isPath ? 0.15 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 14,
          height: 14,
        },
      };
    });
  }, [edges, highlightedSet, highlightedEdgeSet, activeFocusId, activeNeighbors, isDark]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(flowNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setRfNodes(flowNodes);
  }, [flowNodes, setRfNodes]);

  useEffect(() => {
    setRfEdges(flowEdges);
  }, [flowEdges, setRfEdges]);

  // Handle node drag completion
  const handleNodeDragStop = useCallback(
    (_event: any, node: any) => {
      onNodeDragStop?.(node.id, Math.round(node.position.x), Math.round(node.position.y));
    },
    [onNodeDragStop]
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: any, node: any) => {
      setContextMenu({ visible: false, x: 0, y: 0, node: null });
      onSelectNode(node.id);
    },
    [onSelectNode]
  );

  // Handle node right click / context menu
  const handleNodeContextMenu = useCallback(
    (event: any, node: any) => {
      event.preventDefault();
      const archNode = nodes.find((n) => n.id === node.id) || null;
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        node: archNode,
      });
      onSelectNode(node.id);
    },
    [nodes, onSelectNode]
  );

  // Close context menu on background click
  const handlePaneClick = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
  }, []);

  return (
    <div
      className="relative w-full h-full min-h-[580px] rounded-2xl border border-[var(--border-color)] overflow-hidden bg-[var(--bg-card)] flex flex-col shadow-sm"
      onClick={handlePaneClick}
    >
      {/* Breadcrumb Bar */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-card-hover)] text-xs font-mono">
        <span className="text-[var(--text-secondary)] font-bold">Architecture</span>
        {breadcrumbPath.map((item, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <button
              type="button"
              onClick={() => onBreadcrumbClick(idx)}
              className={`hover:text-[#7C5CFC] transition-colors truncate max-w-[200px] ${
                idx === breadcrumbPath.length - 1 ? "font-bold text-[#7C5CFC]" : "text-[var(--text-secondary)]"
              }`}
            >
              {item.label}
            </button>
          </React.Fragment>
        ))}

        {breadcrumbPath.length > 1 && (
          <button
            type="button"
            onClick={() => onBreadcrumbClick(breadcrumbPath.length - 2)}
            className="ml-auto flex items-center gap-1 text-[11px] text-[#7C5CFC] hover:underline font-bold"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Up one level</span>
          </button>
        )}
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 w-full h-full min-h-[520px] relative">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onNodeContextMenu={handleNodeContextMenu}
          onNodeMouseEnter={(_e, node) => setHoveredNodeId(node.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          onNodeDragStop={handleNodeDragStop}
          onInit={setRfInstance}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          className="transition-colors"
        >
          <Background
            color={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
            gap={24}
            size={1.5}
          />
          <Controls
            className="!bg-[var(--bg-card)] !border-[var(--border-color)] !shadow-md !rounded-xl overflow-hidden [&>button]:!bg-transparent [&>button]:!border-b-[var(--border-color)] [&>button]:!text-[var(--text-primary)]"
          />
          <MiniMap
            nodeColor={(n: any) => n.data?.color || "#7C5CFC"}
            maskColor={isDark ? "rgba(11, 16, 32, 0.75)" : "rgba(248, 250, 252, 0.75)"}
            className="!bg-[var(--bg-card)] !border !border-[var(--border-color)] !rounded-xl !overflow-hidden !shadow-md"
            style={{ width: 130, height: 85 }}
          />
        </ReactFlow>
      </div>

      {/* Right-Click / Context Menu */}
      {contextMenu.visible && contextMenu.node && (
        <div
          style={{
            top: `${Math.min(window.innerHeight - 200, contextMenu.y)}px`,
            left: `${Math.min(window.innerWidth - 220, contextMenu.x)}px`,
          }}
          className="fixed z-50 w-52 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-1 text-xs space-y-0.5 animate-in fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] truncate">
            {contextMenu.node.label}
          </div>

          <button
            type="button"
            onClick={() => {
              onShowNeighborhood?.(contextMenu.node!.id);
              setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] flex items-center gap-2"
          >
            <Compass className="w-3.5 h-3.5 text-[#7C5CFC]" />
            <span>Show Neighborhood</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onFindPathFromNode?.(contextMenu.node!.id);
              setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] flex items-center gap-2"
          >
            <Route className="w-3.5 h-3.5 text-[#7C5CFC]" />
            <span>Find Path From Here</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenFile?.(contextMenu.node!.file);
              setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] flex items-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#7C5CFC]" />
            <span>Open Source File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onExplainNode?.(contextMenu.node!.id);
              setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7C5CFC]" />
            <span>Explain with AI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onAnalyzeImpact?.(contextMenu.node!);
              setContextMenu({ visible: false, x: 0, y: 0, node: null });
            }}
            className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] flex items-center gap-2"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Analyze Change Impact</span>
          </button>
        </div>
      )}
    </div>
  );
}
