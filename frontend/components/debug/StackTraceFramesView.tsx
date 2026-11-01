"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Code2,
  Network,
  ChevronDown,
  ChevronRight,
  Info,
  Layers,
  FileCode,
  Filter,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ParsedStackTrace, ParsedStackFrame } from "@/types/debug";

interface StackTraceFramesViewProps {
  parsedTrace: ParsedStackTrace;
  repositoryId?: string;
  sourceRevision?: string;
}

export default function StackTraceFramesView({
  parsedTrace,
  repositoryId,
  sourceRevision,
}: StackTraceFramesViewProps) {
  const [expandedFrameIds, setExpandedFrameIds] = useState<Record<string, boolean>>({
    frame_1: true,
  });
  const [hideLibraryFrames, setHideLibraryFrames] = useState(false);

  const toggleFrame = (id: string) => {
    setExpandedFrameIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getRuntimeLabel = (rt: string) => {
    switch (rt) {
      case "nodejs":
        return "Node.js / V8";
      case "python":
        return "Python 3";
      case "go":
        return "Go Runtime";
      case "java":
        return "Java Virtual Machine";
      case "rust":
        return "Rust";
      case "ruby":
        return "Ruby";
      default:
        return "Standard Generic";
    }
  };

  const visibleFrames = hideLibraryFrames
    ? parsedTrace.frames.filter((f) => !f.isExternal)
    : parsedTrace.frames;

  const libraryFramesCount = parsedTrace.frames.filter((f) => f.isExternal).length;

  return (
    <div className="space-y-4">
      {/* Error Header Card */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-sm text-red-500">
                  {parsedTrace.errorType}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#7C5CFC]/15 text-[#7C5CFC] font-semibold">
                  {getRuntimeLabel(parsedTrace.runtime)}
                </span>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  {parsedTrace.verifiedFramesCount} verified / {parsedTrace.totalFrames} frames
                </span>
              </div>
              <p className="mt-1 text-xs font-mono text-[var(--text-primary)] break-words">
                {parsedTrace.errorMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Revision Mismatch Warning */}
        {parsedTrace.hasRevisionMismatchWarning && (
          <div className="mt-3 pt-3 border-t border-red-500/20 flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Revision Notice: </span>
              {parsedTrace.revisionWarningMessage}
            </div>
          </div>
        )}
      </div>

      {/* Frame Sequence Header with Library Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#7C5CFC]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Call Stack Frames & Resolved Source Snippets
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {libraryFramesCount > 0 && (
            <button
              type="button"
              onClick={() => setHideLibraryFrames(!hideLibraryFrames)}
              className="text-xs text-[var(--text-secondary)] hover:text-[#7C5CFC] flex items-center gap-1.5 transition-colors font-medium bg-[var(--bg-card)] border border-[var(--border-color)] px-2.5 py-1 rounded-lg"
            >
              {hideLibraryFrames ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-[#7C5CFC]" />
                  Show External Frames ({libraryFramesCount})
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Hide External Frames ({libraryFramesCount})
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2FD6A0]" /> In-App Code
            </span>
            <span className="flex items-center gap-1 ml-1">
              <span className="w-2 h-2 rounded-full bg-neutral-400" /> Library
            </span>
          </div>
        </div>
      </div>

      {/* Frames List */}
      <div className="space-y-2.5">
        {visibleFrames.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
            No frames available to display under current filter.
          </div>
        ) : (
          visibleFrames.map((frame) => {
            const isExpanded = !!expandedFrameIds[frame.id];
            const hasSnippet = frame.sourceSnippet && frame.sourceSnippet.lines.length > 0;

            return (
              <div
                key={frame.id}
                className={`border rounded-xl transition-all overflow-hidden bg-[var(--bg-card)] ${
                  frame.isVerified
                    ? "border-[#2FD6A0]/40 shadow-sm"
                    : frame.isExternal
                    ? "border-[var(--border-color)] opacity-75"
                    : "border-amber-500/30"
                }`}
              >
                {/* Frame Header Item */}
                <div
                  onClick={() => toggleFrame(frame.id)}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--bg-primary)]/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono font-bold w-6 h-6 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center shrink-0 text-[var(--text-secondary)]">
                      {frame.order}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)] truncate">
                          {frame.functionName || "<anonymous>"}
                        </span>
                        {frame.symbolName && frame.symbolName !== frame.functionName && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7C5CFC]/15 text-[#7C5CFC] font-mono">
                            symbol: {frame.symbolName}
                          </span>
                        )}
                        {frame.isVerified ? (
                          <Badge variant="mint">
                            <CheckCircle2 className="w-3 h-3 mr-0.5" /> Verified In-App
                          </Badge>
                        ) : frame.isExternal ? (
                          <Badge variant="gray">External Frame</Badge>
                        ) : (
                          <Badge variant="sun">Unresolved</Badge>
                        )}
                      </div>

                      <p className="font-mono text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                        {frame.normalizedPath || frame.filePath}
                        {frame.line !== undefined ? `:${frame.line}` : ""}
                        {frame.column !== undefined ? `:${frame.column}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Navigation Links if Verified */}
                    {frame.isVerified && repositoryId && (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/visual-explorer?repo=${repositoryId}&file=${encodeURIComponent(
                            frame.normalizedPath || frame.filePath
                          )}&line=${frame.line || 1}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#7C5CFC]/10 hover:bg-[#7C5CFC]/20 text-[#7C5CFC] transition-colors"
                          title="Open in Visual Code Explorer"
                        >
                          <FileCode className="w-3 h-3" />
                          <span>Open in Repo</span>
                        </Link>

                        {frame.symbolName && (
                          <Link
                            href={`/architecture?repo=${repositoryId}&symbol=${encodeURIComponent(
                              frame.symbolName
                            )}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#29D3C2]/10 hover:bg-[#29D3C2]/20 text-[#29D3C2] transition-colors"
                            title="Inspect in Architecture Graph"
                          >
                            <Network className="w-3 h-3" />
                            <span>Graph</span>
                          </Link>
                        )}
                      </div>
                    )}

                    <span className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Unresolved Explanation */}
                {!frame.isVerified && frame.unresolvedReason && (
                  <div className="px-4 py-2 bg-[var(--bg-primary)]/40 border-t border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] italic">
                    Reason: {frame.unresolvedReason}
                  </div>
                )}

                {/* Source Snippet Preview */}
                {hasSnippet && isExpanded && (
                  <div className="border-t border-[var(--border-color)] bg-[var(--bg-primary)] overflow-x-auto">
                    <div className="px-3 py-1.5 border-b border-[var(--border-color)] bg-[var(--bg-card)]/50 text-[10px] font-mono text-[var(--text-secondary)] flex items-center justify-between">
                      <span>Source Context: {frame.normalizedPath || frame.filePath}</span>
                      <span className="text-red-400 font-bold">Culprit Line: {frame.line}</span>
                    </div>
                    <pre className="p-3 text-[11px] font-mono leading-relaxed">
                      {frame.sourceSnippet?.lines.map((l) => (
                        <div
                          key={l.lineNumber}
                          className={`flex items-start gap-3 px-2 py-0.5 rounded ${
                            l.isHighlighted
                              ? "bg-red-500/15 text-red-400 font-semibold border-l-2 border-red-500"
                              : "text-[var(--text-primary)]"
                          }`}
                        >
                          <span className="w-8 shrink-0 text-right select-none text-[var(--text-secondary)]/60 font-mono text-[10px]">
                            {l.lineNumber}
                          </span>
                          <span className="whitespace-pre overflow-x-visible">{l.content || " "}</span>
                        </div>
                      ))}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
