import { TraceSpan, DistributedTrace } from "@/types/observability";

export class RequestTracer {
  private spans: TraceSpan[] = [];
  private maxStoredSpans = 500;

  /**
   * Generates or extracts correlation ID from HTTP headers or options.
   */
  getOrCreateCorrelationId(headers?: Headers | Record<string, string | string[] | undefined>): string {
    if (!headers) {
      return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    if (typeof (headers as any).get === "function") {
      const h = headers as Headers;
      const val = h.get("x-correlation-id") || h.get("x-request-id") || h.get("traceparent");
      if (val) return val.replace("00-", "").slice(0, 36);
    } else {
      const rec = headers as Record<string, any>;
      const val = rec["x-correlation-id"] || rec["x-request-id"] || rec["traceparent"];
      if (typeof val === "string" && val.trim()) return val.replace("00-", "").slice(0, 36);
    }

    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Starts a new span in the distributed trace.
   */
  startSpan(
    name: string,
    attributes: Record<string, any> = {},
    traceId?: string,
    parentId?: string
  ): {
    span: TraceSpan;
    end: (status?: "ok" | "error", extraAttrs?: Record<string, any>) => TraceSpan;
    addEvent: (eventName: string, eventAttrs?: Record<string, any>) => void;
  } {
    const id = `span_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const effectiveTraceId = traceId || `trace_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const span: TraceSpan = {
      id,
      traceId: effectiveTraceId,
      parentId,
      name,
      service: "codeatlas-service",
      startTime: Date.now(),
      status: "in_progress",
      attributes: { ...attributes },
      events: [],
    };

    this.spans.unshift(span);
    if (this.spans.length > this.maxStoredSpans) {
      this.spans.pop();
    }

    const end = (status: "ok" | "error" = "ok", extraAttrs?: Record<string, any>): TraceSpan => {
      span.endTime = Date.now();
      span.durationMs = Math.max(1, span.endTime - span.startTime);
      span.status = status;
      if (extraAttrs) {
        span.attributes = { ...span.attributes, ...extraAttrs };
      }
      return span;
    };

    const addEvent = (eventName: string, eventAttrs?: Record<string, any>) => {
      span.events.push({
        name: eventName,
        timestamp: new Date().toISOString(),
        attributes: eventAttrs,
      });
    };

    return { span, end, addEvent };
  }

  /**
   * Groups recorded spans into distributed traces for visualization.
   */
  getTraces(limit: number = 25): DistributedTrace[] {
    const traceMap = new Map<string, TraceSpan[]>();

    for (const span of this.spans) {
      if (!traceMap.has(span.traceId)) {
        traceMap.set(span.traceId, []);
      }
      traceMap.get(span.traceId)!.push(span);
    }

    const traces: DistributedTrace[] = [];

    for (const [traceId, spanList] of traceMap.entries()) {
      // Find root span (no parentId, or oldest)
      const sorted = [...spanList].sort((a, b) => a.startTime - b.startTime);
      const rootSpan = sorted.find((s) => !s.parentId) || sorted[0];

      const minStart = sorted[0].startTime;
      const maxEnd = Math.max(...sorted.map((s) => s.endTime || s.startTime));
      const hasError = sorted.some((s) => s.status === "error");

      traces.push({
        traceId,
        rootSpanName: rootSpan ? rootSpan.name : "HTTP Request",
        startTime: new Date(minStart).toISOString(),
        durationMs: Math.max(1, maxEnd - minStart),
        status: hasError ? "error" : "ok",
        spanCount: sorted.length,
        spans: sorted,
      });
    }

    return traces.slice(0, limit);
  }

  getRecentSpans(limit: number = 50): TraceSpan[] {
    return this.spans.slice(0, limit);
  }

  clear(): void {
    this.spans = [];
  }
}

export const tracer = new RequestTracer();
