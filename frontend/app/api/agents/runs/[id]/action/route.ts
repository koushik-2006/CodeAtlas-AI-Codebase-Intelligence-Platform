import { NextResponse } from "next/server";
import { agentEngine } from "@/lib/server/agent-engine";
import { AgentActionDecisionRequest } from "@/types/agent";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: AgentActionDecisionRequest = await request.json();
    const userId = "usr_default";

    if (!body.actionId) {
      return NextResponse.json(
        { success: false, error: "actionId is required." },
        { status: 400 }
      );
    }

    if (body.decision !== "approve" && body.decision !== "reject") {
      return NextResponse.json(
        { success: false, error: "decision must be either 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    let updatedRun;
    if (body.decision === "approve") {
      updatedRun = await agentEngine.approveAction(params.id, body.actionId, userId);
    } else {
      updatedRun = await agentEngine.rejectAction(params.id, body.actionId, body.reason, userId);
    }

    return NextResponse.json({
      success: true,
      decision: body.decision,
      run: updatedRun,
    });
  } catch (error: any) {
    console.error("Error processing agent action decision:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process action decision." },
      { status: 400 }
    );
  }
}
