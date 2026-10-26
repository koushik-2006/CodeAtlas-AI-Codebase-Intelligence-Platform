import { NextResponse } from "next/server";
import { ragService } from "@/lib/server/rag-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { repositoryId, question } = body;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { success: false, message: "A question string is required." },
        { status: 400 }
      );
    }

    const result = await ragService.answerQuestion({
      repositoryId: repositoryId || "sample-project",
      question,
      userId: "usr_default",
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Assistant RAG query failed:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process codebase query" },
      { status: 500 }
    );
  }
}
