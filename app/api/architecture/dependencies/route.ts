import { NextResponse } from "next/server";
import { architectureEngine } from "@/lib/server/architecture-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repoId") || "sample-project";
    const nodeId = searchParams.get("nodeId");

    if (!nodeId) {
      return NextResponse.json(
        { success: false, message: "nodeId query parameter is required" },
        { status: 400 }
      );
    }

    const analysis = architectureEngine.getDependencyAnalysis(repoId, nodeId);
    if (!analysis) {
      return NextResponse.json(
        { success: false, message: "Node not found in indexed graph" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to retrieve dependency analysis" },
      { status: 500 }
    );
  }
}
