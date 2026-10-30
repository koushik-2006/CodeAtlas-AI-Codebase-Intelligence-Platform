"use client";

import React from "react";
import {
  Zap,
  Cpu,
  Database,
  Layers,
  Bot,
  AlertCircle,
  Clock,
  Coins,
  CheckCircle,
  FileCode,
} from "lucide-react";
import { OperationalMetricsSnapshot } from "@/types/observability";

interface MetricsOverviewGridProps {
  metrics: OperationalMetricsSnapshot;
}

export function MetricsOverviewGrid({ metrics }: MetricsOverviewGridProps) {
  const { api, ai, indexing, agents, dbLatencyMs, storageUsageMb } = metrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. API Traffic & Latency Card */}
      <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              API Traffic & SLA
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
              {api.requestsPerMinute} RPM
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {api.totalRequests.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">total requests</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">P95 Latency</span>
              <span className={`font-semibold font-mono ${api.p95LatencyMs > 1500 ? "text-amber-400" : "text-emerald-400"}`}>
                {api.p95LatencyMs} ms
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Error Rate</span>
              <span className={`font-semibold font-mono ${api.errorRatePercentage > 5 ? "text-rose-400" : api.errorRatePercentage > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {api.errorRatePercentage}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Avg Latency: <strong className="text-slate-300 font-mono">{api.avgLatencyMs}ms</strong></span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> SLA OK
          </span>
        </div>
      </div>

      {/* 2. AI Operations & Telemetry Card */}
      <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              AI Intelligence
            </span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-[10px] font-mono text-indigo-300 border border-indigo-500/20">
              {ai.activeModel || "Gemini / Fallback"}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {ai.totalRequests.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">inferences</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Est. Cost</span>
              <span className="font-semibold font-mono text-emerald-400 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                ${ai.estimatedCostUsd.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Citation Match</span>
              <span className="font-semibold font-mono text-indigo-400">
                {ai.citationValidationSuccessRate}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tokens: <strong className="text-slate-300 font-mono">{(ai.totalTokensReported + ai.totalTokensEstimated).toLocaleString()}</strong></span>
          {ai.rateLimitHits > 0 || ai.timeoutHits > 0 ? (
            <span className="text-amber-400 flex items-center gap-1 text-[10px]">
              <AlertCircle className="w-3 h-3" /> {ai.rateLimitHits + ai.timeoutHits} throttled
            </span>
          ) : (
            <span className="text-emerald-400 text-[10px]">0 throttles</span>
          )}
        </div>
      </div>

      {/* 3. Indexing & Concurrency Card */}
      <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Repository Indexing
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-[10px] font-mono text-cyan-300 border border-cyan-500/20">
              {indexing.indexFreshnessPercentage}% Fresh
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {indexing.totalFilesProcessed.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">files indexed</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Active Locks</span>
              <span className="font-semibold font-mono text-cyan-400">
                {indexing.activeJobsCount} in flight
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Avg Duration</span>
              <span className="font-semibold font-mono text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {(indexing.avgDurationMs / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Completed: <strong className="text-emerald-400 font-mono">{indexing.completedJobsCount}</strong></span>
          <span>Failed: <strong className="text-rose-400 font-mono">{indexing.failedJobsCount}</strong></span>
        </div>
      </div>

      {/* 4. Autonomous Agents & Database Card */}
      <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-purple-400" />
              Agents & Storage
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-[10px] font-mono text-purple-300 border border-purple-500/20">
              {agents.runningCount} Active
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {agents.totalRunsCount}
            </span>
            <span className="text-xs text-slate-400">agent runs</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">DB Latency</span>
              <span className={`font-semibold font-mono ${dbLatencyMs > 50 ? "text-amber-400" : "text-emerald-400"}`}>
                {dbLatencyMs} ms
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Disk Usage</span>
              <span className="font-semibold font-mono text-slate-300 flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-500" />
                {storageUsageMb} MB
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Awaiting Approval: <strong className="text-amber-400 font-mono">{agents.awaitingApprovalCount}</strong></span>
          <span>Reject Rate: <strong className="text-slate-300 font-mono">{agents.rejectionRatePercentage}%</strong></span>
        </div>
      </div>
    </div>
  );
}
