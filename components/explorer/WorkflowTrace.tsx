"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { WorkflowTraceData, WorkflowNode } from "@/types/codelens";
import {
  GitBranch,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Layers,
  Database,
  ArrowRight,
  Info,
  Server,
  Component as ComponentIcon,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";

interface WorkflowTraceProps {
  trace: WorkflowTraceData;
  onSelectNode?: (node: WorkflowNode) => void;
}

export function WorkflowTrace({ trace, onSelectNode }: WorkflowTraceProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    trace.nodes.find((n) => n.isSnippetLocation)?.id || trace.nodes[0]?.id || ""
  );
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedNode = trace.nodes.find((n) => n.id === selectedNodeId) || trace.nodes[0];

  const getNodeIcon = (type: WorkflowNode["nodeType"]) => {
    switch (type) {
      case "caller":
        return ComponentIcon;
      case "endpoint":
        return Server;
      case "function":
        return FileCode;
      case "service":
        return Layers;
      case "database":
        return Database;
      case "test":
        return ShieldCheck;
      default:
        return FileCode;
    }
  };

  const getNodeColor = (type: WorkflowNode["nodeType"], isSnippet?: boolean) => {
    if (isSnippet) {
      return isDark ? "border-[#29D3C2] text-[#29D3C2] bg-[#29D3C2]/10" : "border-[#6C4DFF] text-[#6C4DFF] bg-[#6C4DFF]/10";
    }
    switch (type) {
      case "caller":
        return "border-amber-500/40 text-amber-500 bg-amber-500/5";
      case "endpoint":
        return "border-blue-500/40 text-blue-500 bg-blue-500/5";
      case "function":
        return "border-purple-500/40 text-purple-500 bg-purple-500/5";
      case "service":
        return "border-emerald-500/40 text-emerald-500 bg-emerald-500/5";
      case "database":
        return "border-rose-500/40 text-rose-500 bg-rose-500/5";
      case "test":
        return "border-teal-500/40 text-teal-500 bg-teal-500/5";
      default:
        return "border-[var(--border-color)] text-[var(--text-secondary)]";
    }
  };

  return (
    <div
      className={`mt-6 rounded-3xl border overflow-hidden shadow-sm transition-all ${
        isDark ? "bg-[#0D1117] border-[#30363D]" : "bg-white border-[#E8E5F4]"
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4 bg-[var(--bg-page)]/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#8B7CFF]/15 text-[#8B7CFF] flex items-center justify-center font-bold">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)]">
                End-to-End Workflow Trace
              </h3>
              <span className="font-mono text-[10px] uppercase font-bold text-[#8B7CFF] bg-[#8B7CFF]/10 px-2.5 py-0.5 rounded-full border border-[#8B7CFF]/20">
                Action B · Call Graph
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              Verified in repository: <strong className="text-[var(--text-primary)]">{trace.repositoryId}</strong> ({trace.confidenceLabel})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {trace.matchedFile && (
            <Link
              href={`/repositories/${trace.repositoryId}?file=${encodeURIComponent(trace.matchedFile)}&line=18`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[var(--primary)] text-white hover:opacity-90 shadow-sm"
            >
              <span>Repository Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          <Link
            href={`/architecture?repo=${trace.repositoryId}&node=node-login-user`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-colors"
          >
            <span>Architecture Graph</span>
          </Link>

          <Link
            href={`/change-impact?repo=${trace.repositoryId}&symbol=loginUser&file=${encodeURIComponent(trace.matchedFile || 'src/services/auth.ts')}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-amber-500 transition-colors"
          >
            <span>Analyze Impact</span>
          </Link>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Summary Description */}
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {trace.summary}
        </p>

        {/* Compact SVG Workflow DAG */}
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[var(--text-secondary)] mb-4 flex items-center justify-between">
            <span>Dependency & Call Path Visualization</span>
            <span className="text-[11px] font-normal lowercase text-[var(--text-secondary)]">
              Click any node to inspect source line receipts
            </span>
          </h4>

          {/* Desktop/Tablet Horizontal Pipeline */}
          <div className="hidden md:flex items-center justify-between gap-2 overflow-x-auto p-4 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)]">
            {trace.nodes.map((node, index) => {
              const Icon = getNodeIcon(node.nodeType);
              const isSelected = selectedNodeId === node.id;
              const colorClasses = getNodeColor(node.nodeType, node.isSnippetLocation);

              return (
                <div key={node.id} className="flex items-center shrink-0">
                  {/* Node Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      onSelectNode?.(node);
                    }}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all min-w-[145px] max-w-[165px] ${
                      isSelected
                        ? isDark
                          ? "ring-2 ring-[#29D3C2] bg-[#161B22] shadow-lg scale-102"
                          : "ring-2 ring-[#6C4DFF] bg-white shadow-lg scale-102"
                        : isDark
                        ? "bg-[#111725] hover:bg-[#161F32]"
                        : "bg-white hover:bg-[#FAF9FF]"
                    } ${colorClasses}`}
                  >
                    {node.isSnippetLocation && (
                      <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase bg-[var(--primary)] text-white">
                        Snippet
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono uppercase font-bold opacity-80">
                        {node.nodeType}
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-[var(--text-primary)] truncate" title={node.label}>
                      {node.label}
                    </h5>
                    <p className="text-[10px] font-mono text-[var(--text-secondary)] truncate mt-0.5">
                      {node.sourceFile}
                    </p>
                  </button>

                  {/* Flow Arrow */}
                  {index < trace.nodes.length - 1 && (
                    <div className="px-2 flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-60">
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Vertical Pipeline */}
          <div className="md:hidden space-y-3">
            {trace.nodes.map((node, index) => {
              const Icon = getNodeIcon(node.nodeType);
              const isSelected = selectedNodeId === node.id;
              const colorClasses = getNodeColor(node.nodeType, node.isSnippetLocation);

              return (
                <div key={node.id} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      onSelectNode?.(node);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? isDark
                          ? "ring-2 ring-[#29D3C2] bg-[#161B22]"
                          : "ring-2 ring-[#6C4DFF] bg-white"
                        : isDark
                        ? "bg-[#111725]"
                        : "bg-white"
                    } ${colorClasses}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-xs text-[var(--text-primary)]">
                            {node.label}
                          </h5>
                          <span className="text-[9px] font-mono uppercase font-bold opacity-75">
                            {node.nodeType}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[var(--text-secondary)]">
                          {node.sourceFile}:{node.line}
                        </p>
                      </div>
                    </div>
                    {node.isSnippetLocation && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold bg-[var(--primary)] text-white">
                        Snippet
                      </span>
                    )}
                  </button>

                  {index < trace.nodes.length - 1 && (
                    <div className="flex justify-center text-[var(--text-secondary)] opacity-50">
                      &darr;
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Details Card */}
        {selectedNode && (
          <div className="p-5 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)]">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)] mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono uppercase font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded">
                  Node Inspector: {selectedNode.nodeType}
                </span>
                <h5 className="font-bold text-sm text-[var(--text-primary)]">
                  {selectedNode.label}
                </h5>
              </div>

              <Link
                href={`/repositories/${trace.repositoryId}?file=${encodeURIComponent(
                  selectedNode.sourceFile
                )}&line=${selectedNode.line || 1}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
              >
                <span>Jump to file in Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              <div>
                <span className="font-mono text-[10px] uppercase text-[var(--text-secondary)] block">
                  File Path
                </span>
                <code className="font-mono font-bold text-[var(--text-primary)] mt-0.5 block truncate">
                  {selectedNode.sourceFile}
                </code>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase text-[var(--text-secondary)] block">
                  Verified Line Range
                </span>
                <span className="font-mono font-bold text-[var(--text-primary)] mt-0.5 block">
                  {selectedNode.lineRange || `Line ${selectedNode.line}`}
                </span>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase text-[var(--text-secondary)] block">
                  AST Confidence
                </span>
                <span className="font-mono font-bold text-green-500 mt-0.5 block">
                  {selectedNode.confidence ? `${Math.round(selectedNode.confidence * 100)}% verified` : "Verified"}
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-[var(--text-secondary)] leading-relaxed">
              {selectedNode.description}
            </p>
          </div>
        )}

        {/* Test Coverage Verification */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              Verified Integration Test:{" "}
              <strong className="text-[var(--text-primary)]">{trace.testCoverageFile}</strong>
              {trace.testCoverageLine && ` (Line ${trace.testCoverageLine})`}
            </span>
          </div>

          <Link
            href={`/repositories/${trace.repositoryId}?file=${encodeURIComponent(trace.testCoverageFile || "tests/auth.test.ts")}&line=18`}
            className="text-xs font-bold text-[var(--primary)] hover:underline"
          >
            Inspect Test Case &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
