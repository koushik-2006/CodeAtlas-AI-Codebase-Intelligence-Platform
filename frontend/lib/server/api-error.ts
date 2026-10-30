import { NextResponse } from "next/server";
import { StandardApiErrorResponse } from "@/types/observability";
import { logger } from "./telemetry/logger";

export function createApiErrorResponse(
  status: number,
  category: StandardApiErrorResponse["error"]["category"],
  code: string,
  message: string,
  correlationId: string,
  details?: any
): NextResponse<StandardApiErrorResponse> {
  const errorObj = {
    code,
    message,
    correlationId,
    category,
    timestamp: new Date().toISOString(),
    details,
  };

  logger.error("api.error_response", message, {
    correlationId,
    httpStatus: status,
    errorCategory: category,
    metadata: errorObj,
  });

  return NextResponse.json(
    {
      success: false,
      error: errorObj,
    },
    {
      status,
      headers: {
        "x-correlation-id": correlationId,
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
