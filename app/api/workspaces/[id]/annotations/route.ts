import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/lib/server/workspace-service";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const repoId = searchParams.get("repoId") || "sample-project";
    const filePath = searchParams.get("filePath") || undefined;

    const annotations = workspaceService.getAnnotations(params.id, repoId, filePath);

    return NextResponse.json({
      success: true,
      data: { annotations },
    });
  } catch (error: any) {
    console.error(`GET /api/workspaces/${params.id}/annotations error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load annotations" },
      { status: 500 }
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

    if (!body.repositoryId || !body.filePath || !body.content || body.startLine === undefined) {
      return NextResponse.json(
        { success: false, error: "repositoryId, filePath, startLine, and content are required" },
        { status: 400 }
      );
    }

    const annotation = workspaceService.createAnnotation(actorId, params.id, {
      repositoryId: body.repositoryId,
      filePath: body.filePath,
      startLine: Number(body.startLine),
      endLine: Number(body.endLine || body.startLine),
      symbolName: body.symbolName,
      content: body.content,
      category: body.category || "architecture",
    });

    return NextResponse.json({
      success: true,
      data: annotation,
    }, { status: 201 });
  } catch (error: any) {
    console.error(`POST /api/workspaces/${params.id}/annotations error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create annotation" },
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

    if (!body.annotationId || !body.content) {
      return NextResponse.json(
        { success: false, error: "annotationId and content are required" },
        { status: 400 }
      );
    }

    const updated = workspaceService.updateAnnotation(
      actorId,
      params.id,
      body.annotationId,
      body.content
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error(`PATCH /api/workspaces/${params.id}/annotations error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update annotation" },
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
    let annotationId = searchParams.get("annotationId");

    if (!annotationId) {
      const body = await req.json().catch(() => ({}));
      annotationId = body.annotationId || body.id;
    }

    if (!annotationId) {
      return NextResponse.json(
        { success: false, error: "annotationId is required" },
        { status: 400 }
      );
    }

    const success = workspaceService.deleteAnnotation(actorId, params.id, annotationId);

    return NextResponse.json({
      success,
      message: "Annotation was successfully deleted",
    });
  } catch (error: any) {
    console.error(`DELETE /api/workspaces/${params.id}/annotations error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete annotation" },
      { status }
    );
  }
}
