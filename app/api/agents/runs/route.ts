import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { agentEngine } from "@/lib/server/agent-engine";
import { StartAgentRunRequest } from "@/types/agent";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repositoryId = searchParams.get("repositoryId") || undefined;
    const agentType = searchParams.get("agentType") || undefined;
    const status = searchParams.get("status") || undefined;
    const userId = "usr_default";

    const runs = db.getAgentRuns(userId, { repositoryId, agentType, status });

    return NextResponse.json({
      success: true,
      runs,
      total: runs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve agent runs." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: StartAgentRunRequest = await request.json();
    const userId = "usr_default";

    if (!body.agentType) {
      return NextResponse.json(
        { success: false, error: "agentType is required." },
        { status: 400 }
      );
    }

    if (!body.repositoryId) {
      return NextResponse.json(
        { success: false, error: "repositoryId is required." },
        { status: 400 }
      );
    }

    if (!body.taskPrompt || !body.taskPrompt.trim()) {
      return NextResponse.json(
        { success: false, error: "taskPrompt cannot be empty." },
        { status: 400 }
      );
    }

    const run = await agentEngine.startRun(body, userId);

    return NextResponse.json({
      success: true,
      run,
    });
  } catch (error: any) {
    console.error("Error starting agent run:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start agent run." },
      { status: 400 }
    );
  }
}
