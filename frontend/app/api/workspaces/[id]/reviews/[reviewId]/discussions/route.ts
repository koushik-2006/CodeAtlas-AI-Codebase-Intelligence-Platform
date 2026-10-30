import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/lib/server/workspace-service";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const findingId = searchParams.get("findingId");

    if (!findingId) {
      return NextResponse.json(
        { success: false, error: "findingId is required" },
        { status: 400 }
      );
    }

    const discussions = workspaceService.getFindingDiscussions(
      params.id,
      params.reviewId,
      findingId
    );
    const decision = workspaceService.getFindingDecision(
      params.id,
      params.reviewId,
      findingId
    );

    return NextResponse.json({
      success: true,
      data: {
        discussions,
        decision,
      },
    });
  } catch (error: any) {
    console.error(`GET /api/workspaces/${params.id}/reviews/${params.reviewId}/discussions error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load discussions" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
) {
  try {
    const actorId = getAuthenticatedUserId(req);
    const body = await req.json().catch(() => ({}));

    const { findingId, repositoryId, comment, decision } = body;

    if (!findingId || !repositoryId) {
      return NextResponse.json(
        { success: false, error: "findingId and repositoryId are required" },
        { status: 400 }
      );
    }

    let addedDiscussion = null;
    let updatedDecision = null;

    // Handle comment addition
    if (comment && typeof comment === "string" && comment.trim().length > 0) {
      addedDiscussion = workspaceService.addFindingDiscussion(
        actorId,
        params.id,
        repositoryId,
        params.reviewId,
        findingId,
        comment
      );
    }

    // Handle decision update (status, reason, assignee)
    if (decision && decision.status) {
      updatedDecision = workspaceService.updateFindingDecision(
        actorId,
        params.id,
        repositoryId,
        params.reviewId,
        findingId,
        {
          status: decision.status,
          dismissalReason: decision.dismissalReason,
          assigneeId: decision.assigneeId,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        discussion: addedDiscussion,
        decision: updatedDecision,
      },
    });
  } catch (error: any) {
    console.error(`POST /api/workspaces/${params.id}/reviews/${params.reviewId}/discussions error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update review finding" },
      { status }
    );
  }
}
