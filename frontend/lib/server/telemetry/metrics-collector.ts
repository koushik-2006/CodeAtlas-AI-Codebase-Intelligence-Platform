import fs from "fs";
import path from "path";
import {
  OperationalMetricsSnapshot,
  HealthStatus,
  AgentMetricsSnapshot,
} from "@/types/observability";
import { aiMetrics } from "./ai-metrics";
import { jobMonitor } from "./job-monitor";
import { aiCircuitBreaker, githubCircuitBreaker } from "../resilience";
import { alertEngine } from "./alert-engine";
import { tracer } from "./tracer";
import { db } from "../db";

interface RecordedRequest {
  timestamp: number;
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
  error?: string;
}

export class MetricsCollector {
  private requests: RecordedRequest[] = [];
  private totalRequestsCount = 0;
  private maxStoredRequests = 1000;
  private statusCodeCounts: Record<string, number> = {
    "200": 0,
    "201": 0,
    "400": 0,
    "401": 0,
    "403": 0,
    "404": 0,
    "429": 0,
    "500": 0,
    "503": 0,
  };

  /**
   * Records an API request for traffic, latency, and error rate telemetry.
   */
  recordApiRequest(params: {
    route: string;
    method: string;
    statusCode: number;
    durationMs: number;
    error?: string;
  }): void {
    this.totalRequestsCount++;
    const codeKey = String(params.statusCode);
    this.statusCodeCounts[codeKey] = (this.statusCodeCounts[codeKey] || 0) + 1;

    this.requests.unshift({
      timestamp: Date.now(),
      route: params.route,
      method: params.method,
      statusCode: params.statusCode,
      durationMs: params.durationMs,
      error: params.error,
    });

    if (this.requests.length > this.maxStoredRequests) {
      this.requests.pop();
    }
  }

  private computeAgentMetrics(): AgentMetricsSnapshot {
    try {
      const runs = db.getAgentRuns();
      if (!runs || runs.length === 0) {
        return {
          totalRunsCount: 0,
          runningCount: 0,
          completedCount: 0,
          awaitingApprovalCount: 0,
          failedCount: 0,
          avgRunDurationMs: 0,
          approvalDecisionsCount: 0,
          rejectionRatePercentage: 0,
        };
      }

      const totalRuns = runs.length;
      const running = runs.filter((r) => r.status === "running").length;
      const completed = runs.filter((r) => r.status === "completed").length;
      const awaiting = runs.filter((r) => r.status === "awaiting_approval").length;
      const failed = runs.filter((r) => r.status === "failed").length;

      const completedDurations = runs
        .filter((r) => r.status === "completed" && r.createdAt && r.updatedAt)
        .map((r) => new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime())
        .filter((d) => d > 0);

      const avgDuration =
        completedDurations.length > 0
          ? completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length
          : 0;

      let totalApprovals = 0;
      let rejections = 0;
      for (const run of runs) {
        if (run.actions) {
          for (const action of run.actions) {
            if (action.status === "approved" || action.status === "rejected") {
              totalApprovals++;
              if (action.status === "rejected") rejections++;
            }
          }
        }
      }

      const rejectionRate = totalApprovals > 0 ? (rejections / totalApprovals) * 100 : 0;

      return {
        totalRunsCount: totalRuns,
        runningCount: running,
        completedCount: completed,
        awaitingApprovalCount: awaiting,
        failedCount: failed,
        avgRunDurationMs: Math.round(avgDuration),
        approvalDecisionsCount: totalApprovals,
        rejectionRatePercentage: Number(rejectionRate.toFixed(1)),
      };
    } catch {
      return {
        totalRunsCount: 0,
        runningCount: 0,
        completedCount: 0,
        awaitingApprovalCount: 0,
        failedCount: 0,
        avgRunDurationMs: 0,
        approvalDecisionsCount: 0,
        rejectionRatePercentage: 0,
      };
    }
  }

