import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { symbolNavigator } from "@/lib/server/symbol-navigator";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const repoId = params.id;
  const repo = db.getRepository(repoId, "usr_default");
  if (!repo) {
    return NextResponse.json(
      { success: false, message: `Repository '${repoId}' not found.` },
      { status: 404 }
    );
  }

  const url = new URL(request.url);
  const file = url.searchParams.get("file") || "";
  const line = parseInt(url.searchParams.get("line") || "1", 10);
  const symbol = url.searchParams.get("symbol") || undefined;

  const result = symbolNavigator.navigateSymbol(repoId, file, line, symbol);

  return NextResponse.json({
    success: true,
    data: result,
  });
}
