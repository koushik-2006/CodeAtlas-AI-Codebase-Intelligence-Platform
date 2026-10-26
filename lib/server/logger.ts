/**
 * Structured, privacy-conscious production logger for CodeAtlas.
 * Automatically redacts bearer tokens, passwords, and API keys.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  operation?: string;
  correlationId?: string;
  durationMs?: number;
  userId?: string;
  repositoryId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Regex patterns for credential redacting
const SENSITIVE_PATTERNS = [
  /bearer\s+[\w\-._~+/]+=*/gi,
  /ghp_[a-zA-Z0-9]{20,}/gi,
  /github_pat_[a-zA-Z0-9_]{20,}/gi,
  /(password|secret|apikey|api_key|token)\s*[:=]\s*["']?[^"'\s]+["']?/gi,
  /AIza[0-9A-Za-z-_]{30,}/gi, // Google API keys
  /sk-[a-zA-Z0-9_\-]{20,}/gi, // OpenAI keys
];

export function sanitizeLogString(str: string): string {
  if (!str || typeof str !== "string") return str;
  let sanitized = str;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED_SECRET]");
  }
  return sanitized;
}

export function sanitizeMetadata(data?: Record<string, any>): Record<string, any> | undefined {
  if (!data) return undefined;
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("password") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("token") ||
      lowerKey.includes("key") ||
      lowerKey.includes("auth")
    ) {
      cleaned[key] = "[REDACTED]";
    } else if (typeof val === "string") {
      cleaned[key] = sanitizeLogString(val).slice(0, 300);
    } else if (typeof val === "object" && val !== null) {
      cleaned[key] = sanitizeMetadata(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

class StructuredLogger {
  private log(payload: LogPayload) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level: payload.level,
      message: sanitizeLogString(payload.message),
      operation: payload.operation,
      correlationId: payload.correlationId,
      durationMs: payload.durationMs,
      userId: payload.userId,
      repositoryId: payload.repositoryId,
      error: payload.error ? sanitizeLogString(payload.error) : undefined,
      metadata: sanitizeMetadata(payload.metadata),
    };

    const formatted = JSON.stringify(entry);

    switch (payload.level) {
      case "error":
        console.error(formatted);
        break;
      case "warn":
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
        break;
    }
  }

  info(message: string, context: Omit<LogPayload, "level" | "message"> = {}) {
    this.log({ level: "info", message, ...context });
  }

  warn(message: string, context: Omit<LogPayload, "level" | "message"> = {}) {
    this.log({ level: "warn", message, ...context });
  }

  error(message: string, context: Omit<LogPayload, "level" | "message"> = {}) {
    this.log({ level: "error", message, ...context });
  }

  debug(message: string, context: Omit<LogPayload, "level" | "message"> = {}) {
    if (process.env.NODE_ENV !== "production") {
      this.log({ level: "debug", message, ...context });
    }
  }
}

export const logger = new StructuredLogger();
