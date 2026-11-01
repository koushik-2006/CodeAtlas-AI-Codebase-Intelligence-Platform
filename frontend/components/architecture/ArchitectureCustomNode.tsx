"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  FileCode,
  Folder,
  Layers,
  Code2,
  Box,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { ArchitectureNodeType, ArchitectureLayerName } from "@/types/architecture";
import { LAYER_COLORS } from "@/lib/demo/architecture-engine";

export interface ArchitectureNodeData {
  id: string;
  label: string;
  name?: string;
  type: ArchitectureNodeType | string;
  layer: ArchitectureLayerName | string;
  file: string;
  loc?: number;
  fanIn?: number;
  fanOut?: number;
  health?: "healthy" | "warning" | "violation";
  isCycleMember?: boolean;
  hasViolation?: boolean;
  color?: string;
  sizeMode?: "loc" | "fanIn";
  isDimmed?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  onDrillDown?: (id: string, type: string) => void;
}

export const ArchitectureCustomNode = memo((props: any) => {
  const { data, selected } = props;
  const nodeData = data as ArchitectureNodeData;
  const layer = (nodeData.layer || "Services") as string;
  const palette = LAYER_COLORS[layer] || LAYER_COLORS.Services;

  // Icon selection
  const getNodeIcon = () => {
    switch (nodeData.type) {
      case "layer":
        return <Layers className="w-3.5 h-3.5 shrink-0" />;
      case "module":
        return <Folder className="w-3.5 h-3.5 shrink-0" />;
      case "file":
      case "Source file":
        return <FileCode className="w-3.5 h-3.5 shrink-0" />;
      case "function":
      case "Function":
        return <Code2 className="w-3.5 h-3.5 shrink-0" />;
      case "class":
      case "Class":
        return <Box className="w-3.5 h-3.5 shrink-0" />;
      case "external":
        return <ExternalLink className="w-3.5 h-3.5 shrink-0" />;
      default:
        return <FileCode className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  // Health indicator
  const getHealthBadge = () => {
    if (nodeData.hasViolation || nodeData.isCycleMember) {
      return (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-500/15 text-red-400 border border-red-500/30"
          title={nodeData.isCycleMember ? "Member of circular dependency" : "Layer rule violation"}
        >
          <AlertOctagon className="w-2.5 h-2.5" />
          {nodeData.isCycleMember ? "Cycle" : "Violation"}
        </span>
      );
    }
    if (nodeData.health === "warning" || (nodeData.fanIn || 0) + (nodeData.fanOut || 0) > 4) {
      return (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30"
          title="High dependency coupling hub"
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          Hub
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] text-[#2FD6A0]">
        <CheckCircle2 className="w-2.5 h-2.5" />
      </span>
    );
  };

  // Dynamic width based on sizing toggle
  const sizeMultiplier =
    nodeData.sizeMode === "fanIn"
      ? Math.min(220, Math.max(160, 160 + (nodeData.fanIn || 0) * 12))
      : Math.min(220, Math.max(160, 160 + Math.round((nodeData.loc || 50) / 30)));

  const isSelected = selected || nodeData.isSelected;

  return (
    <div
      style={{ width: `${sizeMultiplier}px` }}
      onDoubleClick={() => nodeData.onDrillDown?.(nodeData.id, nodeData.type)}
      className={`relative rounded-xl border text-left transition-all cursor-pointer select-none overflow-hidden ${
        nodeData.isDimmed ? "opacity-25" : "opacity-100"
      } ${
        nodeData.isHighlighted
          ? "border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-400/20"
          : isSelected
          ? "border-[#7C5CFC] ring-2 ring-[#7C5CFC]/60 shadow-lg shadow-[#7C5CFC]/25"
          : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[#7C5CFC]/60 hover:shadow-md"
      }`}
    >
      {/* Handles for Flow connections */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[#7C5CFC] !border-none" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[#7C5CFC] !border-none" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[#7C5CFC] !border-none" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[#7C5CFC] !border-none" />

      {/* Layer Color Accent Stripe */}
      <div
        className="h-1.5 w-full"
        style={{
          backgroundColor: nodeData.hasViolation || nodeData.isCycleMember ? "#EF4444" : palette.hex,
        }}
      />

      <div className="p-2.5 space-y-1.5 bg-[var(--bg-card)]">
        {/* Top bar: Type + Layer pill + Health */}
        <div className="flex items-center justify-between text-[10px] gap-1">
          <div className="flex items-center gap-1 font-mono uppercase font-bold text-[var(--text-secondary)] truncate">
            {getNodeIcon()}
            <span className="truncate">{nodeData.type}</span>
          </div>
          {getHealthBadge()}
        </div>

        {/* Node Label / Name */}
        <div className="font-bold text-xs text-[var(--text-primary)] truncate" title={nodeData.label}>
          {nodeData.label}
        </div>

        {/* Bottom bar: Layer badge + Metrics */}
        <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)] text-[10px] font-mono text-[var(--text-secondary)]">
          <span
            className="px-1.5 py-0.5 rounded font-semibold truncate max-w-[85px]"
            style={{ backgroundColor: `${palette.hex}20`, color: palette.hex }}
          >
            {layer}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {nodeData.sizeMode === "fanIn" ? (
              <span title="Inbound connections (Fan-In)">↓{nodeData.fanIn ?? 0}</span>
            ) : (
              <span title="Lines of code">{nodeData.loc ?? 45} LOC</span>
            )}
            <span title="Outbound connections (Fan-Out)">↑{nodeData.fanOut ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ArchitectureCustomNode.displayName = "ArchitectureCustomNode";
