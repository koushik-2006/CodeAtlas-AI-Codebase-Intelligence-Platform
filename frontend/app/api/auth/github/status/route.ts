import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { github } from "@/lib/server/github";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export async function GET(request: Request) {
  const userId = getAuthenticatedUserId(request);
  const account = db.getConnectedAccount(userId, "github");
  const isConfigured = github.isConfigured();

  let repoCount = (account?.publicRepoCount || 0) + (account?.totalPrivateRepos || 0);
  if (account && account.accessToken) {
    try {
      if (account.accessToken === "sandbox_demo_token_codeatlas") {
        repoCount = 4;
      } else if (!repoCount) {
        const repos = await github.getUserRepositories(account.accessToken, 1, 100);
        repoCount = Array.isArray(repos) ? repos.length : 0;
      }
    } catch {
      // In case GitHub token is expired or rate limited, keep stored repoCount
    }
  }

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
      repoCount,
    },
  });
}
