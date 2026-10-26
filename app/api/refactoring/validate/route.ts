import { NextResponse } from "next/server";
import { refactoringEngine } from "@/lib/server/refactoring-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = "usr_default";

    if (!body.proposalId) {
      return NextResponse.json(
        { success: false, error: "proposalId is required." },
        { status: 400 }
      );
    }

    const result = await refactoringEngine.validateProposal(body.proposalId, userId);

    return NextResponse.json({
      success: true,
      validationStatus: result.validationStatus,
      validationResults: result.validationResults,
    });
  } catch (error: any) {
    console.error("Error validating proposal:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate proposal" },
      { status: 400 }
    );
  }
}
