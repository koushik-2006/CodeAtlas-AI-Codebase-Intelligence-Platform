import { NextRequest, NextResponse } from "next/server";
import { multiRepoService } from "@/lib/server/multi-repo-service";
import { CrossRepoImpactRequest } from "@/types/multi-repo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CrossRepoImpactRequest;
    if (!body || !body.sourceRepoId || !body.changedComponent) {
      return NextResponse.json(
        { success: false, error: "sourceRepoId and changedComponent are required." },
        { status: 400 }
      );
    }

    const userId = "usr_default";
    const report = multiRepoService.analyzeCrossRepoImpact(userId, body);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    console.error("Cross-repo impact error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to analyze cross-repository impact" },
      { status: 500 }
    );
  }
}
