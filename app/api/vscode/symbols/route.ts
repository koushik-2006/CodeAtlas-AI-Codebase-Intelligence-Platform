import { NextRequest, NextResponse } from "next/server";
import { symbolNavigator } from "@/lib/server/symbol-navigator";
import { db } from "@/lib/server/db";
import { VsCodeSymbolResponse } from "@/types/vscode-integration";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo") || "sample-project";
    const file = searchParams.get("file") || "";
    const line = parseInt(searchParams.get("line") || "1", 10);
    const symbol = searchParams.get("symbol") || undefined;

    const repository = db.getRepository(repo, "usr_default");
    if (!repository) {
      return NextResponse.json(
        { success: false, message: `Repository '${repo}' not found or unauthorized.` },
        { status: 404 }
      );
    }

    const navigationResult = symbolNavigator.navigateSymbol(repo, file, line, symbol);

    const responseData: VsCodeSymbolResponse = {
      success: true,
      data: navigationResult,
    };

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error("VS Code symbols route error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to resolve symbol navigation" },
      { status: 500 }
    );
  }
}
