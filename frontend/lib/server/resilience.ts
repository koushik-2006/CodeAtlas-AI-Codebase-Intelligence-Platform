import { CircuitBreakerState, CircuitBreakerStatus } from "@/types/observability";
import { logger } from "./telemetry/logger";

export interface CircuitBreakerOptions {
  name: string;
  threshold?: number; // Consecutive failures before tripping
  cooldownPeriodMs?: number; // Time in OPEN state before trying HALF_OPEN
}

export class CircuitBreaker {
  public readonly name: string;
  private state: CircuitBreakerState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private consecutiveFailures = 0;
  private lastFailureTime?: number;
  private lastStateChange: number = Date.now();
  private readonly threshold: number;
  private readonly cooldownPeriodMs: number;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.threshold = options.threshold ?? 5;
    this.cooldownPeriodMs = options.cooldownPeriodMs ?? 30000;
  }

  getState(): CircuitBreakerState {
    if (this.state === "OPEN" && this.lastFailureTime) {
      if (Date.now() - this.lastFailureTime >= this.cooldownPeriodMs) {
        this.transitionTo("HALF_OPEN");
      }
    }
    return this.state;
  }

  private transitionTo(newState: CircuitBreakerState) {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    logger.info("resilience.circuit_breaker.state_change", `Circuit breaker '${this.name}' transitioned from ${oldState} to ${newState}`, {
      metadata: { breaker: this.name, oldState, newState, consecutiveFailures: this.consecutiveFailures },
    });
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === "OPEN") {
      const remainingCooldown = Math.max(0, this.cooldownPeriodMs - (Date.now() - (this.lastFailureTime || 0)));
      throw new Error(`CircuitBreaker '${this.name}' is OPEN. Fast-failing request (cooldown remaining: ${Math.round(remainingCooldown / 1000)}s).`);
    }

    try {
      const result = await action();
      this.recordSuccess();
      return result;
    } catch (err: any) {
      this.recordFailure(err);
      throw err;
    }
  }

  recordSuccess(): void {
    this.successCount++;
    if (this.state === "HALF_OPEN") {
      this.consecutiveFailures = 0;
      this.transitionTo("CLOSED");
    } else {
      this.consecutiveFailures = 0;
    }
  }

  recordFailure(error?: any): void {
    this.failureCount++;
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN" || this.consecutiveFailures >= this.threshold) {
      if (this.state !== "OPEN") {
        this.transitionTo("OPEN");
      }
    }
  }

  trip(): void {
    this.consecutiveFailures = this.threshold;
    this.lastFailureTime = Date.now();
    this.transitionTo("OPEN");
  }

  reset(): void {
    this.consecutiveFailures = 0;
    this.failureCount = 0;
    this.transitionTo("CLOSED");
  }

  getStatus(): CircuitBreakerStatus {
    return {
      name: this.name,
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : undefined,
      lastStateChange: new Date(this.lastStateChange).toISOString(),
      threshold: this.threshold,
      cooldownPeriodMs: this.cooldownPeriodMs,
    };
  }
}

// Registry of platform circuit breakers
export const aiCircuitBreaker = new CircuitBreaker({ name: "ai_provider", threshold: 4, cooldownPeriodMs: 25000 });
export const githubCircuitBreaker = new CircuitBreaker({ name: "github_api", threshold: 5, cooldownPeriodMs: 30000 });

export interface RetryOptions {
  maxRetries?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  isRetryable?: (error: any) => boolean;
}

/**
 * Retries an asynchronous function with exponential backoff and jitter.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialBackoff = options.initialBackoffMs ?? 200;
  const maxBackoff = options.maxBackoffMs ?? 2000;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      if (attempt > maxRetries) {
        throw err;
      }

      // Check if error is retryable (never retry 400, 401, 403, 404)
      const status = err.status || err.httpStatus;
      if (status && [400, 401, 403, 404].includes(status)) {
        throw err;
      }

      if (options.isRetryable && !options.isRetryable(err)) {
        throw err;
      }

      // Calculate exponential backoff with jitter
      const exponential = initialBackoff * Math.pow(2, attempt - 1);
      const capped = Math.min(exponential, maxBackoff);
      const jitter = capped * (0.8 + Math.random() * 0.4);

      await new Promise((resolve) => setTimeout(resolve, jitter));
    }
  }
}
