import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { knowledgeGraphEngine } from "@/lib/server/knowledge-graph";
import { KnowledgeNodeType } from "@/types/knowledge-graph";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const repoId = params.id;
  const repo = db.getRepository(repoId, "usr_default");
  if (!repo) {
    return NextResponse.json(
      { success: false, message: `Repository '${repoId}' not found.` },
      { status: 404 }
    );
  }

  const url = new URL(request.url);
  const typesParam = url.searchParams.get("nodeTypes");
  const nodeTypes = typesParam ? (typesParam.split(",") as KnowledgeNodeType[]) : undefined;
  const verifiedOnly = url.searchParams.get("verifiedOnly") === "true";
  const searchQuery = url.searchParams.get("q") || undefined;
  const focusNodeId = url.searchParams.get("focus") || undefined;
  const radius = url.searchParams.get("radius") ? parseInt(url.searchParams.get("radius")!, 10) : undefined;
  const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : undefined;

  const data = knowledgeGraphEngine.getKnowledgeGraph(repoId, {
    nodeTypes,
    verifiedOnly,
    searchQuery,
    focusNodeId,
    neighborhoodRadius: radius,
    limit,
  });

  return NextResponse.json({
    success: true,
    data,
  });
}
