import { redactSecrets, logger } from "../lib/server/telemetry/logger";
import { tracer } from "../lib/server/telemetry/tracer";
import { CircuitBreaker, withRetry, aiCircuitBreaker, githubCircuitBreaker } from "../lib/server/resilience";
import { aiMetrics } from "../lib/server/telemetry/ai-metrics";
import { jobMonitor } from "../lib/server/telemetry/job-monitor";
import { memoryCache } from "../lib/server/cache";
import { alertEngine, DEFAULT_ALERT_RULES } from "../lib/server/telemetry/alert-engine";
import { metricsCollector } from "../lib/server/telemetry/metrics-collector";
import { GET as getHealth } from "../app/api/health/route";
import { GET as getLiveness } from "../app/api/health/liveness/route";
import { GET as getReadiness } from "../app/api/health/readiness/route";
import { GET as getMetrics } from "../app/api/telemetry/metrics/route";
import { GET as getLogs } from "../app/api/telemetry/logs/route";
import { GET as getTraces } from "../app/api/telemetry/traces/route";
import { GET as getAlerts, POST as postAlerts } from "../app/api/telemetry/alerts/route";
import { GET as getCircuitBreaker, POST as postCircuitBreaker } from "../app/api/telemetry/circuit-breaker/route";
import { NextRequest } from "next/server";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runPhase20Tests() {
  console.log("\n=========================================================================");
  console.log("🚀 Starting CodeAtlas Phase 20: Enterprise Observability & Reliability Tests");
  console.log("=========================================================================\n");

  // -------------------------------------------------------------------------
  // SUITE 1: Secret Redaction & Structured Logging
  // -------------------------------------------------------------------------
  console.log("▶ SUITE 1: Secret Redaction & Zero-Leak Logging");
  const dummyGoogleKey = ["AIza", "SyD9876543210dummyGoogleKey12345"].join("");
  const dummyOpenAiKey = ["sk-", "abc123456789012345678901234567890"].join("");
  const testString = `Bearer secret_jwt_token_12345 ${dummyGoogleKey}${dummyOpenAiKey}`;
  const redacted = redactSecrets(testString);
  assert(!redacted.includes("secret_jwt_token_12345"), "Bearer token must be redacted");
  assert(!redacted.includes(dummyGoogleKey), "Gemini API key pattern must be redacted");
  assert(!redacted.includes(dummyOpenAiKey), "OpenAI API key pattern must be redacted");

  const sensitiveObj = {
    apiKey: "AIzaSecret12345",
    password: "super_secret_password",
    normalField: "public_value",
  };
  const redactedObj = redactSecrets(sensitiveObj);
  assert(redactedObj.apiKey === "[REDACTED]", "apiKey object property must be replaced with [REDACTED]");
  assert(redactedObj.password === "[REDACTED]", "password object property must be replaced with [REDACTED]");
  assert(redactedObj.normalField === "public_value", "Non-sensitive properties must be preserved");

  logger.clear();
  logger.info("auth.login", "User logged in with token Bearer 987654321", {
    userId: "usr_alex",
    metadata: { key: "secret_value" },
  });
  const logs = logger.getLogs({ search: "auth.login" });
  assert(logs.length > 0, "Logger must store and retrieve structured logs");
  assert(!logs[0].errorMessage?.includes("987654321"), "Logged text must not contain raw bearer token");
  console.log("  ✔ Secret redaction successfully sanitized tokens, passwords, keys, and objects.");

  // -------------------------------------------------------------------------
  // SUITE 2: Distributed Tracing & Correlation IDs
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 2: Distributed Tracing & Span Waterfall Lifecycles");
  tracer.clear();
  const correlationId = tracer.getOrCreateCorrelationId();
  assert(correlationId.startsWith("req_"), "Correlation ID generator must produce prefixed ID");

  const rootSpan = tracer.startSpan("http.request", { route: "/api/test" }, correlationId);
  const childSpan = tracer.startSpan("db.query", { table: "repositories" }, correlationId, rootSpan.span.id);
  childSpan.end("ok", { rows: 5 });
  rootSpan.end("ok", { httpStatus: 200 });

  const traces = tracer.getRecentTraces();
  assert(traces.length > 0, "Tracer must group spans into distributed traces");
  const currentTrace = traces.find((t) => t.traceId === correlationId);
  assert(!!currentTrace, "Trace must match generated correlationId");
  assert(currentTrace!.spanCount === 2, "Trace must include both root and child spans");
  assert(currentTrace!.spans.some((s) => s.parentId === rootSpan.span.id), "Child span must reference root span ID");
  console.log("  ✔ Distributed tracing tracked correlation IDs, span hierarchy, and timing waterfalls.");

  // -------------------------------------------------------------------------
  // SUITE 3: Circuit Breaker & Retry Mechanism
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 3: Fault Isolation & Circuit Breaker State Transitions");
  const testBreaker = new CircuitBreaker({ name: "test_service", threshold: 3, cooldownPeriodMs: 50 });
  assert(testBreaker.getState() === "CLOSED", "Circuit breaker must start in CLOSED state");

  // Trip the breaker with 3 consecutive failures
  for (let i = 0; i < 3; i++) {
    try {
      await testBreaker.execute(async () => {
        throw new Error("Downstream provider 500 error");
      });
    } catch {
      // expected
    }
  }

  assert(testBreaker.getState() === "OPEN", "Circuit breaker must transition to OPEN after 3 failures");

  let fastFailed = false;
  try {
    await testBreaker.execute(async () => "success");
  } catch (err: any) {
    if (err.message.includes("is OPEN. Fast-failing request")) fastFailed = true;
  }
  assert(fastFailed, "Circuit breaker must fast-fail requests while OPEN without executing action");

  // Wait for cooldown to test HALF_OPEN transition
  await new Promise((r) => setTimeout(r, 60));
  assert(testBreaker.getState() === "HALF_OPEN", "Breaker must transition to HALF_OPEN after cooldown period");

  // Successful execution in HALF_OPEN should reset to CLOSED
  const recoverResult = await testBreaker.execute(async () => "recovered");
  assert(recoverResult === "recovered", "Action must execute in HALF_OPEN");
  assert(testBreaker.getState() === "CLOSED", "Successful action in HALF_OPEN must reset breaker to CLOSED");

  // Test withRetry
  let attempts = 0;
  const retryResult = await withRetry(
    async () => {
      attempts++;
      if (attempts < 3) throw new Error("Temporary network blip");
      return "retry_success";
    },
    { maxRetries: 3, initialBackoffMs: 10 }
  );
  assert(retryResult === "retry_success", "withRetry must succeed after retries");
  assert(attempts === 3, `withRetry must have retried 3 times (got ${attempts})`);
  console.log("  ✔ Circuit breaker state machine and exponential backoff retry verified.");

  // -------------------------------------------------------------------------
  // SUITE 4: AI & Indexing Telemetry Collectors
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 4: AI & Indexing Operational Metrics");
  aiMetrics.reset();
  aiMetrics.recordRequest({
    durationMs: 400,
    success: true,
    provider: "google_gemini",
    model: "gemini-1.5-flash",
    tokensReported: 1500,
    retrievalDurationMs: 120,
    citationsReturned: 4,
    citationsVerified: 4,
  });
  aiMetrics.recordRequest({
    durationMs: 800,
    success: false,
    provider: "google_gemini",
    model: "gemini-1.5-flash",
    errorType: "rate_limit",
  });

  const aiSnapshot = aiMetrics.getSnapshot();
  assert(aiSnapshot.totalRequests === 2, "AI snapshot total requests must equal 2");
  assert(aiSnapshot.failedRequests === 1, "AI snapshot failed requests must equal 1");
  assert(aiSnapshot.rateLimitHits === 1, "AI snapshot rate limit hits must equal 1");
  assert(aiSnapshot.estimatedCostUsd > 0, "AI snapshot must calculate estimated token cost");

  jobMonitor.clear();
  const lock1 = jobMonitor.acquireJobLock("repo_core", "job_101");
  assert(lock1 === true, "First indexing lock must succeed");
  const lock2 = jobMonitor.acquireJobLock("repo_core", "job_102");
  assert(lock2 === false, "Duplicate concurrent indexing lock for same repository must be denied");
  assert(jobMonitor.isRepositoryLocked("repo_core"), "Repository must report locked status");
  jobMonitor.releaseJobLock("repo_core");
  assert(!jobMonitor.isRepositoryLocked("repo_core"), "Repository lock must be cleared after release");
  console.log("  ✔ AI metrics and repository concurrency locks passed all assertions.");

  // -------------------------------------------------------------------------
  // SUITE 5: Bounded Cache & Invalidation
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 5: Bounded Authorization-Aware Memory Cache");
  memoryCache.clear();
  const userKey = memoryCache.authAwareKey("impact", "usr_alex", "repo_1", "query_ast");
  assert(userKey === "impact:usr_alex:repo_1:query_ast", "authAwareKey must namespace by prefix, user, and repo");

  memoryCache.set("key1", "val1", 5000, ["repo_1"]);
  assert(memoryCache.get("key1") === "val1", "Cache get must return stored value");
  memoryCache.invalidateTag("repo_1");
  assert(memoryCache.get("key1") === null, "Invalidating tag must evict all tagged keys");
  console.log("  ✔ Memory cache TTL, tagging, and auth-aware key generation verified.");

  // -------------------------------------------------------------------------
  // SUITE 6: Operational Alert Engine
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 6: Alert Rules, Deduplication & Acknowledgment");
  alertEngine.clear();
  assert(alertEngine.getRules().length >= 5, "Alert engine must have default rules configured");

  // Trigger alert: api_error_rate = 12% (> 5% threshold)
  const activeAlerts1 = alertEngine.evaluateMetrics({
    api_error_rate: 12,
    api_p95_latency: 500,
    ai_failure_rate: 2,
    indexing_queue_depth: 1,
    db_latency: 5,
    circuit_breaker_open_count: 0,
  });

  assert(activeAlerts1.length === 1, "High error rate must trigger active incident");
  assert(activeAlerts1[0].ruleId === "rule_high_error_rate", "Incident ruleId must match high error rate rule");
  assert(activeAlerts1[0].status === "firing", "Incident status must be firing");

  // Deduplication check: evaluate again with elevated error rate
  const activeAlerts2 = alertEngine.evaluateMetrics({
    api_error_rate: 14,
    api_p95_latency: 500,
    ai_failure_rate: 2,
    indexing_queue_depth: 1,
    db_latency: 5,
    circuit_breaker_open_count: 0,
  });
  assert(activeAlerts2.length === 1, "Repeated breach must deduplicate without creating new incident");
  assert(activeAlerts2[0].currentValue === 14, "Incident current value must be updated");

  // Acknowledge incident
  const incidentId = activeAlerts2[0].id;
  const ackSuccess = alertEngine.acknowledgeIncident(incidentId, "SRE_Lead");
  assert(ackSuccess === true, "Incident acknowledgment must succeed");
  assert(alertEngine.getActiveIncidents()[0].status === "acknowledged", "Status must become acknowledged");

  // Recovery check: error rate drops to 1% (< 5% threshold)
  alertEngine.evaluateMetrics({
    api_error_rate: 1,
    api_p95_latency: 500,
    ai_failure_rate: 2,
    indexing_queue_depth: 1,
    db_latency: 5,
    circuit_breaker_open_count: 0,
  });
  assert(alertEngine.getActiveIncidents().length === 0, "Recovered metrics must auto-resolve active incidents");
  console.log("  ✔ Alert engine evaluation, deduplication, acknowledgment, and auto-resolution verified.");

  // -------------------------------------------------------------------------
  // SUITE 7: Live Health & Telemetry API Endpoints
  // -------------------------------------------------------------------------
  console.log("\n▶ SUITE 7: API Route Handlers Integration Verification");

  // 1. Health Probe
  const healthRes = await getHealth();
  assert(healthRes.status === 200, "Health probe endpoint must return 200 OK");
  const healthJson = await healthRes.json();
  assert(healthJson.status === "healthy" || healthJson.status === "degraded", "Health report status must be valid");
  assert(Array.isArray(healthJson.dependencies), "Health report must include dependencies list");
  assert(healthJson.checks.database === true, "Database check must pass");
  assert(healthJson.database.status === "connected", "Legacy database object must remain connected for compatibility");

  // 2. Liveness & Readiness Probes
  const livenessRes = await getLiveness();
  assert(livenessRes.status === 200, "Liveness endpoint must return 200");
  const livenessJson = await livenessRes.json();
  assert(livenessJson.status === "ok", "Liveness probe status must equal 'ok'");

  const readinessRes = await getReadiness();
  assert(readinessRes.status === 200, "Readiness endpoint must return 200");
  const readinessJson = await readinessRes.json();
  assert(readinessJson.ready === true, "Readiness probe must report ready = true");

  // 3. Telemetry Metrics Endpoint
  const reqMetrics = new NextRequest("http://localhost:3000/api/telemetry/metrics");
  const metricsRes = await getMetrics(reqMetrics);
  assert(metricsRes.status === 200, "/api/telemetry/metrics must return 200");
  const metricsJson = await metricsRes.json();
  assert(metricsJson.success === true, "Metrics API response must indicate success: true");
  assert(metricsJson.data.api.totalRequests !== undefined, "Metrics data must include API request counts");
  assert(Array.isArray(metricsJson.data.circuitBreakers), "Metrics data must include circuit breakers");

  // 4. Telemetry Logs Endpoint
  const reqLogs = new NextRequest("http://localhost:3000/api/telemetry/logs?limit=10");
  const logsRes = await getLogs(reqLogs);
  assert(logsRes.status === 200, "/api/telemetry/logs must return 200");
  const logsJson = await logsRes.json();
  assert(logsJson.success === true, "Logs API response must indicate success: true");

  // 5. Telemetry Traces Endpoint
  const reqTraces = new NextRequest("http://localhost:3000/api/telemetry/traces?limit=5");
  const tracesRes = await getTraces(reqTraces);
  assert(tracesRes.status === 200, "/api/telemetry/traces must return 200");
  const tracesJson = await tracesRes.json();
  assert(tracesJson.success === true, "Traces API response must indicate success: true");

  // 6. Circuit Breaker Control Endpoint
  const reqCbGet = new NextRequest("http://localhost:3000/api/telemetry/circuit-breaker");
  const cbGetRes = await getCircuitBreaker(reqCbGet);
  assert(cbGetRes.status === 200, "/api/telemetry/circuit-breaker GET must return 200");

  const reqCbTrip = new NextRequest("http://localhost:3000/api/telemetry/circuit-breaker", {
    method: "POST",
    body: JSON.stringify({ name: "ai_provider", action: "trip" }),
  });
  const cbTripRes = await postCircuitBreaker(reqCbTrip);
  assert(cbTripRes.status === 200, "Tripping circuit breaker via POST must succeed");
  assert(aiCircuitBreaker.getState() === "OPEN", "aiCircuitBreaker state must now be OPEN");

  // Reset breaker back to CLOSED
  const reqCbReset = new NextRequest("http://localhost:3000/api/telemetry/circuit-breaker", {
    method: "POST",
    body: JSON.stringify({ name: "ai_provider", action: "reset" }),
  });
  const cbResetRes = await postCircuitBreaker(reqCbReset);
  assert(cbResetRes.status === 200, "Resetting circuit breaker via POST must succeed");
  assert(aiCircuitBreaker.getState() === "CLOSED", "aiCircuitBreaker state must now be reset to CLOSED");

  console.log("  ✔ Health probes, telemetry APIs, logs, traces, and circuit breaker controls all verified.");

  console.log("\n=========================================================================");
  console.log("🎉 ALL PHASE 20 OBSERVABILITY & RELIABILITY TESTS PASSED WITH 100% SUCCESS!");
  console.log("=========================================================================\n");
}

runPhase20Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
