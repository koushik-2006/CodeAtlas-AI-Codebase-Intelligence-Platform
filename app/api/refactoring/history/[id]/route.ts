import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = "usr_default";
    const proposal = db.getRefactoringProposal(params.id, userId);

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Refactoring proposal not found" },
        { status: 404 }
      );
    }

    const file = db.getRepositoryFile(proposal.repositoryId, proposal.targetFile);
    let isStale = false;
    if (file) {
      const fileLines = file.content.split(/\r?\n/);
      const targetSlice = fileLines.slice(proposal.lineRange.start - 1, proposal.lineRange.end).join("\n");
      isStale = targetSlice.trim() !== proposal.originalSnippet.trim();
    }

    return NextResponse.json({
      success: true,
      proposal: { ...proposal, isStaleRevision: isStale },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve proposal" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const userId = "usr_default";

    const existing = db.getRefactoringProposal(params.id, userId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Refactoring proposal not found" },
        { status: 404 }
      );
    }

    const allowedStatuses = ["draft", "proposed", "accepted", "rejected", "applied"];
    if (body.status && !allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status '${body.status}'.` },
        { status: 400 }
      );
    }

    const updated = db.updateRefactoringProposal(params.id, {
      ...(body.status ? { status: body.status } : {}),
    });

    return NextResponse.json({
      success: true,
      proposal: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update proposal" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = "usr_default";
    const deleted = db.deleteRefactoringProposal(params.id, userId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Refactoring proposal not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Refactoring proposal deleted successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete proposal" },
      { status: 500 }
    );
  }
}
