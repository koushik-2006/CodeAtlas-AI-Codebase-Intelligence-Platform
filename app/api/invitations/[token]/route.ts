import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/lib/server/workspace-service";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const found = workspaceService.getInvitationByToken(params.token);

    if (!found) {
      return NextResponse.json(
        { success: false, error: "Invitation not found or invalid token" },
        { status: 404 }
      );
    }

    const { invitation, workspace } = found;

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        invitedByName: invitation.invitedByName,
        workspaceName: workspace.name,
        workspaceDescription: workspace.description,
        isExpired: new Date(invitation.expiresAt) < new Date(),
      },
    });
  } catch (error: any) {
    console.error(`GET /api/invitations/${params.token} error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load invitation" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const userId = getAuthenticatedUserId(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "accept";

    if (action === "decline") {
      const found = workspaceService.getInvitationByToken(params.token);
      if (found) {
        // Mark as declined
        const { invitation } = found;
        invitation.status = "declined";
      }
      return NextResponse.json({
        success: true,
        message: "Invitation declined",
      });
    }

    const result = workspaceService.acceptInvitation(userId, params.token);

    return NextResponse.json({
      success: true,
      data: result,
      message: `You have successfully joined ${result.workspace.name}!`,
    });
  } catch (error: any) {
    console.error(`POST /api/invitations/${params.token} error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process invitation" },
      { status: 400 }
    );
  }
}
