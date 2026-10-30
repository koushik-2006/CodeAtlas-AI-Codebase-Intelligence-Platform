import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = "usr_default";
    const run = db.getAgentRun(params.id, userId);

    if (!run) {
      return NextResponse.json(
        { success: false, error: `Agent run '${params.id}' was not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      run,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve agent run." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = "usr_default";
    const deleted = db.deleteAgentRun(params.id, userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Agent run '${params.id}' was not found or could not be deleted.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Agent run '${params.id}' deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete agent run." },
      { status: 500 }
    );
  }
}
