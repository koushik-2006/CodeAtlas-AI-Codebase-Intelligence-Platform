import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const repos = db.getRepositories();
    const mem = process.memoryUsage();

    return NextResponse.json(
      {
        status: "healthy",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: "connected",
          repositoriesCount: repos.length,
          storageType: "json-atomic-disk",
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          memoryRssMb: Math.round(mem.rss / 1024 / 1024),
          memoryHeapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Database or internal health probe failed",
      },
      { status: 503 }
    );
  }
}
