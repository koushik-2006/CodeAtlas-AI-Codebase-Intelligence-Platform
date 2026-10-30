import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/lib/server/db";
import { SystemHealthReport, DependencyHealth, HealthStatus } from "@/types/observability";
import { aiCircuitBreaker, githubCircuitBreaker } from "@/lib/server/resilience";
import { jobMonitor } from "@/lib/server/telemetry/job-monitor";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const dependencies: DependencyHealth[] = [];

  // 1. Database Health Check
  let dbHealthy = false;
  let dbLatency = 0;
  let reposCount = 0;
  try {
    const t0 = performance.now();
    const repos = db.getRepositories();
    reposCount = repos.length;
    dbLatency = Math.max(1, Math.round(performance.now() - t0));
    dbHealthy = true;
    dependencies.push({
      name: "Database (Atomic JSON Store)",
      category: "database",
      status: "healthy",
      latencyMs: dbLatency,
      details: `${reposCount} repositories indexed and accessible`,
      lastChecked: new Date().toISOString(),
    });
  } catch (err: any) {
    dependencies.push({
      name: "Database (Atomic JSON Store)",
      category: "database",
      status: "unhealthy",
      details: `Database read error: ${err.message}`,
      lastChecked: new Date().toISOString(),
    });
  }

  // 2. File Storage Health Check
  let storageHealthy = false;
  try {
    const dataDir = path.join(process.cwd(), "data");
    const testFile = path.join(dataDir, ".health-probe.tmp");
    fs.writeFileSync(testFile, "probe", "utf8");
    fs.unlinkSync(testFile);
    storageHealthy = true;
    dependencies.push({
      name: "Local Disk Storage",
      category: "file_storage",
      status: "healthy",
      details: "Read/write permissions verified in data directory",
      lastChecked: new Date().toISOString(),
    });
  } catch (err: any) {
    dependencies.push({
      name: "Local Disk Storage",
      category: "file_storage",
      status: "degraded",
      details: `Storage write check failed: ${err.message}`,
      lastChecked: new Date().toISOString(),
    });
  }

  // 3. AI Provider Health Check
  const aiKeyConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY);
  const aiBreakerStatus = aiCircuitBreaker.getStatus();
  const aiStatus =
    aiBreakerStatus.state === "OPEN"
      ? "unhealthy"
      : !aiKeyConfigured
      ? "unconfigured"
      : aiBreakerStatus.state === "HALF_OPEN"
      ? "degraded"
      : "healthy";

  dependencies.push({
    name: "AI Inference Provider",
    category: "ai_provider",
    status: aiStatus,
    circuitBreakerState: aiBreakerStatus.state,
    details: aiKeyConfigured
      ? `Provider active with circuit breaker in ${aiBreakerStatus.state} state`
      : "No AI API key configured; running in deterministic fallback mode",
    lastChecked: new Date().toISOString(),
  });

  // 4. VCS Gateway Health Check
  const ghBreakerStatus = githubCircuitBreaker.getStatus();
  dependencies.push({
    name: "GitHub VCS Gateway",
    category: "vcs_gateway",
    status: ghBreakerStatus.state === "OPEN" ? "unhealthy" : "healthy",
    circuitBreakerState: ghBreakerStatus.state,
    details: `GitHub API circuit breaker in ${ghBreakerStatus.state} state`,
    lastChecked: new Date().toISOString(),
  });

  // 5. Job Queue Health Check
  const jobSnapshot = jobMonitor.getSnapshot();
  dependencies.push({
    name: "Indexing Job Queue",
    category: "job_queue",
    status: jobSnapshot.queueDepth > 10 ? "degraded" : "healthy",
    details: `${jobSnapshot.activeJobsCount} active jobs, ${jobSnapshot.queueDepth} queued, freshness: ${jobSnapshot.indexFreshnessPercentage}%`,
    lastChecked: new Date().toISOString(),
  });

  // Determine overall health status
  const hasUnhealthy = dependencies.some((d) => d.status === "unhealthy");
  const hasDegraded = dependencies.some((d) => d.status === "degraded");
  const overallStatus: HealthStatus = hasUnhealthy ? "unhealthy" : hasDegraded ? "degraded" : "healthy";

  const mem = process.memoryUsage();
  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  const report: SystemHealthReport & {
    database: { status: string; repositoriesCount: number; storageType: string };
  } = {
    status: overallStatus,
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    dependencies,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryRssMb: Math.round(mem.rss / 1024 / 1024),
      memoryHeapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      memoryHeapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    },
    checks: {
      database: dbHealthy,
      storage: storageHealthy,
      aiProvider: aiStatus !== "unhealthy",
      jobQueue: jobSnapshot.queueDepth <= 10,
    },
    // Backwards-compatible database object
    database: {
      status: dbHealthy ? "connected" : "disconnected",
      repositoriesCount: reposCount,
      storageType: "json-atomic-disk",
    },
  };

  return NextResponse.json(report, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "x-response-time-ms": String(Date.now() - startTime),
    },
  });
}
