import { NextResponse } from "next/server";
import { ragService } from "@/lib/server/rag-service";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { repositoryId, question } = body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "A non-empty question string is required." },
        { status: 400 }
      );
    }

    if (question.length > 20000) {
      return NextResponse.json(
        { success: false, message: "Question exceeds maximum supported length (20,000 characters)." },
        { status: 400 }
      );
    }

    const userId = getAuthenticatedUserId(request);

    const result = await ragService.answerQuestion({
      repositoryId: repositoryId || "sample-project",
      question: question.trim(),
      userId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const msg = error.message || "Failed to process codebase query";
    let status = 500;
    if (msg.includes("rate limit") || msg.includes("quota")) {
      status = 429;
    } else if (msg.includes("not configured") || msg.includes("GEMINI_API_KEY")) {
      status = 503;
    } else if (msg.includes("unauthorized") || msg.includes("forbidden")) {
      status = 403;
    }

    return NextResponse.json(
      { success: false, message: msg },
      { status }
    );
  }
}
