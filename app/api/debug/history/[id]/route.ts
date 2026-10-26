import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { UpdateInvestigationStatusRequest } from "@/types/debug";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = "usr_default";

    const investigation = db.getDebugInvestigation(id, userId);
    if (!investigation) {
      return NextResponse.json(
        { success: false, error: "Investigation not found" },
        { status: 404 }
      );
    }

    const followUps = db.getDebugFollowUps(id);

    return NextResponse.json({
      success: true,
      investigation,
      followUps,
    });
  } catch (error: any) {
    console.error("Error fetching investigation:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load investigation" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = "usr_default";
    const body: UpdateInvestigationStatusRequest = await request.json();

    const existing = db.getDebugInvestigation(id, userId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Investigation not found" },
        { status: 404 }
      );
    }

    const updates: any = {};
    if (body.status) updates.status = body.status;
    if (body.confirmedRootCauseId !== undefined) {
      updates.confirmedRootCauseId = body.confirmedRootCauseId;
      updates.confirmedRootCauseSummary = body.confirmedRootCauseSummary;
      // Also update hypothesis flag
      if (existing.hypotheses) {
        updates.hypotheses = existing.hypotheses.map((h) => ({
          ...h,
          isConfirmedRootCause: h.id === body.confirmedRootCauseId,
        }));
      }
    }

    if (body.investigatedHypothesisId) {
      const hypotheses = updates.hypotheses || existing.hypotheses || [];
      updates.hypotheses = hypotheses.map((h: any) =>
        h.id === body.investigatedHypothesisId
          ? {
              ...h,
              isInvestigated: body.isInvestigated ?? true,
              investigatedAt: new Date().toISOString(),
            }
          : h
      );
    }

    const updated = db.updateDebugInvestigation(id, updates);

    return NextResponse.json({
      success: true,
      investigation: updated,
    });
  } catch (error: any) {
    console.error("Error updating investigation:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update investigation" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = "usr_default";

    const deleted = db.deleteDebugInvestigation(id, userId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Investigation not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Investigation deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting investigation:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete investigation" },
      { status: 500 }
    );
  }
}
