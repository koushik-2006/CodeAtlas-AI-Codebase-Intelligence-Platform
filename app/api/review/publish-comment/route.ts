import { NextResponse } from "next/server";
import { github } from "@/lib/server/github";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { repositoryId = "sample-project", pullRequestNumber, findingId, commentBody } = body;

    if (!pullRequestNumber || !commentBody) {
      return NextResponse.json(
        { success: false, message: "pullRequestNumber and commentBody are required" },
        { status: 400 }
      );
    }

    const repo = db.getRepository(repositoryId);
    const account = db.getConnectedAccount("usr_default", "github");
    const token = account?.accessToken || "";

    const result = await github.postPullRequestComment(
      token,
      repo?.owner || "codeatlas-demo",
      repo?.name || repositoryId,
      pullRequestNumber,
      { body: commentBody }
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to publish review comment" },
      { status: 500 }
    );
  }
}
