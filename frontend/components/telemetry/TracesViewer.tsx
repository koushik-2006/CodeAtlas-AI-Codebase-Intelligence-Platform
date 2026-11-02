"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import {
  Share2,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Code2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { DistributedTrace, TraceSpan } from "@/types/observability";

interface TracesViewerProps {
  traces: DistributedTrace[];
  selectedTraceId?: string | null;
}

const SERVICE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  "api-gateway": { bg: "bg-amber-500/10", text: "text-amber-400", bar: "bg-amber-400" },
  "auth-service": { bg: "bg-purple-500/10", text: "text-purple-400", bar: "bg-purple-400" },
  "payment-service": { bg: "bg-rose-500/10", text: "text-rose-400", bar: "bg-rose-500" },
  "fastapi-backend": { bg: "bg-cyan-500/10", text: "text-cyan-400", bar: "bg-cyan-400" },
  "shared-core-lib": { bg: "bg-indigo-500/10", text: "text-indigo-400", bar: "bg-indigo-400" },
  "db_pool": { bg: "bg-emerald-500/10", text: "text-emerald-400", bar: "bg-emerald-400" },
  "redis_cache": { bg: "bg-blue-500/10", text: "text-blue-400", bar: "bg-blue-400" },
};

export function TracesViewer({ traces, selectedTraceId: initialSelectedTraceId }: TracesViewerProps) {
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(() => {
    return initialSelectedTraceId || (traces.length > 0 ? traces[0].traceId : null);
  });

  useEffect(() => {
    if (initialSelectedTraceId) {
      setSelectedTraceId(initialSelectedTraceId);
    }
  }, [initialSelectedTraceId]);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-400" />
              Distributed Tracing & Request Lifecycles
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
              Simulated
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            End-to-end request latency waterfalls, parent-child span hierarchy, and timing breakdowns
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {traces.length} distributed traces recorded
        </span>
      </div>

      {traces.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          No distributed traces recorded yet. Execute API or AI requests to generate trace cascades.
        </div>
      ) : (
        <div className="space-y-3">
          {traces.map((trace) => {
            const isSelected = selectedTraceId === trace.traceId;
            const rootDuration = trace.durationMs || 1;

            return (
              <div
                key={trace.traceId}
                className={`rounded-lg border transition-colors ${
                  isSelected ? "border-indigo-500/50 bg-slate-800/60" : "border-white/5 bg-slate-800/30 hover:bg-slate-800/40"
                } p-3.5`}
              >
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer"
                  onClick={() => setSelectedTraceId(isSelected ? null : trace.traceId)}
                >
                  <div className="flex items-center gap-2.5">
                    <button className="text-slate-500 hover:text-slate-300">
                      {isSelected ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        {trace.status === "ok" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-slate-200">
                          {trace.rootSpanName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                          {trace.spanCount} {trace.spanCount === 1 ? "span" : "spans"}
                        </span>
                        {trace.durationMs > 1000 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <AlertTriangle className="w-2.5 h-2.5" /> High Latency
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Trace ID: <strong className="text-slate-400">{trace.traceId}</strong> •{" "}
                        {new Date(trace.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {trace.durationMs}ms
                    </span>
                  </div>
                </div>

                {/* Waterfall breakdown */}
                {isSelected && (
                  <div className="mt-4 pt-3.5 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <span>Span Hierarchy & Waterfall Duration</span>
                      <span className="text-slate-500 font-mono text-[10px]">Total: {trace.durationMs}ms</span>
                    </div>

                    <div className="space-y-2">
                      {trace.spans.map((span) => {
                        const spanDuration = span.durationMs || 1;
                        const firstSpanStartTime = trace.spans[0]?.startTime || span.startTime;
                        const offsetPct = Math.min(
                          90,
                          Math.max(
                            0,
                            ((span.startTime - firstSpanStartTime) / rootDuration) * 100
                          )
                        );
                        const widthPct = Math.min(100 - offsetPct, Math.max(8, (spanDuration / rootDuration) * 100));
                        const isSlow = spanDuration > 100;

                        const sCol = SERVICE_COLORS[span.service] || {
                          bg: "bg-slate-700/30",
                          text: "text-slate-300",
                          bar: "bg-indigo-400",
                        };

                        const codeFile =
                          span.attributes?.file ||
                          span.attributes?.["code.filepath"] ||
                          span.attributes?.sourceFile;
                        const codeLine = span.attributes?.["code.lineno"] || span.attributes?.line || 42;
                        const repoId = span.attributes?.repositoryId || "sample-project";

                        return (
                          <div
                            key={span.id}
                            className={`p-2.5 rounded-lg border text-xs font-mono transition-colors ${
                              span.status === "error"
                                ? "bg-rose-950/20 border-rose-500/30"
                                : isSlow
                                ? "bg-amber-950/20 border-amber-500/20"
                                : "bg-slate-900/60 border-white/5"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5 truncate max-w-md">
                                <span className="text-slate-500">{span.parentId ? "↳" : "•"}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${sCol.bg} ${sCol.text}`}>
                                  {span.service}
                                </span>
                                <strong className="text-slate-200 font-medium truncate">{span.name}</strong>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                                {isSlow && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                                    &gt;100ms
                                  </span>
                                )}

                                <span className="text-slate-300 font-semibold">{spanDuration}ms</span>

                                {codeFile && (
                                  <a
                                    href={`/repositories/${repoId}?file=${encodeURIComponent(codeFile)}&line=${codeLine}`}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-sans font-medium transition-colors"
                                  >
                                    <Code2 className="w-3 h-3" />
                                    Open code
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Bar Visualizer */}
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative my-1">
                              <div
                                className={`h-full rounded-full ${
                                  span.status === "error"
                                    ? "bg-rose-500"
                                    : isSlow
                                    ? "bg-amber-400"
                                    : sCol.bar
                                }`}
                                style={{
                                  marginLeft: `${offsetPct}%`,
                                  width: `${widthPct}%`,
                                }}
                              />
                            </div>

                            {/* Attributes and events */}
                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mt-1">
                              {codeFile && (
                                <span className="text-indigo-300">
                                  File: {codeFile}:{codeLine}
                                </span>
                              )}
                              {span.events && span.events.length > 0 && (
                                <span className="text-slate-500">
                                  Events: {span.events.map((e) => e.name).join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
