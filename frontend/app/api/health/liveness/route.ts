import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Kubernetes / Container Liveness Probe.
 * Returns 200 if the process is running and event loop is responsive.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
