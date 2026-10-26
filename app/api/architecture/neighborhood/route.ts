import { NextResponse } from "next/server";
import { architectureEngine } from "@/lib/server/architecture-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repoId") || "sample-project";
    const nodeId = searchParams.get("nodeId");
    const depth = parseInt(searchParams.get("depth") || "1", 10);

    if (!nodeId) {
      return NextResponse.json(
        { success: false, message: "nodeId query parameter is required" },
        { status: 400 }
      );
    }

    const neighborhood = architectureEngine.getNeighborhood(repoId, nodeId, depth);

    return NextResponse.json({
      success: true,
      data: neighborhood,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve neighborhood" },
      { status: 500 }
    );
  }
}
