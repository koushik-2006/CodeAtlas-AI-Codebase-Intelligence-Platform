import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { github } from "@/lib/server/github";

export async function GET() {
  const account = db.getConnectedAccount("usr_default", "github");
  const isConfigured = github.isConfigured();

  return NextResponse.json({
    success: true,
    data: {
      connected: Boolean(account),
      username: account?.username || null,
      avatar: account?.avatar || null,
      scopes: account?.scopes || [],
      connectedAt: account?.connectedAt || null,
      isConfigured,
      isSandbox: account?.accessToken === "sandbox_demo_token_codeatlas",
    },
  });
}
