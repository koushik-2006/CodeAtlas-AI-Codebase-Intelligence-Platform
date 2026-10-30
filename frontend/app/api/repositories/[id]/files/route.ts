import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";
import { github } from "@/lib/server/github";
import { parseSourceCode } from "@/lib/server/code-parser";
import { classifyFile, isExcludedNoise } from "@/lib/server/file-classifier";
import { DbRepositoryFile } from "@/types/database";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  const filePath = url.searchParams.get("path");

  const userId = getAuthenticatedUserId(request);
  const repo = db.getRepository(params.id, userId);
  if (!repo) {
    return NextResponse.json(
      { success: false, message: "Repository not found" },
      { status: 404 }
    );
  }

  const account = db.getConnectedAccount(userId, "github");

  // ---------------------------------------------------------------------------
  // 1. SPECIFIC FILE CONTENT REQUEST
  // ---------------------------------------------------------------------------
  if (filePath) {
    let file = db.getRepositoryFile(params.id, filePath);

    // If file exists and has content, return it directly
    if (file && file.content && file.content.trim().length > 0) {
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

    // Check classification
    const classification = classifyFile(filePath);

    // Handle binary files cleanly
    if (classification.isBinary) {
      return NextResponse.json({
        success: true,
        data: {
          path: filePath,
          name: classification.name,
          language: classification.language,
          size: file?.size || 0,
          content: `// Binary file: ${filePath}\n// Preview is not available as raw text.`,
          lineCount: 2,
        },
      });
    }

    // Live on-demand fetch from GitHub if content is missing or file not in DB
    if (
      repo.connectionType === "github" &&
      account?.accessToken &&
      account.accessToken !== "sandbox_demo_token_codeatlas"
    ) {
      try {
        const rawContent = await github.fetchFileContent(
          account.accessToken,
          repo.owner,
          repo.name,
          filePath,
          repo.defaultBranch || "main"
        );

        const lines = rawContent.split("\n");
        const updatedFile: DbRepositoryFile = {
          id: file?.id || `f_${params.id}_${filePath.replace(/[^a-zA-Z0-9]/g, "_")}`,
          repositoryId: params.id,
          path: filePath,
          name: classification.name,
          language: classification.language,
          size: rawContent.length,
          content: rawContent,
          lineCount: lines.length,
        };

        db.upsertRepositoryFile(params.id, updatedFile);

        // Also extract and add symbols if source code
        if (classification.isIndexable) {
          const parsed = parseSourceCode(params.id, filePath, rawContent);
          if (parsed.symbols.length > 0) {
            db.addCodeSymbols(params.id, parsed.symbols);
          }
          if (parsed.relationships.length > 0) {
            db.addCodeRelationships(params.id, parsed.relationships);
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            path: updatedFile.path,
            name: updatedFile.name,
            language: updatedFile.language,
            size: updatedFile.size,
            content: updatedFile.content,
            lineCount: updatedFile.lineCount,
          },
        });
      } catch (err: any) {
        console.warn(`Failed to fetch live file content for ${filePath}:`, err.message);
      }
    }

    // If file was found in DB but has no content
    if (file) {
      return NextResponse.json({
        success: true,
        data: {
          path: file.path,
          name: file.name,
          language: file.language,
          size: file.size,
          content: file.content || `// ${filePath}\n// Content preview available.`,
          lineCount: file.lineCount || 2,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: `File ${filePath} not found in repository` },
      { status: 404 }
    );
  }

  // ---------------------------------------------------------------------------
  // 2. COMPLETE REPOSITORY FILE TREE REQUEST
  // ---------------------------------------------------------------------------
  let files = db.getRepositoryFiles(params.id);

  // If no files in DB yet and GitHub connection is live, discover the tree on-the-fly!
  if (
    files.length === 0 &&
    repo.connectionType === "github" &&
    account?.accessToken &&
    account.accessToken !== "sandbox_demo_token_codeatlas"
  ) {
    try {
      const tree = await github.getRepositoryTree(
        account.accessToken,
        repo.owner,
        repo.name,
        repo.defaultBranch || "main"
      );

      const treeFiles: DbRepositoryFile[] = tree
        .filter((item) => item.type === "blob" && !isExcludedNoise(item.path))
        .map((item, idx) => {
          const classified = classifyFile(item.path);
          return {
            id: `f_${params.id}_${idx}`,
            repositoryId: params.id,
            path: item.path,
            name: classified.name,
            language: classified.language,
            size: item.size || 0,
            content: "",
            lineCount: 0,
          };
        });

      if (treeFiles.length > 0) {
        db.saveRepositoryFiles(params.id, treeFiles);
        files = treeFiles;
      }
    } catch (err: any) {
      console.warn("Could not retrieve live tree in files route:", err.message);
    }
  }

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
