import { NextResponse } from "next/server";
import { debugEngine } from "@/lib/server/debug-engine";
import { DebugFollowUpRequest } from "@/types/debug";

export async function POST(request: Request) {
  try {
    const { investigationId, question }: DebugFollowUpRequest = await request.json();
    const userId = "usr_default";

    if (!investigationId || !question) {
      return NextResponse.json(
        { success: false, error: "investigationId and question are required." },
        { status: 400 }
      );
    }

    const followUp = await debugEngine.askFollowUp(investigationId, question, userId);

    return NextResponse.json({
      success: true,
      followUp,
    });
  } catch (error: any) {
    console.error("Error asking follow-up question:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process follow-up" },
      { status: 400 }
    );
  }
}
