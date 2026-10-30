import { NextResponse } from "next/server";
import { github } from "@/lib/server/github";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get("repoId") || "sample-project";
    const pullNumber = parseInt(params.id, 10);

    if (isNaN(pullNumber)) {
      return NextResponse.json(
        { success: false, message: "Invalid pull request number" },
        { status: 400 }
      );
    }

    const repo = db.getRepository(repoId);
    const account = db.getConnectedAccount("usr_default", "github");
    const token = account?.accessToken || "";

    const pr = await github.getPullRequest(
      token,
      repo?.owner || "codeatlas-demo",
      repo?.name || repoId,
      pullNumber
    );

    const files = await github.getPullRequestFiles(
      token,
      repo?.owner || "codeatlas-demo",
      repo?.name || repoId,
      pullNumber
    );

    return NextResponse.json({
      success: true,
      data: {
        ...pr,
        files,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch pull request details" },
      { status: 500 }
    );
  }
}
