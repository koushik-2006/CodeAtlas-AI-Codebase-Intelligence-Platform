import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { healthInsightsEngine } from "@/lib/server/health-insights-engine";

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

  const healthScore = healthInsightsEngine.getHealthScore("usr_default", repoId);
  return NextResponse.json({
    success: true,
    data: healthScore,
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { insightId } = body;
    if (!insightId) {
      return NextResponse.json(
        { success: false, message: "insightId is required." },
        { status: 400 }
      );
    }

    const updated = healthInsightsEngine.dismissInsight("usr_default", params.id, insightId);
    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Failed to dismiss insight" },
      { status: 500 }
    );
  }
}
