import { NextResponse } from "next/server";
import { AGENT_DESCRIPTORS } from "@/lib/server/agent-engine";
import { AGENT_TOOL_REGISTRY } from "@/lib/server/agent-tools";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      agents: Object.values(AGENT_DESCRIPTORS),
      tools: Object.values(AGENT_TOOL_REGISTRY),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve agents and tools." },
      { status: 500 }
    );
  }
}
