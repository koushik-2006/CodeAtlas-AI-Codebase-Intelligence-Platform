"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  ExternalLink,
  Layers,
  ArrowRight,
  FileCode,
  Globe,
  Server,
  Database,
  TestTube2,
  AlertTriangle,
  Copy,
  Check,
  Network,
} from "lucide-react";
import { RadialGraphNode, ImpactSeverity, AffectedItemType } from "@/types/impact";
import { Button } from "@/components/ui/Button";

interface AffectedNodeSidePanelProps {
  node: RadialGraphNode | null;
  onClose: () => void;
  className?: string;
}

export function AffectedNodeSidePanel({
  node,
  onClose,
  className = "",
}: AffectedNodeSidePanelProps) {
  const [copied, setCopied] = useState(false);

  if (!node) return null;

  const getSeverityBadgeClass = (severity: ImpactSeverity) => {
    switch (severity) {
      case "Critical":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      case "High":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "Medium":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      default:
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
  };

  const handleCopyLocation = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(`${node.filePath}:${node.line}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <aside
      className={`w-full xl:w-96 shrink-0 flex flex-col bg-[var(--bg-card)] border-l border-[var(--border-color)] overflow-hidden shadow-lg animate-in slide-in-from-right duration-200 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityBadgeClass(
                node.severity
              )}`}
            >
              {node.severity} Severity
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] uppercase">
              Hop {node.hop} • {node.type}
            </span>
          </div>
          <h2 className="text-base font-bold text-[var(--text-primary)] truncate">
            {node.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Details */}
      <div className="p-4 overflow-y-auto flex-1 space-y-5 text-xs">
        {/* File and Repository Info */}
        <div className="p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[var(--text-secondary)]">Repository:</span>
            <strong className="text-[var(--text-primary)]">{node.repositoryName}</strong>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[var(--text-secondary)]">Location:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-primary)] font-bold">
                {node.filePath}:{node.line}
              </span>
              <button
                type="button"
                onClick={handleCopyLocation}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Copy file:line"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="pt-1.5 border-t border-[var(--border-color)]/50 text-[11px] text-[var(--text-secondary)] leading-relaxed">
            {node.item.reason}
          </div>
        </div>

        {/* Step-by-Step Dependency Chain Path */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase">
            <span>Dependency Ripple Chain:</span>
            <span className="text-[#7C5CFC]">{node.item.path?.length || 1} hop(s)</span>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border-color)] font-mono text-[11px]">
            {node.item.path && node.item.path.length > 0 ? (
              node.item.path.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 py-1">
                  <div className="w-4 h-4 rounded-full bg-[#7C5CFC]/20 text-[#7C5CFC] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)] truncate">
                      <span>{step.fromName}</span>
                      <ArrowRight className="w-3 h-3 text-[#7C5CFC] shrink-0" />
                      <span className="text-[#7C5CFC]">{step.toName}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                      {step.relationship} • {step.file}:{step.line}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-[var(--text-secondary)] italic">
                Direct origin target of change (Hop 0).
              </div>
            )}
          </div>
        </div>

        {/* Code Preview Snippet */}
        {node.item.codePreview && (
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase">
              Target Code Context:
            </span>
            <pre className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-primary)] overflow-x-auto leading-relaxed max-h-48">
              <code>{node.item.codePreview}</code>
            </pre>
          </div>
        )}

        {/* Quick Action Navigation Buttons */}
        <div className="pt-2 space-y-2">
          <Link
            href={`/repositories/${node.repositoryId}?file=${encodeURIComponent(node.filePath)}`}
            className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-[#7C5CFC] hover:text-[#7C5CFC] transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Open in Repository Code Viewer</span>
            <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
          </Link>

          <Link
            href={`/architecture?repo=${node.repositoryId}&level=files&node=file-${node.filePath.replace(/[^a-zA-Z0-9]/g, "-")}`}
            className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold bg-[#7C5CFC]/10 border border-[#7C5CFC]/30 text-[#7C5CFC] hover:bg-[#7C5CFC]/20 transition-colors"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Show on Architecture Graph</span>
            <ArrowRight className="w-3 h-3 ml-auto opacity-70" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

