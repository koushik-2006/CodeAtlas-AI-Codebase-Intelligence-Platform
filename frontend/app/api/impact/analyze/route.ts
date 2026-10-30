import { NextResponse } from "next/server";
import { impactEngine } from "@/lib/server/impact-engine";
import { ImpactAnalysisRequest } from "@/types/impact";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { repositoryId = "sample-project", file = "", symbol = "", options } = body;

    const analysisRequest: ImpactAnalysisRequest = {
      repositoryId,
      file,
      symbol,
      options,
    };

    const result = impactEngine.analyzeImpact(analysisRequest);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Impact analysis error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Impact analysis calculation failed" },
      { status: 500 }
    );
  }
}
