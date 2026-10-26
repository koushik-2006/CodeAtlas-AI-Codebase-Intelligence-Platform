import { AIMetricsSnapshot } from "@/types/observability";

export class AIMetricsCollector {
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private rateLimitHits = 0;
  private timeoutHits = 0;
  private latencies: number[] = [];
  private totalTokensReported = 0;
  private totalTokensEstimated = 0;
  private estimatedCostUsd = 0;
  private retrievalDurations: number[] = [];
  private citationsCountList: number[] = [];
  private verifiedCitationsCount = 0;
  private totalCitationsEvaluated = 0;

  recordRequest(params: {
    durationMs: number;
    success: boolean;
    provider: string;
    model: string;
    tokensReported?: number;
    tokensEstimated?: number;
    errorType?: "timeout" | "rate_limit" | "other";
    retrievalDurationMs?: number;
    citationsReturned?: number;
    citationsVerified?: number;
  }): void {
    this.totalRequests++;

    if (params.success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
      if (params.errorType === "rate_limit") this.rateLimitHits++;
      if (params.errorType === "timeout") this.timeoutHits++;
    }

    this.latencies.push(params.durationMs);
    if (this.latencies.length > 500) this.latencies.shift();

    if (params.tokensReported) {
      this.totalTokensReported += params.tokensReported;
      // Estimate cost (~$0.00015 per 1K tokens standard for flash/mini)
      this.estimatedCostUsd += (params.tokensReported / 1000) * 0.00015;
    } else if (params.tokensEstimated) {
      this.totalTokensEstimated += params.tokensEstimated;
      this.estimatedCostUsd += (params.tokensEstimated / 1000) * 0.00015;
    }

    if (params.retrievalDurationMs) {
      this.retrievalDurations.push(params.retrievalDurationMs);
      if (this.retrievalDurations.length > 200) this.retrievalDurations.shift();
    }

    if (params.citationsReturned !== undefined) {
      this.citationsCountList.push(params.citationsReturned);
      if (this.citationsCountList.length > 200) this.citationsCountList.shift();
      this.totalCitationsEvaluated += params.citationsReturned;
    }

    if (params.citationsVerified !== undefined) {
      this.verifiedCitationsCount += params.citationsVerified;
    }
  }

  getSnapshot(activeProvider: string = "gemini", activeModel: string = "gemini-1.5-flash"): AIMetricsSnapshot {
    const errorRate = this.totalRequests > 0 ? (this.failedRequests / this.totalRequests) * 100 : 0;
    const avgLatency = this.latencies.length > 0 ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length : 0;

    // Calculate P95 latency
    let p95Latency = 0;
    if (this.latencies.length > 0) {
      const sorted = [...this.latencies].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      p95Latency = sorted[p95Index] || sorted[sorted.length - 1];
    }

    const avgRetrievalDuration =
      this.retrievalDurations.length > 0
        ? this.retrievalDurations.reduce((a, b) => a + b, 0) / this.retrievalDurations.length
        : 0;

    const avgCitations =
      this.citationsCountList.length > 0
        ? this.citationsCountList.reduce((a, b) => a + b, 0) / this.citationsCountList.length
        : 0;

    const citationValidationSuccessRate =
      this.totalCitationsEvaluated > 0
        ? (this.verifiedCitationsCount / this.totalCitationsEvaluated) * 100
        : 100;

    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      errorRatePercentage: Number(errorRate.toFixed(1)),
      avgLatencyMs: Math.round(avgLatency),
      p95LatencyMs: Math.round(p95Latency),
      totalTokensReported: this.totalTokensReported,
      totalTokensEstimated: this.totalTokensEstimated,
      estimatedCostUsd: Number(this.estimatedCostUsd.toFixed(4)),
      rateLimitHits: this.rateLimitHits,
      timeoutHits: this.timeoutHits,
      retrievalAvgDurationMs: Math.round(avgRetrievalDuration),
      avgCitationsPerResponse: Number(avgCitations.toFixed(1)),
      citationValidationSuccessRate: Number(citationValidationSuccessRate.toFixed(1)),
      activeProvider,
      activeModel,
    };
  }

  reset(): void {
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.rateLimitHits = 0;
    this.timeoutHits = 0;
    this.latencies = [];
    this.totalTokensReported = 0;
    this.totalTokensEstimated = 0;
    this.estimatedCostUsd = 0;
    this.retrievalDurations = [];
    this.citationsCountList = [];
    this.verifiedCitationsCount = 0;
    this.totalCitationsEvaluated = 0;
  }
}

export const aiMetrics = new AIMetricsCollector();
