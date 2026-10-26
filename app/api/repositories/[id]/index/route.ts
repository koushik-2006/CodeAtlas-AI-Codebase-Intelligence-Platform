import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { indexer } from "@/lib/server/indexer";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const repo = db.getRepository(params.id, "usr_default");
  if (!repo) {
    return NextResponse.json(
      { success: false, message: "Repository not found" },
      { status: 404 }
    );
  }

  const job = db.getActiveJobForRepo(params.id);

  return NextResponse.json({
    success: true,
    data: {
      repositoryId: repo.id,
      status: repo.status,
      progress: repo.progress,
      currentStage: repo.currentStage || "Idle",
      fileCount: repo.fileCount,
      symbolCount: repo.symbolCount,
      lastAnalyzed: repo.lastAnalyzed,
      isIndexed: repo.isIndexed,
      error: repo.error,
      job: job || null,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const repo = db.getRepository(params.id, "usr_default");
  if (!repo) {
    return NextResponse.json(
      { success: false, message: "Repository not found" },
      { status: 404 }
    );
  }

  const job = await indexer.startIndexingJob({
    repositoryId: repo.id,
    userId: "usr_default",
    owner: repo.owner,
    repo: repo.name,
    branch: repo.defaultBranch,
    connectionType: repo.connectionType,
  });

  return NextResponse.json({
    success: true,
    data: job,
    message: "Re-indexing started.",
  });
}
