import { NextRequest, NextResponse } from "next/server";
import { multiRepoService } from "@/lib/server/multi-repo-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || undefined;
    const userId = "usr_default";

    const insights = multiRepoService.getTechnologyInsights(userId, workspaceId);

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (err: any) {
    console.error("Technology insights error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve technology insights" },
      { status: 500 }
    );
  }
}
