import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/lib/server/workspace-service";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actorId = getAuthenticatedUserId(req);
    const invitations = workspaceService.getWorkspaceInvitations(params.id, actorId);

    return NextResponse.json({
      success: true,
      data: { invitations },
    });
  } catch (error: any) {
    console.error(`GET /api/workspaces/${params.id}/invitations error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load invitations" },
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

    const { email, role } = body;
    if (!email || !role) {
      return NextResponse.json(
        { success: false, error: "Email and role are required" },
        { status: 400 }
      );
    }

    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Role must be admin, member, or viewer." },
        { status: 400 }
      );
    }

    const invitation = workspaceService.createInvitation(actorId, params.id, email, role);

    // Provide the invitation URL for easy copying / development workflow
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const inviteLink = `${protocol}://${host}/invitations/${invitation.token}`;

    return NextResponse.json({
      success: true,
      data: {
        ...invitation,
        inviteLink,
        deliveryNote: "In development/demo mode, share this direct invitation link with your teammate.",
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error(`POST /api/workspaces/${params.id}/invitations error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create invitation" },
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
    let invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      const body = await req.json().catch(() => ({}));
      invitationId = body.invitationId || body.id;
    }

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: "invitationId is required" },
        { status: 400 }
      );
    }

    const success = workspaceService.revokeInvitation(actorId, params.id, invitationId);

    return NextResponse.json({
      success,
      message: "Invitation was successfully revoked",
    });
  } catch (error: any) {
    console.error(`DELETE /api/workspaces/${params.id}/invitations error:`, error);
    const status = error.message?.includes("Forbidden") ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to revoke invitation" },
      { status }
    );
  }
}
