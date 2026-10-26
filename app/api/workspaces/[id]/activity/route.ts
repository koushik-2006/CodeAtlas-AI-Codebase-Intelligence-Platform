import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/lib/server/workspace-service";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getAuthenticatedUserId(req);
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category") || undefined;
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    const result = workspaceService.getWorkspaceActivities(
      params.id,
      userId,
      category,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error(`GET /api/workspaces/${params.id}/activity error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load workspace activity" },
      { status }
    );
  }
}
