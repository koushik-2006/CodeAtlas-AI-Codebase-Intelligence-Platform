import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, findingId, status, dismissReason } = body;

    if (!sessionId || !findingId || !status) {
      return NextResponse.json(
        { success: false, message: "sessionId, findingId, and status are required" },
        { status: 400 }
      );
    }

    const updated = db.updateFindingStatus(sessionId, findingId, status, dismissReason);

    return NextResponse.json({
      success: updated,
      message: updated ? "Finding status updated" : "Finding or session not found",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update finding status" },
      { status: 500 }
    );
  }
}
