import { NextResponse } from "next/server";
import { architectureEngine } from "@/lib/server/architecture-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repoId") || "sample-project";
    const sourceId = searchParams.get("sourceId") || searchParams.get("source");
    const targetId = searchParams.get("targetId") || searchParams.get("target");

    if (!sourceId || !targetId) {
      return NextResponse.json(
        { success: false, message: "Both source and target query parameters are required" },
        { status: 400 }
      );
    }

    const pathResult = architectureEngine.findPath(repoId, sourceId, targetId);

    return NextResponse.json({
      success: true,
      data: pathResult,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to calculate architecture path" },
      { status: 500 }
    );
  }
}
