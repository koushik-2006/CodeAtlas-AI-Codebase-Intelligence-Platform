/**
 * CodeAtlas Enterprise Observability, Telemetry, and Reliability Types.
 * Phase 20 Type System.
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type OperationOutcome = "success" | "failure" | "timeout" | "cancelled";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export type AlertSeverity = "critical" | "warning" | "info";

export type AlertStatus = "firing" | "resolved" | "acknowledged";

export interface StructuredLogEntry {
  id: string;
  timestamp: string; // ISO-8601
  level: LogLevel;
  service: string;
  environment: string;
  correlationId: string;
  operation: string;
  durationMs?: number;
  outcome?: OperationOutcome;
  errorCategory?: string;
  errorMessage?: string;
  httpStatus?: number;
  route?: string;
  userId?: string;
  repositoryId?: string;
  metadata?: Record<string, any>;
}

export interface SpanEvent {
  name: string;
  timestamp: string;
  attributes?: Record<string, any>;
}

export interface TraceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  service: string;
  startTime: number; // Unix timestamp ms
  endTime?: number;
  durationMs?: number;
  status: "ok" | "error" | "in_progress";
  attributes: Record<string, any>;
  events: SpanEvent[];
}

export interface DistributedTrace {
  traceId: string;
  rootSpanName: string;
  startTime: string;
  durationMs: number;
  status: "ok" | "error";
  spanCount: number;
  spans: TraceSpan[];
}

export interface DependencyHealth {
  name: string;
  category: "database" | "ai_provider" | "vcs_gateway" | "file_storage" | "job_queue";
  status: "healthy" | "degraded" | "unhealthy" | "unconfigured";
  latencyMs?: number;
  details: string;
  lastChecked: string;
  circuitBreakerState?: CircuitBreakerState;
}

export interface SystemHealthReport {
  status: HealthStatus;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  dependencies: DependencyHealth[];
  system: {
    nodeVersion: string;
    platform: string;
    memoryRssMb: number;
    memoryHeapUsedMb: number;
    memoryHeapTotalMb: number;
    cpuLoadAvg?: number[];
  };
  checks: {
    database: boolean;
    storage: boolean;
    aiProvider: boolean;
    jobQueue: boolean;
  };
}

export interface AIMetricsSnapshot {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRatePercentage: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  totalTokensReported: number;
  totalTokensEstimated: number;
  estimatedCostUsd: number;
  rateLimitHits: number;
  timeoutHits: number;
  retrievalAvgDurationMs: number;
  avgCitationsPerResponse: number;
  citationValidationSuccessRate: number;
  activeProvider: string;
  activeModel: string;
}

export interface IndexingMetricsSnapshot {
  activeJobsCount: number;
  completedJobsCount: number;
  failedJobsCount: number;
  totalFilesProcessed: number;
  totalFilesSkipped: number;
  avgDurationMs: number;
  queueDepth: number;
  oldestQueuedJobAgeSeconds?: number;
  indexFreshnessPercentage: number;
}

export interface AgentMetricsSnapshot {
  totalRunsCount: number;
  runningCount: number;
  completedCount: number;
  awaitingApprovalCount: number;
  failedCount: number;
  avgRunDurationMs: number;
  approvalDecisionsCount: number;
  rejectionRatePercentage: number;
}

export interface CircuitBreakerStatus {
  name: string;
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  consecutiveFailures: number;
  lastFailureTime?: string;
  lastStateChange: string;
  threshold: number;
  cooldownPeriodMs: number;
}

export interface OperationalAlertRule {
  id: string;
  name: string;
  metric: string;
  condition: "gt" | "lt" | "eq" | "gte" | "lte";
  threshold: number;
  unit: string;
  severity: AlertSeverity;
  cooldownSeconds: number;
  description: string;
}

export interface OperationalAlertIncident {
  id: string;
  ruleId: string;
  name: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  currentValue: number;
  threshold: number;
  unit: string;
  deduplicationKey: string;
  triggeredAt: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface OperationalMetricsSnapshot {
  timestamp: string;
  environment: string;
  systemStatus: HealthStatus;
  api: {
    totalRequests: number;
    requestsPerMinute: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    errorRatePercentage: number;
    statusCodeCounts: Record<string, number>;
  };
  ai: AIMetricsSnapshot;
  indexing: IndexingMetricsSnapshot;
  agents: AgentMetricsSnapshot;
  circuitBreakers: CircuitBreakerStatus[];
  activeAlerts: OperationalAlertIncident[];
  recentTraces: DistributedTrace[];
  dbLatencyMs: number;
  storageUsageMb: number;
}

export interface StandardApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    correlationId: string;
    category: "validation" | "authorization" | "rate_limit" | "provider_failure" | "not_found" | "internal_error";
    timestamp: string;
    details?: any;
  };
}
