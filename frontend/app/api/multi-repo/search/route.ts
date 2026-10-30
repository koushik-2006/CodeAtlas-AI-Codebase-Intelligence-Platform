import { NextRequest, NextResponse } from "next/server";
import { multiRepoService } from "@/lib/server/multi-repo-service";
import { CrossRepoSearchRequest } from "@/types/multi-repo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const reposParam = searchParams.get("repos");
    const repositoryIds = reposParam ? reposParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    const workspaceId = searchParams.get("workspaceId") || undefined;
    const category = (searchParams.get("category") as any) || "all";
    const language = searchParams.get("lang") || undefined;
    const exactSymbol = searchParams.get("exact") === "true";
    const limit = parseInt(searchParams.get("limit") || "40", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const userId = "usr_default";

    const searchRequest: CrossRepoSearchRequest = {
      query,
      repositoryIds,
      workspaceId,
      category,
      language,
      exactSymbol,
      limit,
      offset,
    };

    const results = multiRepoService.crossRepoSearch(userId, searchRequest);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err: any) {
    console.error("Cross-repo search error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute cross-repository search" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CrossRepoSearchRequest;
    const userId = "usr_default";

    const results = multiRepoService.crossRepoSearch(userId, body);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (err: any) {
    console.error("Cross-repo search POST error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute cross-repository search" },
      { status: 500 }
    );
  }
}
