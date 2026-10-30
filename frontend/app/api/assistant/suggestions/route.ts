import { NextResponse } from "next/server";
import { ragService } from "@/lib/server/rag-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const repositoryId = url.searchParams.get("repositoryId") || "sample-project";

  const suggestions = ragService.generateSuggestionsForRepo(repositoryId);

  return NextResponse.json({
    success: true,
    data: suggestions,
  });
}
