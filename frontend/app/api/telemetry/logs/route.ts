import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/server/telemetry/logger";
import { tracer } from "@/lib/server/telemetry/tracer";
import { LogLevel } from "@/types/observability";
import { createApiErrorResponse } from "@/lib/server/api-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = tracer.getOrCreateCorrelationId(req.headers);
  const { searchParams } = new URL(req.url);

  try {
    const level = searchParams.get("level") as LogLevel | null;
    const logCorrelationId = searchParams.get("correlationId") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;

    const logs = logger.getLogs({
      level: level || undefined,
      correlationId: logCorrelationId,
      search,
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          total: logs.length,
          logs,
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
      "LOGS_QUERY_FAILED",
      `Failed to query telemetry logs: ${err.message}`,
      correlationId
    );
  }
}
