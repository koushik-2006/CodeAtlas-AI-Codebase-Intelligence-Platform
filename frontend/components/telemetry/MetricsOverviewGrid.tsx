"use client";

import React, { useState, useMemo } from "react";
import {
  Zap,
  Cpu,
  Database,
  Layers,
  AlertCircle,
  Clock,
  Coins,
  CheckCircle,
  Activity,
  Server,
  TrendingUp,
  Filter,
} from "lucide-react";
import { OperationalMetricsSnapshot } from "@/types/observability";

interface MetricsOverviewGridProps {
  metrics: OperationalMetricsSnapshot;
}

type TimeRange = "15m" | "1h" | "24h";

interface TimeSeriesPoint {
  time: string;
  rpm: number;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
  cpu: number;
  memory: number;
}

const SERVICES = [
  { id: "all", name: "All Services (Cluster Aggregate)" },
  { id: "api-gateway", name: "api-gateway" },
  { id: "auth-service", name: "auth-service" },
  { id: "payment-service", name: "payment-service" },
  { id: "fastapi-backend", name: "fastapi-backend" },
  { id: "shared-core-lib", name: "shared-core-lib" },
];

export function MetricsOverviewGrid({ metrics }: MetricsOverviewGridProps) {
  const [selectedService, setSelectedService] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { api, ai, indexing, agents, dbLatencyMs, storageUsageMb } = metrics;

  // Generate deterministic time series points based on selected service and time range
  const timeSeries = useMemo<TimeSeriesPoint[]>(() => {
    const pointsCount = timeRange === "15m" ? 15 : timeRange === "1h" ? 24 : 30;
    const now = Date.now();
    const intervalMs =
      timeRange === "15m"
        ? (15 * 60 * 1000) / pointsCount
        : timeRange === "1h"
        ? (60 * 60 * 1000) / pointsCount
        : (24 * 60 * 60 * 1000) / pointsCount;

    const baseRpm =
      selectedService === "all"
        ? 340
        : selectedService === "api-gateway"
        ? 180
        : selectedService === "auth-service"
        ? 65
        : selectedService === "payment-service"
        ? 40
        : 55;

    const isIncidentService = selectedService === "payment-service";

    return Array.from({ length: pointsCount }, (_, i) => {
      const pointTime = new Date(now - (pointsCount - 1 - i) * intervalMs);
      const timeStr =
        timeRange === "24h"
          ? pointTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : pointTime.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });

      // Slight sine curve with variation
      const wave = Math.sin(i / 3) * 20;
      const rpm = Math.max(10, Math.round(baseRpm + wave + ((i * 7) % 15)));

      // Latencies
      const p50 = Math.round(18 + Math.sin(i / 2) * 5 + (i % 4));
      const p95 = isIncidentService && i > pointsCount - 5 ? 1420 : Math.round(65 + wave * 0.8 + ((i * 11) % 20));
      const p99 = isIncidentService && i > pointsCount - 5 ? 2850 : Math.round(110 + wave * 1.2 + ((i * 13) % 35));

      // Error Rate
      const errorRate =
        isIncidentService && i > pointsCount - 5
          ? 18.5
          : Number((0.2 + (i % 3 === 0 ? 0.4 : 0.1)).toFixed(1));

      // CPU and memory
      const cpu = Math.min(95, Math.max(15, Math.round(35 + Math.sin(i / 2) * 12 + ((i * 5) % 8))));
      const memory = Math.min(90, Math.max(30, Math.round(52 + Math.cos(i / 4) * 8 + (i % 5))));

      return {
        time: timeStr,
        rpm,
        p50,
        p95,
        p99,
        errorRate,
        cpu,
        memory,
      };
    });
  }, [selectedService, timeRange]);

  // SVG Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  // Max values for scaling
  const maxRpm = Math.max(...timeSeries.map((p) => p.rpm), 100);
  const maxLatency = Math.max(...timeSeries.map((p) => p.p99), 200);

  // Helper to map index to X coordinate
  const getX = (index: number) => {
    return paddingX + (index / (timeSeries.length - 1)) * (chartWidth - paddingX * 2);
  };

  // Helper to map latency value to Y coordinate
  const getLatencyY = (val: number) => {
    return chartHeight - paddingY - (val / maxLatency) * (chartHeight - paddingY * 2);
  };

  // Helper to map RPM to Y coordinate
  const getRpmY = (val: number) => {
    return chartHeight - paddingY - (val / maxRpm) * (chartHeight - paddingY * 2);
  };

  const p95Points = timeSeries.map((p, idx) => `${getX(idx)},${getLatencyY(p.p95)}`).join(" ");
  const p50Points = timeSeries.map((p, idx) => `${getX(idx)},${getLatencyY(p.p50)}`).join(" ");
  const rpmPoints = timeSeries.map((p, idx) => `${getX(idx)},${getRpmY(p.rpm)}`).join(" ");

  const activePoint = hoveredIndex !== null ? timeSeries[hoveredIndex] : timeSeries[timeSeries.length - 1];

  return (
    <div className="space-y-4">
      {/* Telemetry Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Server className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-slate-200">Microservice Scope:</span>
          </div>

          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/30">
            Simulated
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Range:
          </span>
          {(["15m", "1h", "24h"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                timeRange === r
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. API Traffic & Latency Card */}
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                API Traffic & SLA
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                {activePoint?.rpm || api.requestsPerMinute} RPM
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
                <span
                  className={`font-semibold font-mono ${
                    (activePoint?.p95 || api.p95LatencyMs) > 1000 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {activePoint?.p95 || api.p95LatencyMs} ms
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Error Rate</span>
                <span
                  className={`font-semibold font-mono ${
                    (activePoint?.errorRate || api.errorRatePercentage) > 5
                      ? "text-rose-400"
                      : (activePoint?.errorRate || api.errorRatePercentage) > 0
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {activePoint?.errorRate !== undefined ? activePoint.errorRate : api.errorRatePercentage}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              P50: <strong className="text-slate-300 font-mono">{activePoint?.p50 || api.avgLatencyMs}ms</strong>
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> SLA Nominal
            </span>
          </div>
        </div>

        {/* 2. AI Operations & Telemetry Card */}
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                AI Inference SLA
              </span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-[10px] font-mono text-indigo-300 border border-indigo-500/20">
                {ai.activeModel || "gemini-1.5-flash"}
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
            <span>
              Tokens:{" "}
              <strong className="text-slate-300 font-mono">
                {(ai.totalTokensReported + ai.totalTokensEstimated).toLocaleString()}
              </strong>
            </span>
            <span className="text-emerald-400 text-[10px]">0 throttles</span>
          </div>
        </div>

        {/* 3. Indexing & Concurrency Card */}
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-between shadow-sm">
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
                <span className="text-slate-400 block text-[11px]">Avg Parse</span>
                <span className="font-semibold font-mono text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {(indexing.avgDurationMs / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Completed: <strong className="text-emerald-400 font-mono">{indexing.completedJobsCount}</strong>
            </span>
            <span>
              Failed: <strong className="text-slate-400 font-mono">{indexing.failedJobsCount}</strong>
            </span>
          </div>
        </div>

        {/* 4. Autonomous Agents & Host Resources Card */}
        <div className="p-4 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-sm flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-400" />
                Compute & Memory
              </span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-[10px] font-mono text-purple-300 border border-purple-500/20">
                CPU: {activePoint?.cpu || 34}%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {activePoint?.memory || 58}%
              </span>
              <span className="text-xs text-slate-400">RAM allocation</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">DB Latency</span>
                <span
                  className={`font-semibold font-mono ${
                    dbLatencyMs > 50 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {dbLatencyMs} ms
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Disk Store</span>
                <span className="font-semibold font-mono text-slate-300 flex items-center gap-1">
                  <Database className="w-3 h-3 text-slate-500" />
                  {storageUsageMb} MB
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Agents active: <strong className="text-purple-400 font-mono">{agents.runningCount}</strong>
            </span>
            <span>
              Queue: <strong className="text-slate-300 font-mono">{agents.awaitingApprovalCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Time-Series Charts */}
      <div className="p-5 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Live Telemetry Streams: {SERVICES.find((s) => s.id === selectedService)?.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated time-series progression over the last {timeRange}. Hover over any point for instantaneous values.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-300">RPM: {activePoint.rpm}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span className="text-slate-300">P95: {activePoint.p95}ms</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300">P50: {activePoint.p50}ms</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="text-slate-300">Err: {activePoint.errorRate}%</span>
            </span>
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-40 select-none overflow-visible"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <line
                key={pct}
                x1={paddingX}
                y1={chartHeight - paddingY - pct * (chartHeight - paddingY * 2)}
                x2={chartWidth - paddingX}
                y2={chartHeight - paddingY - pct * (chartHeight - paddingY * 2)}
                stroke="currentColor"
                className="text-white/5"
                strokeDasharray="4 4"
              />
            ))}

            {/* P95 Latency Polyline (Purple/Indigo) */}
            <polyline
              fill="none"
              stroke="#818CF8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={p95Points}
            />

            {/* P50 Latency Polyline (Emerald) */}
            <polyline
              fill="none"
              stroke="#34D399"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={p50Points}
            />

            {/* RPM Polyline (Amber) */}
            <polyline
              fill="none"
              stroke="#FBBF24"
              strokeWidth="2"
              strokeDasharray="3 3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={rpmPoints}
            />

            {/* Interactive Data points */}
            {timeSeries.map((p, idx) => {
              const x = getX(idx);
              const y = getLatencyY(p.p95);
              const isHovered = hoveredIndex === idx;

              return (
                <g key={idx}>
                  {/* Invisible hit target for hover */}
                  <rect
                    x={x - (chartWidth / timeSeries.length) / 2}
                    y={0}
                    width={chartWidth / timeSeries.length}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  />

                  {/* Marker when hovered */}
                  {isHovered && (
                    <>
                      <line
                        x1={x}
                        y1={paddingY}
                        x2={x}
                        y2={chartHeight - paddingY}
                        stroke="#A78BFA"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                      <circle cx={x} cy={y} r="4" fill="#818CF8" stroke="#ffffff" strokeWidth="1.5" />
                      <circle cx={x} cy={getRpmY(p.rpm)} r="3.5" fill="#FBBF24" stroke="#ffffff" strokeWidth="1" />
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Time axis labels */}
          <div className="flex justify-between text-[10px] font-mono text-slate-500 px-4 mt-2">
            <span>{timeSeries[0]?.time}</span>
            <span>{timeSeries[Math.floor(timeSeries.length / 2)]?.time}</span>
            <span>{timeSeries[timeSeries.length - 1]?.time} (Now)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
