import { NextRequest, NextResponse } from "next/server";
import { impactEngine } from "@/lib/server/impact-engine";
import { VsCodeImpactRequest, VsCodeImpactResponse } from "@/types/vscode-integration";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body: VsCodeImpactRequest = await request.json();
    const {
      repositoryId = "sample-project",
      filePath = "",
      symbolName = "",
      proposedChange,
    } = body;

    const analysisResult = impactEngine.analyzeImpact({
      repositoryId,
      file: filePath,
      symbol: symbolName,
    });

    let bufferWarning: string | undefined;
    if (proposedChange) {
      bufferWarning =
        "Impact calculated against currently indexed repository revision. Unsaved editor buffer modifications may introduce additional transitive dependencies.";
    }

    const normalizedData = {
      ...analysisResult,
      impactScore: (analysisResult as any).riskScore ?? (analysisResult as any).impactScore ?? 45,
      severity: ((analysisResult as any).riskLevel?.toLowerCase() || (analysisResult as any).severity || "medium"),
      explanation: (analysisResult as any).recommendation || (analysisResult as any).explanation || "Potential downstream dependents analyzed.",
      recommendedTests: (analysisResult as any).testsToRerun || (analysisResult as any).recommendedTests || [],
    };

    const responseData: VsCodeImpactResponse = {
      success: true,
      data: normalizedData as any,
      bufferWarning,
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("VS Code impact route error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to analyze change impact" },
      { status: 500 }
    );
  }
}
