"use client";

import React from "react";
import {
  Database,
  Cpu,
  HardDrive,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Github } from "@/components/Icons";
import { DependencyHealth } from "@/types/observability";


interface DependencyHealthPanelProps {
  dependencies: DependencyHealth[];
}

export function DependencyHealthPanel({ dependencies }: DependencyHealthPanelProps) {
  const getCategoryIcon = (category: DependencyHealth["category"]) => {
    switch (category) {
      case "database":
        return <Database className="w-5 h-5 text-emerald-400" />;
      case "ai_provider":
        return <Cpu className="w-5 h-5 text-indigo-400" />;
      case "vcs_gateway":
        return <Github className="w-5 h-5 text-slate-300" />;
      case "file_storage":
        return <HardDrive className="w-5 h-5 text-amber-400" />;
      case "job_queue":
        return <Layers className="w-5 h-5 text-cyan-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: DependencyHealth["status"]) => {
    switch (status) {
      case "healthy":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Healthy
          </span>
        );
      case "degraded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Degraded
          </span>
        );
      case "unhealthy":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Unhealthy
          </span>
        );
      case "unconfigured":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5" />
            Unconfigured
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
        <div>
          <h2 className="text-base font-semibold text-white">Dependency & Infrastructure Health</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active health checks, probe latencies, and circuit breaker states
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {dependencies.filter((d) => d.status === "healthy").length}/{dependencies.length} operational
        </span>
      </div>

      <div className="divide-y divide-white/5">
        {dependencies.map((dep, idx) => (
          <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800/80 border border-white/5 mt-0.5">
                {getCategoryIcon(dep.category)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-200">{dep.name}</span>
                  {dep.circuitBreakerState && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        dep.circuitBreakerState === "CLOSED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : dep.circuitBreakerState === "HALF_OPEN"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      BREAKER: {dep.circuitBreakerState}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{dep.details}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:self-center">
              {dep.latencyMs !== undefined && (
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Latency</span>
                  <span className="text-xs font-mono font-medium text-slate-300">{dep.latencyMs}ms</span>
                </div>
              )}
              <div>{getStatusBadge(dep.status)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
