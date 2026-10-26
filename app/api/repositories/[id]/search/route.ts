import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || url.searchParams.get("query") || "";

  const repo = db.getRepository(params.id, "usr_default");
  if (!repo) {
    return NextResponse.json(
      { success: false, message: "Repository not found" },
      { status: 404 }
    );
  }

  if (!query.trim()) {
    return NextResponse.json({
      success: true,
      data: [],
      meta: { query: "" },
    });
  }

  const results = db.searchRepositoryCode(params.id, query);

  return NextResponse.json({
    success: true,
    data: results,
    meta: {
      query,
      total: results.length,
      repositoryId: params.id,
    },
  });
}
