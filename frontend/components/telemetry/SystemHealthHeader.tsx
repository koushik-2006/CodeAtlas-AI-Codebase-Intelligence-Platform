"use client";

import React from "react";
import { Activity, RefreshCw, ShieldCheck, AlertTriangle, AlertOctagon, Clock, Server } from "lucide-react";
import { HealthStatus } from "@/types/observability";

interface SystemHealthHeaderProps {
  status: HealthStatus;
  uptimeSeconds: number;
  environment: string;
  nodeVersion: string;
  autoRefreshInterval: number; // 0 = paused, or seconds
  setAutoRefreshInterval: (interval: number) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated: string;
}

export function SystemHealthHeader({
  status,
  uptimeSeconds,
  environment,
  nodeVersion,
  autoRefreshInterval,
  setAutoRefreshInterval,
  onRefresh,
  isRefreshing,
  lastUpdated,
}: SystemHealthHeaderProps) {
  const formatUptime = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case "healthy":
        return {
          label: "OPERATIONAL",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          dot: "bg-emerald-400",
          icon: ShieldCheck,
        };
      case "degraded":
        return {
          label: "DEGRADED PERFORMANCE",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          dot: "bg-amber-400",
          icon: AlertTriangle,
        };
      case "unhealthy":
      default:
        return {
          label: "SYSTEM UNHEALTHY",
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          dot: "bg-rose-400",
          icon: AlertOctagon,
        };
    }
  };

  const badge = getStatusBadge();
  const StatusIcon = badge.icon;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-xl">
      <div className="flex items-start sm:items-center gap-4">
        <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Activity className="w-7 h-7 animate-pulse" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              System Observability & Reliability
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${badge.bg}`}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dot} animate-ping`} />
              <StatusIcon className="w-3.5 h-3.5" />
              {badge.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Uptime: <strong className="text-slate-200">{formatUptime(uptimeSeconds)}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              Env: <strong className="text-slate-200 capitalize">{environment}</strong> ({nodeVersion})
            </span>
            <span>•</span>
            <span>
              Updated: <span className="text-slate-300">{new Date(lastUpdated).toLocaleTimeString()}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/60 text-xs">
          <span className="px-2 text-slate-400 font-medium">Auto-refresh:</span>
          {[
            { label: "Off", value: 0 },
            { label: "5s", value: 5 },
            { label: "15s", value: 15 },
            { label: "30s", value: 30 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setAutoRefreshInterval(item.value)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                autoRefreshInterval === item.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
          Refresh
        </button>
      </div>
    </div>
  );
}
