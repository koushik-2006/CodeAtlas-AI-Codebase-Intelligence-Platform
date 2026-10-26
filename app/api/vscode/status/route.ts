import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";
import { aiProvider } from "@/lib/server/ai-provider";
import { VsCodeStatusResponse } from "@/types/vscode-integration";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    const user = db.getUser(userId);

    const repos = db.getRepositories(userId);

    const mappedRepos = repos.map((r) => {
      const files = db.getRepositoryFiles(r.id);
      const symbols = db.getCodeSymbols(r.id);
      return {
        id: r.id,
        name: r.name,
        owner: r.owner,
        defaultBranch: r.defaultBranch,
        language: r.language,
        status: (r.status as any) || "indexed",
        commitSha: (r as any).commitSha || "main",
        fileCount: files.length,
        symbolCount: symbols.length,
        lastIndexedAt: (r as any).lastIndexedAt,
      };
    });

    const aiStatus = aiProvider.getStatus();

    const responseData: VsCodeStatusResponse = {
      success: true,
      serverVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || "developer",
          }
        : {
            id: userId,
            name: "Default Developer",
            email: "dev@codeatlas.local",
            role: "developer",
          },
      repositories: mappedRepos,
      multiRepoSupported: true,
      activeProvider: aiStatus.provider,
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("VS Code status route error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve status" },
      { status: 500 }
    );
  }
}
