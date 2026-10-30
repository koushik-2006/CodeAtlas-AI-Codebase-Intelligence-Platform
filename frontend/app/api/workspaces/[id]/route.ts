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
    const workspace = workspaceService.getWorkspace(params.id, userId);

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: workspace,
    });
  } catch (error: any) {
    console.error(`GET /api/workspaces/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load workspace details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getAuthenticatedUserId(req);
    const body = await req.json().catch(() => ({}));

    const updated = workspaceService.updateWorkspace(userId, params.id, {
      name: body.name,
      description: body.description,
      settings: body.settings,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error(`PATCH /api/workspaces/${params.id} error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update workspace" },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = workspaceService.deleteWorkspace(userId, params.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error(`DELETE /api/workspaces/${params.id} error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete workspace" },
      { status }
    );
  }
}
