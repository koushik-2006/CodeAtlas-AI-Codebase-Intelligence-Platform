"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Terminal,
  Search,
  ShieldCheck,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Filter,
  Share2,
  Trash2,
} from "lucide-react";
import { StructuredLogEntry, LogLevel } from "@/types/observability";
import { getStore, addTelemetryLog } from "@/lib/demo/store";

interface LiveLogsViewerProps {
  logs?: StructuredLogEntry[];
  onSelectTrace?: (traceId: string) => void;
}

const SAMPLE_SERVICES = ["api-gateway", "auth-service", "payment-service", "fastapi-backend", "redis_cache"];
const SAMPLE_OPERATIONS = [
  { op: "auth.verifyToken", service: "auth-service", lvl: "info", msg: "JWT token verified for session usr_demo" },
  { op: "gateway.route", service: "api-gateway", lvl: "info", msg: "Proxied GET /api/v1/repositories/sample-project" },
  { op: "cache.get", service: "redis_cache", lvl: "debug", msg: "Cache hit for symbol: ast_lookup_fastapi" },
  { op: "db.query", service: "fastapi-backend", lvl: "info", msg: "AST parse completed in 42ms" },
  { op: "payment.verifyCard", service: "payment-service", lvl: "info", msg: "Pre-auth token validated with Stripe connector" },
  { op: "gateway.ratelimit", service: "api-gateway", lvl: "warn", msg: "IP 192.168.1.100 approaching 80% quota threshold" },
];

export function LiveLogsViewer({ logs: externalLogs, onSelectTrace }: LiveLogsViewerProps) {
  const [internalLogs, setInternalLogs] = useState<StructuredLogEntry[]>(() => {
    if (externalLogs && externalLogs.length > 0) return externalLogs;
    const store = getStore();
    return store.logs || [];
  });

  const [isStreaming, setIsStreaming] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync with store / external props
  useEffect(() => {
    if (externalLogs && externalLogs.length > 0) {
      setInternalLogs(externalLogs);
    } else {
      const store = getStore();
      if (store.logs) setInternalLogs(store.logs);
    }
  }, [externalLogs]);

  // Simulated live log ticker
  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      const sample = SAMPLE_OPERATIONS[Math.floor(Math.random() * SAMPLE_OPERATIONS.length)];
      const traceNum = Math.floor(100 + Math.random() * 900);
      const newEntry: StructuredLogEntry = {
        id: `log_live_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        level: sample.lvl as LogLevel,
        service: sample.service,
        environment: "production",
        correlationId: `corr_live_${Date.now().toString(36)}`,
        operation: sample.op,
        outcome: "success",
        errorMessage: sample.msg,
        durationMs: Math.floor(10 + Math.random() * 45),
        metadata: {
          traceId: `tr-auth-flow-${traceNum}`,
          client: "web-spa",
          region: "us-east-1",
        },
      };

      setInternalLogs((prev) => [newEntry, ...prev.slice(0, 199)]);
      addTelemetryLog(newEntry);
    }, 4000);

    return () => clearInterval(timer);
  }, [isStreaming]);

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLevelPill = (level: LogLevel) => {
    switch (level) {
      case "error":
      case "fatal":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "warn":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "info":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "debug":
      default:
        return "bg-slate-700/50 text-slate-400 border-slate-600/30";
    }
  };

  const filteredLogs = useMemo(() => {
    return internalLogs.filter((log) => {
      if (selectedLevel !== "all" && log.level !== selectedLevel) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesMsg = log.errorMessage?.toLowerCase().includes(q);
        const matchesOp = log.operation?.toLowerCase().includes(q);
        const matchesService = log.service?.toLowerCase().includes(q);
        const matchesCorr = log.correlationId?.toLowerCase().includes(q);
        const matchesTrace = log.metadata?.traceId?.toLowerCase().includes(q);
        if (!matchesMsg && !matchesOp && !matchesService && !matchesCorr && !matchesTrace) {
          return false;
        }
      }
      return true;
    });
  }, [internalLogs, selectedLevel, search]);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-5 flex flex-col h-[560px] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              Live Structured Logs & Audit Stream
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
              Simulated
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">In-memory telemetry ring buffer (200 events)</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3 h-3" /> PII & Secret Redaction Active
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Pause / Resume Ticker */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              isStreaming
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Stream
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Resume Stream
              </>
            )}
          </button>

          {/* Level Filter */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-white/5 text-xs">
            {["all", "error", "warn", "info", "debug"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                  selectedLevel === lvl
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search logs, op, trace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-44 sm:w-52 px-3 py-1.5 pl-8 rounded-lg bg-slate-800/80 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-1">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <span>No structured logs match current search or level criteria.</span>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs text-indigo-400 hover:underline"
              >
                Clear search filter
              </button>
            )}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const traceId = log.metadata?.traceId || (log as any).traceId || (log.correlationId?.includes("req_demo") ? "tr-auth-flow-101" : undefined);

            return (
              <div
                key={log.id}
                className="rounded-lg border border-white/5 bg-slate-950/40 hover:bg-slate-900/60 transition-colors p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex-1 flex items-start gap-2 cursor-pointer"
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  >
                    <button className="text-slate-500 hover:text-slate-300 mt-0.5">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border ${getLevelPill(
                        log.level
                      )}`}
                    >
                      {log.level}
                    </span>
                    <span className="text-slate-400 text-[11px] font-medium">[{log.service}]</span>
                    <span className="text-indigo-300 font-semibold">{log.operation}</span>
                    <span className="text-slate-300 line-clamp-1">
                      {log.errorMessage || "Operation completed successfully"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {traceId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectTrace) onSelectTrace(traceId);
                        }}
                        title={`Open trace ${traceId} in waterfall view`}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-[10px] font-mono transition-colors"
                      >
                        <Share2 className="w-2.5 h-2.5" />
                        {traceId}
                      </button>
                    )}

                    {log.durationMs !== undefined && (
                      <span className="text-[11px] text-slate-400">{log.durationMs}ms</span>
                    )}

                    <button
                      onClick={() => handleCopy(log.correlationId, log.id)}
                      title={`Copy Correlation ID: ${log.correlationId}`}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-2.5 border-t border-white/5 text-[11px] space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400">
                      <div>
                        <span className="text-slate-500 block text-[10px]">CORRELATION ID:</span>
                        <span className="text-slate-200 select-all font-mono">{log.correlationId}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">SERVICE / ENV:</span>
                        <span className="text-slate-200">
                          {log.service} ({log.environment})
                        </span>
                      </div>
                      {log.route && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">ROUTE:</span>
                          <span className="text-slate-200">{log.route}</span>
                        </div>
                      )}
                      {log.httpStatus && (
                        <div>
                          <span className="text-slate-500 block text-[10px]">HTTP STATUS:</span>
                          <span
                            className={`font-bold ${
                              log.httpStatus >= 500
                                ? "text-rose-400"
                                : log.httpStatus >= 400
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {log.httpStatus}
                          </span>
                        </div>
                      )}
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div>
                        <span className="text-slate-500 block text-[10px] mb-1">METADATA (ENRICHED & SANITIZED):</span>
                        <pre className="p-2 rounded bg-slate-900 border border-white/5 text-[11px] text-slate-300 overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
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
