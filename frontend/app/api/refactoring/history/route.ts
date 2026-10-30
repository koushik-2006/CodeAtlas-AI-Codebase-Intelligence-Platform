import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repositoryId = searchParams.get("repositoryId") || undefined;
    const status = searchParams.get("status") || undefined;
    const operation = searchParams.get("operation") || undefined;
    const userId = "usr_default";

    let proposals = db.getRefactoringProposals(userId, repositoryId);

    if (status) {
      proposals = proposals.filter((p) => p.status === status);
    }
    if (operation) {
      proposals = proposals.filter((p) => p.operation === operation);
    }

    // Check for stale revisions dynamically
    const enrichedProposals = proposals.map((p) => {
      const file = db.getRepositoryFile(p.repositoryId, p.targetFile);
      if (!file) {
        return { ...p, isStaleRevision: true };
      }
      const fileLines = file.content.split(/\r?\n/);
      const targetSlice = fileLines.slice(p.lineRange.start - 1, p.lineRange.end).join("\n");
      const isStale = targetSlice.trim() !== p.originalSnippet.trim();
      return { ...p, isStaleRevision: isStale };
    });

    return NextResponse.json({
      success: true,
      proposals: enrichedProposals,
      total: enrichedProposals.length,
    });
  } catch (error: any) {
    console.error("Error fetching refactoring history:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch refactoring history" },
      { status: 500 }
    );
  }
}
