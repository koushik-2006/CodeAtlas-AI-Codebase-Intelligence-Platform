import { NextRequest, NextResponse } from "next/server";
import { metricsCollector } from "@/lib/server/telemetry/metrics-collector";
import { tracer } from "@/lib/server/telemetry/tracer";
import { createApiErrorResponse } from "@/lib/server/api-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = tracer.getOrCreateCorrelationId(req.headers);
  const spanContext = tracer.startSpan("api.telemetry.metrics.get", {}, correlationId);
  const t0 = performance.now();

  try {
    const snapshot = metricsCollector.getSnapshot();
    const duration = Math.round(performance.now() - t0);

    metricsCollector.recordApiRequest({
      route: "/api/telemetry/metrics",
      method: "GET",
      statusCode: 200,
      durationMs: duration,
    });

    spanContext.end("ok", { durationMs: duration });

    return NextResponse.json(
      {
        success: true,
        data: snapshot,
      },
      {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err: any) {
    const duration = Math.round(performance.now() - t0);
    metricsCollector.recordApiRequest({
      route: "/api/telemetry/metrics",
      method: "GET",
      statusCode: 500,
      durationMs: duration,
      error: err.message,
    });
    spanContext.end("error", { error: err.message });

    return createApiErrorResponse(
      500,
      "internal_error",
      "METRICS_FETCH_FAILED",
      `Failed to aggregate operational metrics: ${err.message}`,
      correlationId
    );
  }
}
