import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { github } from "@/lib/server/github";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export async function POST(request: Request) {
  try {
    const userId = getAuthenticatedUserId(request);
    const account = db.getConnectedAccount(userId, "github");

    if (!account) {
      return NextResponse.json(
        { success: false, message: "No connected GitHub account found for this user." },
        { status: 404 }
      );
    }

    if (account.accessToken) {
      // Best-effort remote revocation
      await github.revokeAuthorization(account.accessToken).catch(() => {});
    }

    db.deleteConnectedAccount(userId, "github");

    return NextResponse.json({
      success: true,
      message: "GitHub account disconnected safely and credentials cleared.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to disconnect" },
      { status: 500 }
    );
  }
}
