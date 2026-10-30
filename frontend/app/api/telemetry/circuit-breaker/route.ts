import { NextRequest, NextResponse } from "next/server";
import { aiCircuitBreaker, githubCircuitBreaker } from "@/lib/server/resilience";
import { tracer } from "@/lib/server/telemetry/tracer";
import { createApiErrorResponse } from "@/lib/server/api-error";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = tracer.getOrCreateCorrelationId(req.headers);

  try {
    const breakers = [
      aiCircuitBreaker.getStatus(),
      githubCircuitBreaker.getStatus(),
    ];

    return NextResponse.json(
      {
        success: true,
        data: {
          breakers,
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
      "CIRCUIT_BREAKER_QUERY_FAILED",
      `Failed to query circuit breakers: ${err.message}`,
      correlationId
    );
  }
}

export async function POST(req: NextRequest) {
  const correlationId = tracer.getOrCreateCorrelationId(req.headers);

  try {
    const body = await req.json();
    const { name, action } = body || {};

    if (!name || (name !== "ai_provider" && name !== "github_api")) {
      return createApiErrorResponse(
        400,
        "validation",
        "INVALID_BREAKER_NAME",
        "name must be either 'ai_provider' or 'github_api'",
        correlationId
      );
    }

    if (!action || (action !== "trip" && action !== "reset")) {
      return createApiErrorResponse(
        400,
        "validation",
        "INVALID_BREAKER_ACTION",
        "action must be either 'trip' or 'reset'",
        correlationId
      );
    }

    const targetBreaker = name === "ai_provider" ? aiCircuitBreaker : githubCircuitBreaker;

    if (action === "trip") {
      targetBreaker.trip();
    } else {
      targetBreaker.reset();
    }

    return NextResponse.json(
      {
        success: true,
        message: `Circuit breaker '${name}' was successfully ${action === "trip" ? "tripped to OPEN" : "reset to CLOSED"}.`,
        breaker: targetBreaker.getStatus(),
      },
      {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      }
    );
  } catch (err: any) {
    return createApiErrorResponse(
      500,
      "internal_error",
      "CIRCUIT_BREAKER_ACTION_FAILED",
      `Failed to modify circuit breaker: ${err.message}`,
      correlationId
    );
  }
}
