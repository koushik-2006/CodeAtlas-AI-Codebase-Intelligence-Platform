import { NextResponse } from "next/server";
import { WORKFLOW_TEMPLATES } from "@/lib/server/agent-engine";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      workflows: WORKFLOW_TEMPLATES,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve workflow templates." },
      { status: 500 }
    );
  }
}
