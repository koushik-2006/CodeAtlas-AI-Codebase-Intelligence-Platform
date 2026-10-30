"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SystemHealthHeader } from "@/components/telemetry/SystemHealthHeader";
import { MetricsOverviewGrid } from "@/components/telemetry/MetricsOverviewGrid";
import { DependencyHealthPanel } from "@/components/telemetry/DependencyHealthPanel";
import { CircuitBreakersPanel } from "@/components/telemetry/CircuitBreakersPanel";
import { AlertsPanel } from "@/components/telemetry/AlertsPanel";
import { LiveLogsViewer } from "@/components/telemetry/LiveLogsViewer";
import { TracesViewer } from "@/components/telemetry/TracesViewer";
import {
  OperationalMetricsSnapshot,
  SystemHealthReport,
  OperationalAlertRule,
} from "@/types/observability";
import { Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "@/services/api-client";

export default function SystemHealthPage() {
  const [metrics, setMetrics] = useState<OperationalMetricsSnapshot | null>(null);
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [rules, setRules] = useState<OperationalAlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(15);
  const [activeTab, setActiveTab] = useState<"overview" | "infrastructure" | "traces" | "logs">("overview");

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    setError(null);

    try {
      const [metricsRes, healthRes, alertsRes] = await Promise.all([
        apiClient.get<any>("/telemetry/metrics"),
        apiClient.get<any>("/health"),
        apiClient.get<any>("/telemetry/alerts"),
      ]);

      const metricsJson = metricsRes.data || {};
      const healthJson = healthRes.data || {};
      const alertsJson = alertsRes.data || {};

      if (metricsRes.success && metricsJson) {
        setMetrics(metricsJson.data || metricsJson);
      }
      if (healthJson.status || healthJson.service) {
        setHealth(healthJson);
      }
      if (alertsRes.success && alertsJson) {
        const extractedRules = alertsJson.data?.rules || alertsJson.rules;
        if (extractedRules) setRules(extractedRules);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load telemetry data. Telemetry services require an active backend.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      loadData();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium text-slate-400">Loading system telemetry & operational probes...</p>
      </div>
    );
  }

  if (error || !metrics || !health) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-12 rounded-xl border border-rose-500/30 bg-rose-950/20 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Observability Engine Unavailable</h2>
        <p className="text-sm text-slate-400 mt-1">{error || "Could not retrieve operational metrics"}</p>
        <button
          onClick={() => loadData(true)}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Header */}
      <SystemHealthHeader
        status={metrics.systemStatus}
        uptimeSeconds={health.uptimeSeconds}
        environment={health.environment}
        nodeVersion={health.system.nodeVersion}
        autoRefreshInterval={autoRefreshInterval}
        setAutoRefreshInterval={setAutoRefreshInterval}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        lastUpdated={metrics.timestamp}
      />

      {/* Metrics Cards */}
      <MetricsOverviewGrid metrics={metrics} />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs font-medium">
        {[
          { id: "overview", label: "Overview & Alerts" },
          { id: "infrastructure", label: "Dependencies & Breakers" },
          { id: "traces", label: "Distributed Tracing" },
          { id: "logs", label: "Structured Logs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <AlertsPanel
            activeIncidents={metrics.activeAlerts}
            rules={rules}
            onIncidentUpdated={() => loadData(true)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DependencyHealthPanel dependencies={health.dependencies} />
            <CircuitBreakersPanel
              breakers={metrics.circuitBreakers}
              onActionComplete={() => loadData(true)}
            />
          </div>
        </div>
      )}

      {activeTab === "infrastructure" && (
        <div className="space-y-6">
          <DependencyHealthPanel dependencies={health.dependencies} />
          <CircuitBreakersPanel
            breakers={metrics.circuitBreakers}
            onActionComplete={() => loadData(true)}
          />
        </div>
      )}

      {activeTab === "traces" && (
        <TracesViewer traces={metrics.recentTraces} />
      )}

      {activeTab === "logs" && (
        <LiveLogsViewer />
      )}
    </div>
  );
}
