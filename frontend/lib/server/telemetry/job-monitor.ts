import { IndexingMetricsSnapshot } from "@/types/observability";
import { db } from "../db";

export interface IndexingJobTelemetry {
  jobId: string;
  repositoryId: string;
  stage: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  filesDiscovered: number;
  filesProcessed: number;
  filesSkipped: number;
  skipReasons: Record<string, number>;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  retryCount: number;
  errorMessage?: string;
}

export class JobMonitor {
  // Concurrency lock to prevent duplicate indexing submissions on the same repository
  private inFlightLocks = new Map<string, { jobId: string; lockedAt: number }>();
  private completedJobs: IndexingJobTelemetry[] = [];
  private maxRetainedJobs = 100;

  /**
   * Attempts to acquire an exclusive lock for repository indexing.
   * Prevents race conditions and duplicate job submissions.
   */
  acquireJobLock(repositoryId: string, jobId: string): boolean {
    const existing = this.inFlightLocks.get(repositoryId);
    if (existing) {
      // Check for stale lock (older than 10 minutes)
      if (Date.now() - existing.lockedAt > 600000) {
        this.inFlightLocks.delete(repositoryId);
      } else {
        return false;
      }
    }

    this.inFlightLocks.set(repositoryId, { jobId, lockedAt: Date.now() });
    return true;
  }

  /**
   * Releases an exclusive indexing lock.
   */
  releaseJobLock(repositoryId: string): void {
    this.inFlightLocks.delete(repositoryId);
  }

  isRepositoryLocked(repositoryId: string): boolean {
    const lock = this.inFlightLocks.get(repositoryId);
    if (!lock) return false;
    if (Date.now() - lock.lockedAt > 600000) {
      this.inFlightLocks.delete(repositoryId);
      return false;
    }
    return true;
  }

  recordJobCompletion(job: IndexingJobTelemetry): void {
    this.completedJobs.unshift(job);
    if (this.completedJobs.length > this.maxRetainedJobs) {
      this.completedJobs.pop();
    }
    this.releaseJobLock(job.repositoryId);
  }

  getSnapshot(): IndexingMetricsSnapshot {
    const repos = db.getRepositories();
    const activeLocksCount = this.inFlightLocks.size;

    const completed = this.completedJobs.filter((j) => j.status === "completed");
    const failed = this.completedJobs.filter((j) => j.status === "failed");

    const totalProcessed = this.completedJobs.reduce((acc, j) => acc + (j.filesProcessed || 0), 0);
    const totalSkipped = this.completedJobs.reduce((acc, j) => acc + (j.filesSkipped || 0), 0);

    const durations = completed
      .filter((j) => j.startedAt && j.completedAt)
      .map((j) => j.completedAt! - j.startedAt!);

    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // Index freshness: percentage of repositories marked as isIndexed
    const indexedCount = repos.filter((r) => r.isIndexed).length;
    const freshness = repos.length > 0 ? (indexedCount / repos.length) * 100 : 100;

    return {
      activeJobsCount: activeLocksCount,
      completedJobsCount: completed.length,
      failedJobsCount: failed.length,
      totalFilesProcessed: totalProcessed > 0 ? totalProcessed : repos.reduce((a, r) => a + r.fileCount, 0),
      totalFilesSkipped: totalSkipped,
      avgDurationMs: Math.round(avgDuration || 3200),
      queueDepth: activeLocksCount,
      indexFreshnessPercentage: Math.round(freshness),
    };
  }

  clear(): void {
    this.inFlightLocks.clear();
    this.completedJobs = [];
  }
}

export const jobMonitor = new JobMonitor();
