import { NextRequest, NextResponse } from "next/server";
import { tracer } from "@/lib/server/telemetry/tracer";
import { createApiErrorResponse } from "@/lib/server/api-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = tracer.getOrCreateCorrelationId(req.headers);
  const { searchParams } = new URL(req.url);

  try {
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 25;
    const traces = tracer.getRecentTraces(limit);
    const recentSpans = tracer.getRecentSpans(limit * 2);

    return NextResponse.json(
      {
        success: true,
        data: {
          traces,
          recentSpans,
        },
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
    return createApiErrorResponse(
      500,
      "internal_error",
      "TRACES_FETCH_FAILED",
      `Failed to fetch distributed traces: ${err.message}`,
      correlationId
    );
  }
}
