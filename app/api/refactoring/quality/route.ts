import { NextResponse } from "next/server";
import { codeQualityEngine } from "@/lib/server/code-quality-engine";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repositoryId = searchParams.get("repositoryId") || searchParams.get("repoId") || "sample-project";
    const userId = "usr_default";

    const repo = db.getRepository(repositoryId, userId);
    if (!repo) {
      return NextResponse.json(
        { success: false, error: `Repository '${repositoryId}' not found or access denied.` },
        { status: 404 }
      );
    }

    const debtOverview = codeQualityEngine.analyzeRepositoryDebt(repositoryId);

    return NextResponse.json({
      success: true,
      debtOverview,
    });
  } catch (error: any) {
    console.error("Error analyzing code quality and technical debt:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to analyze code quality" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const repositoryId = body.repositoryId || "sample-project";
    const userId = "usr_default";

    const repo = db.getRepository(repositoryId, userId);
    if (!repo) {
      return NextResponse.json(
        { success: false, error: `Repository '${repositoryId}' not found.` },
        { status: 404 }
      );
    }

    const debtOverview = codeQualityEngine.analyzeRepositoryDebt(repositoryId);

    return NextResponse.json({
      success: true,
      debtOverview,
    });
  } catch (error: any) {
    console.error("Error in quality analysis trigger:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Quality analysis failed" },
      { status: 500 }
    );
  }
}
