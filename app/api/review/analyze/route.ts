import { NextResponse } from "next/server";
import { codeReviewEngine } from "@/lib/server/code-review-engine";
import { github } from "@/lib/server/github";
import { db } from "@/lib/server/db";
import { PullRequestDetail } from "@/types/review";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      repositoryId = "sample-project",
      pullRequestNumber = 101,
      isSecurityReviewOnly = false,
    } = body;

    const repo = db.getRepository(repositoryId);
    const account = db.getConnectedAccount("usr_default", "github");
    const token = account?.accessToken || "";

    const rawPr = await github.getPullRequest(
      token,
      repo?.owner || "codeatlas-demo",
      repo?.name || repositoryId,
      pullRequestNumber
    );

    const files = await github.getPullRequestFiles(
      token,
      repo?.owner || "codeatlas-demo",
      repo?.name || repositoryId,
      pullRequestNumber
    );

    const prDetail: PullRequestDetail = {
      id: `pr_${rawPr.number || pullRequestNumber}`,
      number: rawPr.number || pullRequestNumber,
      title: rawPr.title || `PR #${pullRequestNumber}`,
      body: rawPr.body || "",
      author: {
        name: rawPr.user?.login || "contributor",
        avatar: rawPr.user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      },
      baseBranch: rawPr.base?.ref || "main",
      headBranch: rawPr.head?.ref || "feature",
      baseSha: rawPr.base?.sha || "base-sha",
      headSha: rawPr.head?.sha || "head-sha",
      state: rawPr.state || "open",
      createdAt: rawPr.created_at || new Date().toISOString(),
      updatedAt: rawPr.updated_at || new Date().toISOString(),
      files,
      additions: rawPr.additions || 25,
      deletions: rawPr.deletions || 4,
      changedFilesCount: files.length,
    };

    const session = await codeReviewEngine.reviewPullRequest({
      repositoryId,
      pullRequest: prDetail,
      isSecurityReviewOnly,
    });

    // Save session in database
    db.saveReviewSession(session);

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error("Code review analysis failed:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to analyze pull request" },
      { status: 500 }
    );
  }
}
