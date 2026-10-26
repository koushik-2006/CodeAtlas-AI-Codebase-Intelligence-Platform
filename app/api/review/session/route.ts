import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repoId") || "sample-project";
    const prNumber = parseInt(searchParams.get("prNumber") || "101", 10);

    const session = db.getReviewSession(repoId, prNumber);

    if (!session) {
      return NextResponse.json({
        success: false,
        message: "No existing review session found for this pull request.",
      });
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch review session" },
      { status: 500 }
    );
  }
}
