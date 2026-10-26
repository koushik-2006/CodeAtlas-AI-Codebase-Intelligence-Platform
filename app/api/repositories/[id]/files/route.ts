import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  const filePath = url.searchParams.get("path");

  const repo = db.getRepository(params.id, "usr_default");
  if (!repo) {
    return NextResponse.json(
      { success: false, message: "Repository not found" },
      { status: 404 }
    );
  }

  // If specific file content requested
  if (filePath) {
    const file = db.getRepositoryFile(params.id, filePath);
    if (!file) {
      return NextResponse.json(
        { success: false, message: `File ${filePath} not found in repository` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        path: file.path,
        name: file.name,
        language: file.language,
        size: file.size,
        content: file.content,
        lineCount: file.lineCount,
      },
    });
  }

  // Return list of all repository files
  const files = db.getRepositoryFiles(params.id);

  return NextResponse.json({
    success: true,
    data: files.map((f) => ({
      id: f.id,
      path: f.path,
      name: f.name,
      language: f.language,
      size: f.size,
      lineCount: f.lineCount,
    })),
    meta: {
      total: files.length,
    },
  });
}
