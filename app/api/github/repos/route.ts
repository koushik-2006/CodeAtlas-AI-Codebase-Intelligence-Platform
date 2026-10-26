import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { github, DEVELOPER_SANDBOX_REPOS, GitHubRepositoryItem } from "@/lib/server/github";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.toLowerCase();
  const language = url.searchParams.get("language")?.toLowerCase();
  const visibility = url.searchParams.get("visibility")?.toLowerCase();

  const account = db.getConnectedAccount("usr_default", "github");
  const existingRepos = db.getRepositories("usr_default");
  const existingNames = new Set(existingRepos.map((r) => r.name.toLowerCase()));

  let rawRepos: GitHubRepositoryItem[] = [];
  let isSandbox = false;

  if (account && account.accessToken && account.accessToken !== "sandbox_demo_token_codeatlas") {
    try {
      rawRepos = await github.getUserRepositories(account.accessToken);
    } catch (err: any) {
      console.warn("Failed to fetch live GitHub repos, falling back to sandbox:", err.message);
      rawRepos = DEVELOPER_SANDBOX_REPOS;
      isSandbox = true;
    }
  } else {
    rawRepos = DEVELOPER_SANDBOX_REPOS;
    isSandbox = true;
  }

  // Filter repositories
  let filtered = rawRepos.map((repo) => ({
    id: repo.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    ownerAvatar: repo.owner.avatar_url,
    description: repo.description || "No description provided.",
    visibility: repo.private ? ("private" as const) : ("public" as const),
    language: repo.language || "TypeScript",
    defaultBranch: repo.default_branch,
    url: repo.html_url,
    stars: repo.stargazers_count,
    updatedAt: repo.updated_at,
    isArchived: repo.archived,
    isAlreadyIndexed: existingNames.has(repo.name.toLowerCase()),
  }));

  if (search) {
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search) ||
        r.owner.toLowerCase().includes(search)
    );
  }

  if (language && language !== "all") {
    filtered = filtered.filter((r) => r.language.toLowerCase() === language);
  }

  if (visibility && visibility !== "all") {
    filtered = filtered.filter((r) => r.visibility === visibility);
  }

  return NextResponse.json({
    success: true,
    data: filtered,
    meta: {
      total: filtered.length,
      isConnected: Boolean(account),
      username: account?.username || null,
      isSandbox,
      isConfigured: github.isConfigured(),
    },
  });
}
