import { NextResponse } from "next/server";
import { github } from "@/lib/server/github";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repoId") || "sample-project";
    const state = (searchParams.get("state") as "open" | "closed" | "all") || "open";

    const repo = db.getRepository(repoId);
    const account = db.getConnectedAccount("usr_default", "github");
    const token = account?.accessToken || "";

    const pulls = await github.getPullRequests(
      token,
      repo?.owner || "codeatlas-demo",
      repo?.name || repoId,
      state
    );

    return NextResponse.json({
      success: true,
      data: pulls,
    });
  } catch (error: any) {
    console.error("Failed to fetch pull requests:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch pull requests" },
      { status: 500 }
    );
  }
}
