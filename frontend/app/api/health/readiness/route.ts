import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

/**
 * Kubernetes / Load Balancer Readiness Probe.
 * Verifies critical dependencies (database and storage) are ready to accept traffic.
 */
export async function GET() {
  const startTime = Date.now();
  const errors: string[] = [];

  // Check 1: Database readiness
  try {
    const repos = db.getRepositories();
    if (!Array.isArray(repos)) {
      errors.push("Database returned invalid repository collection");
    }
  } catch (err: any) {
    errors.push(`Database connection failed: ${err.message}`);
  }

  // Check 2: Storage readiness
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (err: any) {
    errors.push(`Storage directory access failed: ${err.message}`);
  }

  if (errors.length > 0) {
    return NextResponse.json(
      {
        status: "not_ready",
        ready: false,
        timestamp: new Date().toISOString(),
        errors,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }

  return NextResponse.json(
    {
      status: "ready",
      ready: true,
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
