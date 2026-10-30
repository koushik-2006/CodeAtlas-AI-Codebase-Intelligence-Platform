import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repositoryId = searchParams.get("repositoryId") || undefined;
    const workspaceId = searchParams.get("workspaceId") || undefined;
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const userId = "usr_default";
    const investigations = db.getDebugInvestigations(userId, {
      repositoryId,
      workspaceId,
      search,
      status,
    });

    return NextResponse.json({
      success: true,
      investigations,
      total: investigations.length,
    });
  } catch (error: any) {
    console.error("Error fetching debug history:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch debug history",
      },
      { status: 500 }
    );
  }
}
