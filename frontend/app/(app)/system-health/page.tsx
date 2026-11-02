"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SystemHealthHeader } from "@/components/telemetry/SystemHealthHeader";
import { LiveChecksGrid } from "@/components/telemetry/LiveChecksGrid";
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
  CircuitBreakerStatus,
  DependencyHealth,
  HealthStatus,
} from "@/types/observability";
import {
  Loader2,
  AlertTriangle,
  Bug,
  ArrowRight,
  Flame,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { getStore, subscribe } from "@/lib/demo/store";

const DEFAULT_INFRA_DEPENDENCIES: DependencyHealth[] = [
  {
    name: "PostgreSQL Database Cluster",
    category: "database",
    status: "healthy",
    latencyMs: 14,
    details: "Connection pool active (18/25 conns in use). Replication lag < 5ms.",
    lastChecked: new Date().toISOString(),
    circuitBreakerState: "CLOSED",
  },
  {
    name: "Gemini 1.5 Flash AI Logic Gateway",
    category: "ai_provider",
    status: "healthy",
    latencyMs: 218,
    details: "Streaming SSE endpoint nominal. Quota consumption within 4% daily budget.",
    lastChecked: new Date().toISOString(),
    circuitBreakerState: "CLOSED",
  },
  {
    name: "GitHub REST & GraphQL Gateway",
    category: "vcs_gateway",
    status: "healthy",
    latencyMs: 65,
    details: "Rate limit token active. 5,000 requests/hr remaining.",
    lastChecked: new Date().toISOString(),
    circuitBreakerState: "CLOSED",
  },
  {
    name: "Artifact Storage & IndexedDB",
    category: "file_storage",
    status: "healthy",
    latencyMs: 2,
    details: "Client IndexedDB & workspace cache synchronized.",
    lastChecked: new Date().toISOString(),
    circuitBreakerState: "CLOSED",
  },
  {
    name: "AST Analysis Job Queue",
    category: "job_queue",
    status: "healthy",
    latencyMs: 8,
    details: "Worker threads idle. 0 queued indexing batches pending.",
    lastChecked: new Date().toISOString(),
    circuitBreakerState: "CLOSED",
  },
];

function SystemHealthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [metrics, setMetrics] = useState<OperationalMetricsSnapshot | null>(null);
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [rules, setRules] = useState<OperationalAlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(15);

  const [activeTab, setActiveTab] = useState<"overview" | "infrastructure" | "traces" | "logs" | "dependencies">("overview");
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  // Synchronize with URL query params
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam && ["overview", "infrastructure", "traces", "logs", "dependencies"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
    const traceParam = searchParams?.get("trace");
    if (traceParam) {
      setSelectedTraceId(traceParam);
      setActiveTab("traces");
    }
  }, [searchParams]);

  // Load telemetry data from local store
  const loadData = useCallback((isManual = false) => {
    if (isManual) setIsRefreshing(true);

    try {
      const store = getStore();
      const nowIso = new Date().toISOString();

      // Convert stored circuitBreakers object to array
      const rawBreakers = store.circuitBreakers || {};
      const breakerList: CircuitBreakerStatus[] = Object.values(rawBreakers).map((b: any) => ({
        name: b.name,
        state: b.state || "CLOSED",
        failureCount: b.failureCount || 0,
        successCount: b.successCount || 100,
        consecutiveFailures: b.consecutiveFailures || 0,
        lastFailureTime: b.lastFailureTime,
        lastStateChange: b.lastStateChange || nowIso,
        threshold: b.threshold || 5,
        cooldownPeriodMs: b.cooldownPeriodMs || 30000,
      }));

      // Check overall system status
      const hasOpenBreaker = breakerList.some((b) => b.state === "OPEN");
      const hasFiringAlert = (store.activeAlerts || []).some((a: any) => a.status === "firing");
      const currentSystemStatus: HealthStatus = hasFiringAlert ? "unhealthy" : hasOpenBreaker ? "degraded" : "healthy";

      // Build updated dependency list reflecting circuit breakers
      const updatedDeps = DEFAULT_INFRA_DEPENDENCIES.map((dep) => {
        let matchingBreaker: CircuitBreakerStatus | undefined;
        if (dep.category === "database") matchingBreaker = rawBreakers.db_pool;
        if (dep.category === "ai_provider") matchingBreaker = rawBreakers.ai_provider;
        if (dep.category === "vcs_gateway") matchingBreaker = rawBreakers.github_api;

        const bState = matchingBreaker?.state || "CLOSED";
        const status = bState === "OPEN" ? "unhealthy" : bState === "HALF_OPEN" ? "degraded" : "healthy";

        return {
          ...dep,
          status: status as any,
          circuitBreakerState: bState,
          lastChecked: nowIso,
        };
      });

      // Construct System Health Report
      const healthReport: SystemHealthReport = {
        status: currentSystemStatus,
        version: "v2.4.0",
        environment: "production",
        timestamp: nowIso,
        uptimeSeconds: 86400 + Math.floor((Date.now() % 1000000) / 1000),
        dependencies: updatedDeps,
        system: {
          nodeVersion: "v20.18.0",
          platform: "web-client",
          memoryRssMb: 142,
          memoryHeapUsedMb: 48,
          memoryHeapTotalMb: 128,
        },
        checks: {
          database: true,
          storage: true,
          aiProvider: true,
          jobQueue: true,
        },
      };

      // Calculate aggregated metrics from store
      const reposCount = store.repositories?.length || 7;
      let totalFiles = 0;
      store.repositories?.forEach((r: any) => {
        totalFiles += r.filesCount || (r.files ? r.files.length : 18);
      });

      const metricsSnapshot: OperationalMetricsSnapshot = {
        timestamp: nowIso,
        environment: "production",
        systemStatus: currentSystemStatus,
        api: {
          totalRequests: 84920,
          requestsPerMinute: hasFiringAlert ? 485 : 340,
          avgLatencyMs: hasFiringAlert ? 245 : 38,
          p95LatencyMs: hasFiringAlert ? 1850 : 84,
          errorRatePercentage: hasFiringAlert ? 14.8 : 0.2,
          statusCodeCounts: { "200": 83400, "400": 850, "404": 520, "500": 150 },
        },
        ai: {
          totalRequests: 4280,
          successfulRequests: 4272,
          failedRequests: 8,
          errorRatePercentage: 0.18,
          avgLatencyMs: 240,
          p95LatencyMs: 620,
          totalTokensReported: 1845000,
          totalTokensEstimated: 240000,
          estimatedCostUsd: 0.384,
          rateLimitHits: 0,
          timeoutHits: 0,
          retrievalAvgDurationMs: 45,
          avgCitationsPerResponse: 3.2,
          citationValidationSuccessRate: 99.4,
          activeProvider: "Google AI",
          activeModel: "gemini-1.5-flash",
        },
        indexing: {
          activeJobsCount: 0,
          completedJobsCount: reposCount,
          failedJobsCount: 0,
          totalFilesProcessed: totalFiles,
          totalFilesSkipped: 0,
          avgDurationMs: 1420,
          queueDepth: 0,
          indexFreshnessPercentage: 100,
        },
        agents: {
          totalRunsCount: store.agentWorkflows?.length || 8,
          runningCount: 1,
          completedCount: store.agentWorkflows?.length || 7,
          awaitingApprovalCount: 1,
          failedCount: 0,
          avgRunDurationMs: 4200,
          approvalDecisionsCount: 6,
          rejectionRatePercentage: 0,
        },
        circuitBreakers: breakerList,
        activeAlerts: store.activeAlerts || [],
        recentTraces: store.traces || [],
        dbLatencyMs: hasFiringAlert ? 94 : 14,
        storageUsageMb: 142,
      };

      setHealth(healthReport);
      setMetrics(metricsSnapshot);
      setRules(store.alertRules || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Subscribe to store updates
  useEffect(() => {
    loadData();
    const unsubscribe = subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      loadData();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, loadData]);

  const handleSelectTrace = (traceId: string) => {
    setSelectedTraceId(traceId);
    setActiveTab("traces");
  };

  const handleTabChange = (tab: "overview" | "infrastructure" | "traces" | "logs" | "dependencies") => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    if (tab !== "traces") params.delete("trace");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  };

  if (loading || !metrics || !health) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium text-slate-400">Loading system telemetry & operational probes...</p>
      </div>
    );
  }

  const firingAlerts = (metrics.activeAlerts || []).filter((a) => a.status === "firing");

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Header */}
      <SystemHealthHeader
        status={metrics.systemStatus}
        uptimeSeconds={health.uptimeSeconds}
        environment={health.environment}
        nodeVersion={health.system?.nodeVersion || "v20.18.0"}
        autoRefreshInterval={autoRefreshInterval}
        setAutoRefreshInterval={setAutoRefreshInterval}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
        lastUpdated={metrics.timestamp}
      />

      {/* Real Live Checks Grid */}
      <LiveChecksGrid
        onSimulateIncident={() => loadData(true)}
        onRefreshAll={() => loadData(true)}
      />

      {/* Active Incident Banner (when an incident is firing) */}
      {firingAlerts.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 mt-0.5">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Critical Incident Active
                </span>
                <span className="text-sm font-bold text-white">{firingAlerts[0].name}</span>
              </div>
              <p className="text-xs text-rose-200 mt-1 max-w-2xl">{firingAlerts[0].message}</p>
            </div>
          </div>

          <a
            href="/debug?id=inv_incident&repo=sample-project"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md flex-shrink-0"
          >
            <Bug className="w-4 h-4" />
            Investigate with AI Debugger
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-xs font-medium overflow-x-auto">
        {[
          { id: "overview", label: "Overview & Telemetry" },
          { id: "infrastructure", label: "Circuit Breakers & Infra" },
          { id: "traces", label: "Distributed Tracing" },
          { id: "logs", label: "Live Structured Logs" },
          { id: "dependencies", label: "Dependency Health & Supply Chain" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Telemetry */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Metrics Overview Grid with Time-Series Charts & Microservice Scope */}
          <MetricsOverviewGrid metrics={metrics} />

          {/* Alerts Panel */}
          <AlertsPanel
            activeIncidents={metrics.activeAlerts}
            rules={rules}
            onIncidentUpdated={() => loadData(true)}
          />

          {/* Quick Infrastructure Peek */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CircuitBreakersPanel
              breakers={metrics.circuitBreakers}
              onActionComplete={() => loadData(true)}
            />
            <DependencyHealthPanel dependencies={health.dependencies} />
          </div>
        </div>
      )}

      {/* Tab 2: Circuit Breakers & Infra */}
      {activeTab === "infrastructure" && (
        <div className="space-y-6">
          <CircuitBreakersPanel
            breakers={metrics.circuitBreakers}
            onActionComplete={() => loadData(true)}
          />
          <DependencyHealthPanel dependencies={health.dependencies} />
        </div>
      )}

      {/* Tab 3: Traces Waterfall */}
      {activeTab === "traces" && (
        <TracesViewer
          traces={metrics.recentTraces}
          selectedTraceId={selectedTraceId}
        />
      )}

      {/* Tab 4: Live Structured Logs */}
      {activeTab === "logs" && (
        <LiveLogsViewer
          onSelectTrace={handleSelectTrace}
        />
      )}

      {/* Tab 5: Dependency Health & Supply Chain */}
      {activeTab === "dependencies" && (
        <DependencyHealthPanel dependencies={health.dependencies} />
      )}
    </div>
  );
}

export default function SystemHealthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium text-slate-400">Loading System Health...</p>
        </div>
      }
    >
      <SystemHealthContent />
    </Suspense>
  );
}
