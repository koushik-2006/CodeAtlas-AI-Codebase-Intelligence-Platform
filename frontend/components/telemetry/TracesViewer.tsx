"use client";

import React, { useState } from "react";
import { GitCommit, Clock, CheckCircle2, XCircle, ChevronDown, ChevronRight, Share2 } from "lucide-react";
import { DistributedTrace, TraceSpan } from "@/types/observability";

interface TracesViewerProps {
  traces: DistributedTrace[];
}

export function TracesViewer({ traces }: TracesViewerProps) {
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-400" />
            Distributed Tracing & Request Lifecycles
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            End-to-end request latency waterfalls, parent-child span hierarchy, and timing breakdowns
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {traces.length} recent traces
        </span>
      </div>

      {traces.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No distributed traces recorded yet. Execute API or AI requests to generate traces.
        </div>
      ) : (
        <div className="space-y-3">
          {traces.map((trace) => {
            const isSelected = selectedTraceId === trace.traceId;
            const rootDuration = trace.durationMs || 1;

            return (
              <div
                key={trace.traceId}
                className="rounded-lg border border-white/5 bg-slate-800/40 p-3.5 transition-colors"
              >
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer"
                  onClick={() => setSelectedTraceId(isSelected ? null : trace.traceId)}
                >
                  <div className="flex items-center gap-2.5">
                    <button className="text-slate-500 hover:text-slate-300">
                      {isSelected ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        {trace.status === "ok" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        <span className="text-sm font-semibold text-slate-200">
                          {trace.rootSpanName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
                          {trace.spanCount} {trace.spanCount === 1 ? "span" : "spans"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        ID: {trace.traceId} • {new Date(trace.startTime).toLocaleTimeString()}
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
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Span Waterfall Breakdown
                    </div>
                    {trace.spans.map((span) => {
                      const spanDuration = span.durationMs || 1;
                      const offsetPct = Math.min(
                        95,
                        Math.max(
                          0,
                          ((span.startTime - (trace.spans[0]?.startTime || span.startTime)) / rootDuration) * 100
                        )
                      );
                      const widthPct = Math.min(100 - offsetPct, Math.max(5, (spanDuration / rootDuration) * 100));

                      return (
                        <div key={span.id} className="text-xs font-mono space-y-1">
                          <div className="flex items-center justify-between text-slate-300 text-[11px]">
                            <span className="flex items-center gap-1.5 truncate max-w-[280px]">
                              <span className="text-slate-500">{span.parentId ? "↳" : "•"}</span>
                              <strong className="text-indigo-300">{span.name}</strong>
                              <span className="text-slate-500">({span.service})</span>
                            </span>
                            <span className="text-slate-400">{spanDuration}ms</span>
                          </div>

                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden relative">
                            <div
                              className={`h-full rounded-full ${
                                span.status === "error"
                                  ? "bg-rose-500"
                                  : span.parentId
                                  ? "bg-indigo-400"
                                  : "bg-emerald-400"
                              }`}
                              style={{
                                marginLeft: `${offsetPct}%`,
                                width: `${widthPct}%`,
                              }}
                            />
                          </div>

                          {span.events && span.events.length > 0 && (
                            <div className="pl-4 text-[10px] text-slate-500">
                              Events: {span.events.map((e) => e.name).join(", ")}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
