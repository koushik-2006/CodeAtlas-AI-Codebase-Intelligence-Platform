import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/lib/server/workspace-service";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";
import { WorkspaceRole } from "@/types/workspace";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getAuthenticatedUserId(req);
    const members = workspaceService.getWorkspaceMembers(params.id, userId);

    return NextResponse.json({
      success: true,
      data: { members },
    });
  } catch (error: any) {
    console.error(`GET /api/workspaces/${params.id}/members error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load workspace members" },
      { status }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actorId = getAuthenticatedUserId(req);
    const body = await req.json().catch(() => ({}));

    const { targetUserId, role } = body;
    if (!targetUserId || !role) {
      return NextResponse.json(
        { success: false, error: "targetUserId and role are required" },
        { status: 400 }
      );
    }

    const validRoles: WorkspaceRole[] = ["owner", "admin", "member", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const updated = workspaceService.updateMemberRole(actorId, params.id, targetUserId, role);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error(`PATCH /api/workspaces/${params.id}/members error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update member role" },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actorId = getAuthenticatedUserId(req);
    const { searchParams } = new URL(req.url);
    let targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      const body = await req.json().catch(() => ({}));
      targetUserId = body.targetUserId || body.userId;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "targetUserId is required" },
        { status: 400 }
      );
    }

    const success = workspaceService.removeMember(actorId, params.id, targetUserId);

    return NextResponse.json({
      success,
      message: "Member was successfully removed from the workspace",
    });
  } catch (error: any) {
    console.error(`DELETE /api/workspaces/${params.id}/members error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove member" },
      { status }
    );
  }
}
