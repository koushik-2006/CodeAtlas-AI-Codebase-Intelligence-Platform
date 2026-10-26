import { NextResponse } from "next/server";
import { architectureEngine } from "@/lib/server/architecture-engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repoId") || searchParams.get("repository") || "sample-project";

    const { data, metrics } = architectureEngine.getGraph(repoId);

    return NextResponse.json({
      success: true,
      data: {
        repository: repoId,
        nodes: data.nodes,
        edges: data.edges,
        metrics,
        meta: {
          symbolCount: data.nodes.length,
          edgeCount: data.edges.length,
          circularCount: metrics.circularDependencies.length,
          isIndexed: true,
        },
      },
    });
  } catch (error: any) {
    console.error("Architecture graph retrieval error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load architecture graph" },
      { status: 500 }
    );
  }
}
