import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { indexer } from "@/lib/server/indexer";
import { DbRepository } from "@/types/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase();
  const language = searchParams.get("language")?.toLowerCase();
  const visibility = searchParams.get("visibility")?.toLowerCase();
  const status = searchParams.get("status")?.toLowerCase();

  let repos = db.getRepositories("usr_default");

  if (search) {
    repos = repos.filter(
      (r) =>
        r.name.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search) ||
        r.owner.toLowerCase().includes(search)
    );
  }

  if (language && language !== "all") {
    repos = repos.filter((r) => r.language.toLowerCase() === language);
  }

  if (visibility && visibility !== "all") {
    repos = repos.filter((r) => r.visibility === visibility);
  }

  if (status && status !== "all") {
    repos = repos.filter((r) => r.status === status);
  }

  return NextResponse.json({
    success: true,
    data: repos,
    meta: {
      total: repos.length,
      userId: "usr_default",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, message: "Repository name is required" },
        { status: 400 }
      );
    }

    const repoId = (body.id || body.name).toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const owner = body.owner || "you";
    const language = body.language || "TypeScript";
    const defaultBranch = body.defaultBranch || "main";
    const connectionType = body.connectionType || "github";

    const newRepo: DbRepository = {
      id: repoId,
      userId: "usr_default",
      name: body.name,
      owner,
      description: body.description || "Ingested repository ready for AST analysis and call-graph tracing.",
      visibility: body.visibility || "private",
      language,
      defaultBranch,
      url: body.url || `https://github.com/${owner}/${body.name}`,
      status: "pending",
      progress: 5,
      currentStage: "Queued for indexing",
      symbolCount: 0,
      fileCount: 0,
      lastAnalyzed: "Just now",
      isIndexed: false,
      connectionType,
    };

    // Save to server database
    db.saveRepository(newRepo);

    // Start background ingestion & indexing
    await indexer.startIndexingJob({
      repositoryId: repoId,
      userId: "usr_default",
      owner,
      repo: body.name,
      branch: defaultBranch,
      connectionType,
    });

    return NextResponse.json({
      success: true,
      data: newRepo,
      message: "Repository queued for indexing successfully.",
    });
  } catch (error: any) {
    console.error("Error creating repository:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create repository" },
      { status: 500 }
    );
  }
}
