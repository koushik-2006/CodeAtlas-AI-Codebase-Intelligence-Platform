import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { learningPathEngine } from "@/lib/server/learning-path";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const repoId = params.id;
  const repo = db.getRepository(repoId, "usr_default");
  if (!repo) {
    return NextResponse.json(
      { success: false, message: `Repository '${repoId}' not found.` },
      { status: 404 }
    );
  }

  const learningPath = learningPathEngine.getLearningPath("usr_default", repoId);
  return NextResponse.json({
    success: true,
    data: learningPath,
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { stepId } = body;
    if (!stepId) {
      return NextResponse.json(
        { success: false, message: "stepId is required." },
        { status: 400 }
      );
    }

    const updated = learningPathEngine.toggleStepCompletion("usr_default", params.id, stepId);
    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to update step" },
      { status: 500 }
    );
  }
}
