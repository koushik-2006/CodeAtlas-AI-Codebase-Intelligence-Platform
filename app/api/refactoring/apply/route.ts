import { NextResponse } from "next/server";
import { refactoringEngine } from "@/lib/server/refactoring-engine";
import { ApplyRefactoringRequest } from "@/types/refactoring";

export async function POST(request: Request) {
  try {
    const body: ApplyRefactoringRequest = await request.json();
    const userId = "usr_default";

    if (!body.proposalId) {
      return NextResponse.json(
        { success: false, error: "proposalId is required." },
        { status: 400 }
      );
    }

    if (!body.confirmed) {
      return NextResponse.json(
        {
          success: false,
          error: "Explicit user confirmation is mandatory before applying refactoring code modifications.",
        },
        { status: 400 }
      );
    }

    const result = await refactoringEngine.applyProposal(body.proposalId, body.confirmed, userId);

    return NextResponse.json({
      success: true,
      message: result.message,
      proposal: result.proposal,
      backupCreated: true,
    });
  } catch (error: any) {
    console.error("Error applying refactoring patch:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to apply refactoring patch" },
      { status: 400 }
    );
  }
}
