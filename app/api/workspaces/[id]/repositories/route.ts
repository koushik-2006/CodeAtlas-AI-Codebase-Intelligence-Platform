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
    const repositories = workspaceService.getWorkspaceRepositories(params.id, userId);

    return NextResponse.json({
      success: true,
      data: { repositories },
    });
  } catch (error: any) {
    console.error(`GET /api/workspaces/${params.id}/repositories error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load repositories" },
      { status }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actorId = getAuthenticatedUserId(req);
    const body = await req.json().catch(() => ({}));

    if (!body.repositoryId) {
      return NextResponse.json(
        { success: false, error: "repositoryId is required" },
        { status: 400 }
      );
    }

    const connected = workspaceService.connectRepositoryToWorkspace(
      actorId,
      params.id,
      body.repositoryId
    );

    return NextResponse.json({
      success: true,
      data: connected,
    }, { status: 201 });
  } catch (error: any) {
    console.error(`POST /api/workspaces/${params.id}/repositories error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to connect repository" },
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
    let repoId = searchParams.get("repositoryId");

    if (!repoId) {
      const body = await req.json().catch(() => ({}));
      repoId = body.repositoryId || body.id;
    }

    if (!repoId) {
      return NextResponse.json(
        { success: false, error: "repositoryId is required" },
        { status: 400 }
      );
    }

    const success = workspaceService.disconnectRepositoryFromWorkspace(actorId, params.id, repoId);

    return NextResponse.json({
      success,
      message: "Repository was disconnected from the workspace",
    });
  } catch (error: any) {
    console.error(`DELETE /api/workspaces/${params.id}/repositories error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to disconnect repository" },
      { status }
    );
  }
}
