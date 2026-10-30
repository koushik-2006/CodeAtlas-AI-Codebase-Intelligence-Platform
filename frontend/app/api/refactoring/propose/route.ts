import { NextResponse } from "next/server";
import { refactoringEngine } from "@/lib/server/refactoring-engine";
import { db } from "@/lib/server/db";
import { ProposeRefactoringRequest } from "@/types/refactoring";

export async function POST(request: Request) {
  try {
    const body: ProposeRefactoringRequest = await request.json();
    const userId = "usr_default";

    if (!body.filePath) {
      return NextResponse.json(
        { success: false, error: "filePath is required." },
        { status: 400 }
      );
    }

    if (!body.operation) {
      return NextResponse.json(
        { success: false, error: "Refactoring operation is required." },
        { status: 400 }
      );
    }

    const proposal = await refactoringEngine.proposeRefactoring(body, userId);
    db.saveRefactoringProposal(proposal);

    return NextResponse.json({
      success: true,
      proposal,
    });
  } catch (error: any) {
    console.error("Error generating refactoring proposal:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate refactoring proposal" },
      { status: 400 }
    );
  }
}
