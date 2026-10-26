import { NextRequest, NextResponse } from "next/server";
import { multiRepoService } from "@/lib/server/multi-repo-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || undefined;
    const userId = "usr_default";

    const repositories = multiRepoService.getAuthorizedRepositories(userId, workspaceId);

    return NextResponse.json({
      success: true,
      data: repositories,
    });
  } catch (err: any) {
    console.error("Multi-repo repositories error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve authorized repositories" },
      { status: 500 }
    );
  }
}
