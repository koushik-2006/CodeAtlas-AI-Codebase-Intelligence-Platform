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
    const type = searchParams.get("type") || undefined;

    const artifacts = workspaceService.getSharedArtifacts(params.id, userId, type);

    return NextResponse.json({
      success: true,
      data: { artifacts },
    });
  } catch (error: any) {
    console.error(`GET /api/workspaces/${params.id}/artifacts error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load artifacts" },
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

    if (!body.title || !body.type || !body.content) {
      return NextResponse.json(
        { success: false, error: "Title, type, and content are required" },
        { status: 400 }
      );
    }

    const artifact = workspaceService.createSharedArtifact(actorId, params.id, {
      title: body.title,
      description: body.description || "",
      type: body.type,
      content: body.content,
      repositoryId: body.repositoryId,
      sourceRevision: body.sourceRevision,
      visibility: body.visibility || "workspace",
      metadata: body.metadata,
    });

    return NextResponse.json({
      success: true,
      data: artifact,
    }, { status: 201 });
  } catch (error: any) {
    console.error(`POST /api/workspaces/${params.id}/artifacts error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create artifact" },
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

    if (!body.artifactId) {
      return NextResponse.json(
        { success: false, error: "artifactId is required" },
        { status: 400 }
      );
    }

    const updated = workspaceService.updateSharedArtifact(actorId, params.id, body.artifactId, {
      title: body.title,
      description: body.description,
      content: body.content,
      visibility: body.visibility,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error(`PATCH /api/workspaces/${params.id}/artifacts error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update artifact" },
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
    let artifactId = searchParams.get("artifactId");

    if (!artifactId) {
      const body = await req.json().catch(() => ({}));
      artifactId = body.artifactId || body.id;
    }

    if (!artifactId) {
      return NextResponse.json(
        { success: false, error: "artifactId is required" },
        { status: 400 }
      );
    }

    const success = workspaceService.deleteSharedArtifact(actorId, params.id, artifactId);

    return NextResponse.json({
      success,
      message: "Artifact was successfully deleted",
    });
  } catch (error: any) {
    console.error(`DELETE /api/workspaces/${params.id}/artifacts error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete artifact" },
      { status }
    );
  }
}
