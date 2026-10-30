"use client";

import React, { useState, useEffect, useCallback } from "react";

import {
  Terminal,
  Search,
  Filter,
  ShieldCheck,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { StructuredLogEntry, LogLevel } from "@/types/observability";
import { apiClient } from "@/services/api-client";

export function LiveLogsViewer() {
  const [logs, setLogs] = useState<StructuredLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLevel !== "all") params.set("level", selectedLevel);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "100");

      const res = await apiClient.get<any>(`/api/telemetry/logs?${params.toString()}`);
      const json = res.data || {};
      if (res.success && (json.logs || json.data?.logs)) {
        setLogs(json.logs || json.data?.logs);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);


  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
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

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-5 flex flex-col h-[520px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            Live Structured Logs & Audit Stream
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">In-memory telemetry ring buffer</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3 h-3" /> Secret Redaction Active
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-white/5 text-xs">
            {["all", "error", "warn", "info", "debug"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                  selectedLevel === lvl
                    ? "bg-indigo-600 text-white"
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
              placeholder="Search logs or trace..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
              className="w-48 sm:w-56 px-3 py-1.5 pl-8 rounded-lg bg-slate-800/80 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-1">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            No structured logs match the current filter.
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;

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
                    <span className="text-indigo-300 font-medium">{log.operation}</span>
                    <span className="text-slate-300 line-clamp-1">{log.errorMessage || "Completed successfully"}</span>
                  </div>

                  <div className="flex items-center gap-2">
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
                        <span className="text-slate-200 select-all">{log.correlationId}</span>
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
                          <span className="text-slate-200 font-bold">{log.httpStatus}</span>
                        </div>
                      )}
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div>
                        <span className="text-slate-500 block text-[10px] mb-1">METADATA (REDACTED):</span>
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