  private measureStorage(): { dbLatencyMs: number; storageUsageMb: number } {
    let dbLatencyMs = 2;
    let storageUsageMb = 0.5;

    try {
      const t0 = performance.now();
      db.getRepositories();
      dbLatencyMs = Math.max(1, Math.round(performance.now() - t0));

      const dbPath = path.join(process.cwd(), "data", "codeatlas-db.json");
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        storageUsageMb = Number((stats.size / (1024 * 1024)).toFixed(2));
      }
    } catch {
      dbLatencyMs = 15;
    }

    return { dbLatencyMs, storageUsageMb };
  }

  getSnapshot(): OperationalMetricsSnapshot {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Requests per minute in last 60s
    const rpm = this.requests.filter((r) => r.timestamp >= oneMinuteAgo).length;

    // Calculate latency metrics from recent requests
    const latencies = this.requests.map((r) => r.durationMs);
    let avgLatency = 0;
    let p95Latency = 0;

    if (latencies.length > 0) {
      avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const sorted = [...latencies].sort((a, b) => a - b);
      const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
      p95Latency = sorted[p95Index];
    }

    // Calculate error rate
    const errorCount = this.requests.filter((r) => r.statusCode >= 400).length;
    const errorRate = this.requests.length > 0 ? (errorCount / this.requests.length) * 100 : 0;

    const aiSnapshot = aiMetrics.getSnapshot();
    const indexingSnapshot = jobMonitor.getSnapshot();
    const agentSnapshot = this.computeAgentMetrics();
    const { dbLatencyMs, storageUsageMb } = this.measureStorage();

    const circuitBreakers = [
      aiCircuitBreaker.getStatus(),
      githubCircuitBreaker.getStatus(),
    ];

    const openBreakersCount = circuitBreakers.filter((cb) => cb.state === "OPEN").length;
    const halfOpenBreakersCount = circuitBreakers.filter((cb) => cb.state === "HALF_OPEN").length;

    // Evaluate alerts against live metrics
    alertEngine.evaluateMetrics({
      api_error_rate: Number(errorRate.toFixed(1)),
      api_p95_latency: Math.round(p95Latency),
      ai_failure_rate: aiSnapshot.errorRatePercentage,
      indexing_queue_depth: indexingSnapshot.queueDepth,
      db_latency: dbLatencyMs,
      circuit_breaker_open_count: openBreakersCount,
    });

    const activeAlerts = alertEngine.getActiveIncidents();
    const hasCriticalAlert = activeAlerts.some((a) => a.severity === "critical");
    const hasWarningAlert = activeAlerts.some((a) => a.severity === "warning");

    let systemStatus: HealthStatus = "healthy";
    if (openBreakersCount > 0 || hasCriticalAlert || dbLatencyMs > 500) {
      systemStatus = "unhealthy";
    } else if (halfOpenBreakersCount > 0 || hasWarningAlert || errorRate > 5) {
      systemStatus = "degraded";
    }

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      systemStatus,
      api: {
        totalRequests: this.totalRequestsCount,
        requestsPerMinute: rpm,
        avgLatencyMs: Math.round(avgLatency),
        p95LatencyMs: Math.round(p95Latency),
        errorRatePercentage: Number(errorRate.toFixed(1)),
        statusCodeCounts: { ...this.statusCodeCounts },
      },
      ai: aiSnapshot,
      indexing: indexingSnapshot,
      agents: agentSnapshot,
      circuitBreakers,
      activeAlerts,
      recentTraces: tracer.getRecentTraces(10),
      dbLatencyMs,
      storageUsageMb,
    };
  }

  reset(): void {
    this.requests = [];
    this.totalRequestsCount = 0;
    this.statusCodeCounts = {
      "200": 0,
      "201": 0,
      "400": 0,
      "401": 0,
      "403": 0,
      "404": 0,
      "429": 0,
      "500": 0,
      "503": 0,
    };
  }
}

export const metricsCollector = new MetricsCollector();
