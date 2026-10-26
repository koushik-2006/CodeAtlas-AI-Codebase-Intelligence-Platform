import { NextRequest, NextResponse } from "next/server";
import { multiRepoService } from "@/lib/server/multi-repo-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reposParam = searchParams.get("repos");
    const repositoryIds = reposParam ? reposParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
    const workspaceId = searchParams.get("workspaceId") || undefined;
    const userId = "usr_default";

    const duplicates = multiRepoService.discoverDuplicates(userId, repositoryIds, workspaceId);

    return NextResponse.json({
      success: true,
      data: duplicates,
    });
  } catch (err: any) {
    console.error("Multi-repo duplicates error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to discover duplicate implementations" },
      { status: 500 }
    );
  }
}
