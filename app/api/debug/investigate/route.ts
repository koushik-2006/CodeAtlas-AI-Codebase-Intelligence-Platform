import { NextResponse } from "next/server";
import { debugEngine } from "@/lib/server/debug-engine";
import { DebugInvestigateRequest } from "@/types/debug";

export async function POST(request: Request) {
  try {
    const body: DebugInvestigateRequest = await request.json();
    const userId = "usr_default"; // In multi-user context, extract from authenticated session

    const investigation = await debugEngine.investigate(body, userId);

    return NextResponse.json({
      success: true,
      investigation,
    });
  } catch (error: any) {
    console.error("Error running debug investigation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to run debug investigation",
      },
      { status: 400 }
    );
  }
}
