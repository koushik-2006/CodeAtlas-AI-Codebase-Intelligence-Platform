import { NextResponse } from "next/server";
import { parseStackTrace } from "@/lib/server/stack-trace-parser";

export async function POST(request: Request) {
  try {
    const { stackTrace, repositoryId, revision } = await request.json();

    const parsed = parseStackTrace(stackTrace || "", {
      repositoryId,
      revision,
    });

    return NextResponse.json({
      success: true,
      parsed,
    });
  } catch (error: any) {
    console.error("Error parsing stack trace:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to parse stack trace" },
      { status: 400 }
    );
  }
}
