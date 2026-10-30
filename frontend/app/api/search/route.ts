import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { GlobalSearchResponse, SearchCategoryCount } from "@/types/search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const repo = searchParams.get("repo") || undefined;
    const category = searchParams.get("category") || undefined;
    const lang = searchParams.get("lang") || undefined;
    const exact = searchParams.get("exact") === "true";

    const userId = "usr_default"; // Standard session user

    // Execute global search
    const results = db.globalSearch(userId, query, {
      repositoryId: repo,
      category,
      language: lang,
      exactSymbol: exact,
    });

    // Compute category breakdowns across all matching results if no category filter applied,
    // or compute by querying all categories
    const allResults = category
      ? db.globalSearch(userId, query, { repositoryId: repo, language: lang, exactSymbol: exact })
      : results;

    const categoryMap = new Map<string, number>();
    allResults.forEach((item) => {
      categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
    });

    const categoryLabels: Record<string, string> = {
      repository: "Repositories",
      file: "Files",
      symbol: "Symbols",
      api: "API Routes",
      architecture: "Architecture",
      review: "Code Reviews",
    };

    const categories: SearchCategoryCount[] = Array.from(categoryMap.entries()).map(([cat, count]) => ({
      category: cat,
      label: categoryLabels[cat] || cat,
      count,
    }));

    // Suggest top recent/common searches
    const recentSearches = ["handleSubmit", "loginUser", "auth.ts", "POST /auth", "PR #101"];

    const response: GlobalSearchResponse = {
      query,
      total: results.length,
      results,
      categories,
      recentSearches,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (err: any) {
    console.error("Global search error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform global search across authorized repositories.",
      },
      { status: 500 }
    );
  }
}
