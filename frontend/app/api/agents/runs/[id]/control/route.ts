import { NextResponse } from "next/server";
import { agentEngine } from "@/lib/server/agent-engine";
import { AgentControlRequest } from "@/types/agent";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body: AgentControlRequest = await request.json();
    const userId = "usr_default";

    if (!body.command) {
      return NextResponse.json(
        { success: false, error: "command is required." },
        { status: 400 }
      );
    }

    let updatedRun;
    switch (body.command) {
      case "pause":
        updatedRun = agentEngine.pauseRun(params.id, userId);
        break;
      case "resume":
        updatedRun = await agentEngine.resumeRun(params.id, userId);
        break;
      case "cancel":
        updatedRun = agentEngine.cancelRun(params.id, userId);
        break;
      case "retry":
        updatedRun = await agentEngine.retryRun(params.id, userId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Invalid command: '${body.command}'. Must be pause, resume, cancel, or retry.` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      command: body.command,
      run: updatedRun,
    });
  } catch (error: any) {
    console.error("Error processing agent control command:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process control command." },
      { status: 400 }
    );
  }
}
