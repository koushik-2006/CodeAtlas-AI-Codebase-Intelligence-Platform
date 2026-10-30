import { LogLevel, StructuredLogEntry, OperationOutcome } from "@/types/observability";

// Regex patterns for sensitive secret tokens and credentials
const SECRET_PATTERNS = [
  /Bearer\s+([a-zA-Z0-9_\-\.]+)/gi,
  /(AIza[0-9A-Za-z\-_]{35})/g,
  /(gh[pousr]_[A-Za-z0-9_]{36,})/g,
  /(sk-[a-zA-Z0-9_-]{32,})/g,
  /(eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/g, // JWTs
  /(password|passwd|secret|api_key|apikey|token|access_token|private_key)["']?\s*[:=]\s*["']?([^"'\s,}]+)/gi,
];

const SENSITIVE_KEY_NAMES = new Set([
  "password",
  "secret",
  "token",
  "accesstoken",
  "access_token",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "session_token",
  "privatekey",
  "private_key",
  "geminikey",
  "openaikey",
  "anthropickey",
]);

/**
 * Deeply redacts sensitive strings and object keys.
 */
export function redactSecrets(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    let sanitized = data;

    // Bearer tokens: replace token part with [REDACTED]
    sanitized = sanitized.replace(/Bearer\s+([a-zA-Z0-9_\-\.]+)/gi, "Bearer [REDACTED]");

    // Key-value credentials (e.g. password=..., api_key: "...")
    sanitized = sanitized.replace(
      /(password|passwd|secret|api_key|apikey|token|access_token|private_key)(["']?\s*[:=]\s*["']?)([^"'\s,}]+)/gi,
      "$1$2[REDACTED]"
    );

    // Known token signatures
    sanitized = sanitized.replace(/(AIza[0-9A-Za-z\-_]{10,})/g, "[REDACTED]");
    sanitized = sanitized.replace(/(gh[pousr]_[A-Za-z0-9_]{16,})/g, "[REDACTED]");
    sanitized = sanitized.replace(/(sk-[a-zA-Z0-9_\-]{16,})/g, "[REDACTED]");
    sanitized = sanitized.replace(/(eyJ[a-zA-Z0-9_\-]{8,}\.[a-zA-Z0-9_\-]{8,}\.[a-zA-Z0-9_\-]+)/g, "[REDACTED]");

    return sanitized;
  }


  if (Array.isArray(data)) {
    return data.map((item) => redactSecrets(item));
  }

  if (typeof data === "object") {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      const lowerKey = key.toLowerCase().replace(/[_-]/g, "");
      if (SENSITIVE_KEY_NAMES.has(lowerKey)) {
        cleaned[key] = "[REDACTED]";
      } else {
        cleaned[key] = redactSecrets(val);
      }
    }
    return cleaned;
  }

  return data;
}

export class StructuredLogger {
  private logRingBuffer: StructuredLogEntry[] = [];
  private maxBufferSize = 300;
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV || "development";
  }

  private record(
    level: LogLevel,
    operation: string,
    message: string,
    params?: {
      correlationId?: string;
      durationMs?: number;
      outcome?: OperationOutcome;
      errorCategory?: string;
      httpStatus?: number;
      route?: string;
      userId?: string;
      repositoryId?: string;
      metadata?: Record<string, any>;
    }
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      service: "codeatlas-core",
      environment: this.environment,
      correlationId: params?.correlationId || "req_system_internal",
      operation: redactSecrets(operation),
      errorMessage: level === "error" || level === "fatal" ? redactSecrets(message) : undefined,
      durationMs: params?.durationMs,
      outcome: params?.outcome || (level === "error" || level === "fatal" ? "failure" : "success"),
      errorCategory: params?.errorCategory,
      httpStatus: params?.httpStatus,
      route: params?.route,
      userId: params?.userId ? redactSecrets(params.userId) : undefined,
      repositoryId: params?.repositoryId ? redactSecrets(params.repositoryId) : undefined,
      metadata: params?.metadata ? redactSecrets(params.metadata) : undefined,
    };

    // Store in in-memory ring buffer
    this.logRingBuffer.unshift(entry);
    if (this.logRingBuffer.length > this.maxBufferSize) {
      this.logRingBuffer.pop();
    }

    // Standard console format for dev / test / stdout
    const logStr = JSON.stringify(entry);
    if (level === "error" || level === "fatal") {
      console.error(logStr);
    } else if (level === "warn") {
      console.warn(logStr);
    } else if (process.env.NODE_ENV !== "test") {
      console.log(logStr);
    }

    return entry;
  }

  debug(operation: string, message: string, params?: any): StructuredLogEntry {
    return this.record("debug", operation, message, params);
  }

  info(operation: string, message: string, params?: any): StructuredLogEntry {
    return this.record("info", operation, message, params);
  }

  warn(operation: string, message: string, params?: any): StructuredLogEntry {
    return this.record("warn", operation, message, params);
  }

  error(operation: string, message: string, params?: any): StructuredLogEntry {
    return this.record("error", operation, message, params);
  }

  fatal(operation: string, message: string, params?: any): StructuredLogEntry {
    return this.record("fatal", operation, message, params);
  }

  getLogs(filter?: {
    level?: LogLevel;
    correlationId?: string;
    search?: string;
    limit?: number;
  }): StructuredLogEntry[] {
    let result = this.logRingBuffer;

    if (filter?.level) {
      result = result.filter((l) => l.level === filter.level);
    }
    if (filter?.correlationId) {
      result = result.filter((l) => l.correlationId === filter.correlationId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.operation.toLowerCase().includes(q) ||
          l.errorMessage?.toLowerCase().includes(q) ||
          l.correlationId.toLowerCase().includes(q)
      );
    }

    return result.slice(0, filter?.limit || 100);
  }

  clear(): void {
    this.logRingBuffer = [];
  }
}

export const logger = new StructuredLogger();
