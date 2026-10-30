import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = getAuthenticatedUserId(request);
  const repo = db.getRepository(params.id, userId);
  if (!repo) {
    return NextResponse.json(
      { success: false, message: "Repository not found" },
      { status: 404 }
    );
  }

  const symbols = db.getCodeSymbols(params.id);
  const relationships = db.getCodeRelationships(params.id);

  return NextResponse.json({
    success: true,
    data: {
      repositoryId: params.id,
      symbols,
      relationships,
    },
    meta: {
      symbolCount: symbols.length,
      relationshipCount: relationships.length,
    },
  });
}
