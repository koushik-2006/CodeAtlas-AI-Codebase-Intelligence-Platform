import { NextRequest, NextResponse } from "next/server";
import { multiRepoService } from "@/lib/server/multi-repo-service";
import { CrossRepoQuestionRequest } from "@/types/multi-repo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CrossRepoQuestionRequest;
    if (!body || !body.question) {
      return NextResponse.json({ success: false, error: "Question is required." }, { status: 400 });
    }

    const userId = "usr_default";
    const answer = await multiRepoService.answerCrossRepoQuestion(userId, body);

    return NextResponse.json({
      success: true,
      data: answer,
    });
  } catch (err: any) {
    console.error("Cross-repo query error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process cross-repository question" },
      { status: 500 }
    );
  }
}
