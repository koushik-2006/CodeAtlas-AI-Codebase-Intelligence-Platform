import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/lib/server/workspace-service";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    const workspaces = workspaceService.getWorkspaces(userId);

    return NextResponse.json({
      success: true,
      data: { workspaces },
    });
  } catch (error: any) {
    console.error("GET /api/workspaces error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load workspaces" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(req);
    const body = await req.json().catch(() => ({}));

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Workspace name is required" },
        { status: 400 }
      );
    }

    const created = workspaceService.createWorkspace(userId, {
      name: body.name,
      description: body.description,
      settings: body.settings,
    });

    return NextResponse.json({
      success: true,
      data: created,
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/workspaces error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create workspace" },
      { status: 400 }
    );
  }
}
