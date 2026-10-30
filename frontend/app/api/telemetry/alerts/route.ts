import { NextRequest, NextResponse } from "next/server";
import { alertEngine } from "@/lib/server/telemetry/alert-engine";
import { tracer } from "@/lib/server/telemetry/tracer";
import { createApiErrorResponse } from "@/lib/server/api-error";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const correlationId = tracer.getOrCreateCorrelationId(req.headers);

  try {
    const active = alertEngine.getActiveIncidents();
    const all = alertEngine.getAllIncidents();
    const rules = alertEngine.getRules();

    return NextResponse.json(
      {
        success: true,
        data: {
          active,
          history: all,
          rules,
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
      "ALERTS_FETCH_FAILED",
      `Failed to fetch alerts: ${err.message}`,
      correlationId
    );
  }
}

export async function POST(req: NextRequest) {
  const correlationId = tracer.getOrCreateCorrelationId(req.headers);
  const userId = getAuthenticatedUserId(req);

  try {
    const body = await req.json();
    const { incidentId, acknowledgedBy } = body || {};

    if (!incidentId || typeof incidentId !== "string") {
      return createApiErrorResponse(
        400,
        "validation",
        "INVALID_INCIDENT_ID",
        "incidentId is required and must be a string",
        correlationId
      );
    }

    const operator = acknowledgedBy || userId || "sre_operator";
    const ok = alertEngine.acknowledgeIncident(incidentId, operator);

    if (!ok) {
      return createApiErrorResponse(
        404,
        "not_found",
        "INCIDENT_NOT_FOUND_OR_RESOLVED",
        `Incident '${incidentId}' was not found or is already resolved`,
        correlationId
      );
    }

    return NextResponse.json(
      {
        success: true,
        acknowledged: true,
        incidentId,
        acknowledgedBy: operator,
        timestamp: new Date().toISOString(),
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
      "ALERT_ACK_FAILED",
      `Failed to acknowledge alert: ${err.message}`,
      correlationId
    );
  }
}
