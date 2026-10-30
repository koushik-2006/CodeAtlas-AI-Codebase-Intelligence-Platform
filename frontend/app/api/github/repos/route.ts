import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { github, DEVELOPER_SANDBOX_REPOS, GitHubRepositoryItem } from "@/lib/server/github";
import { getAuthenticatedUserId } from "@/lib/server/auth-helper";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.toLowerCase();
  const language = url.searchParams.get("language")?.toLowerCase();
  const visibility = url.searchParams.get("visibility")?.toLowerCase();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") || "25", 10)));
  const sortBy = url.searchParams.get("sort") || "updated";

  const userId = getAuthenticatedUserId(request);
  const account = db.getConnectedAccount(userId, "github");
  const existingRepos = db.getRepositories(userId);
  const existingNames = new Set(existingRepos.map((r) => r.name.toLowerCase()));

  if (!account) {
    return NextResponse.json(
      {
        success: false,
        message: "No GitHub account connected. Please connect your GitHub account to access repositories.",
        data: [],
      },
      { status: 400 }
    );
  }

  let rawRepos: GitHubRepositoryItem[] = [];
  let isSandbox = false;
  let tokenExpired = false;

  if (account.accessToken && account.accessToken !== "sandbox_demo_token_codeatlas") {
    try {
      let pageNum = 1;
      const allFetched: GitHubRepositoryItem[] = [];
      while (pageNum <= 3) {
        const batch = await github.getUserRepositories(account.accessToken, pageNum, 100);
        allFetched.push(...batch);
        if (batch.length < 100) break;
        pageNum++;
      }
      rawRepos = allFetched;
    } catch (err: any) {
      if (err.message && err.message.includes("401")) {
        tokenExpired = true;
      }
      console.warn("Failed to fetch live GitHub repos, falling back to sandbox:", err.message);
      rawRepos = DEVELOPER_SANDBOX_REPOS;
      isSandbox = true;
    }
  } else {
    rawRepos = DEVELOPER_SANDBOX_REPOS;
    isSandbox = true;
  }

  // Map and normalize repositories
  let filtered = rawRepos.map((repo) => ({
    id: repo.name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner?.login || "unknown",
    ownerAvatar: repo.owner?.avatar_url || "https://avatars.githubusercontent.com/u/9919?v=4",
    description: repo.description || "No description provided.",
    visibility: repo.private ? ("private" as const) : ("public" as const),
    language: repo.language || "TypeScript",
    defaultBranch: repo.default_branch || "main",
    url: repo.html_url,
    stars: repo.stargazers_count || 0,
    updatedAt: repo.updated_at || new Date().toISOString(),
    isArchived: Boolean(repo.archived),
    isAlreadyIndexed: existingNames.has(repo.name.toLowerCase()),
  }));

  // Filter by search query
  if (search) {
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search) ||
        r.owner.toLowerCase().includes(search)
    );
  }

  // Filter by programming language
  if (language && language !== "all") {
    filtered = filtered.filter((r) => r.language.toLowerCase() === language);
  }

  // Filter by visibility (public / private)
  if (visibility && visibility !== "all") {
    filtered = filtered.filter((r) => r.visibility === visibility);
  }

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === "stars") return b.stars - a.stars;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return NextResponse.json({
    success: true,
    data: paginated,
    meta: {
      total,
      page,
      perPage,
      totalPages,
      isConnected: Boolean(account),
      username: account?.username || null,
      avatar: account?.avatar || null,
      isSandbox,
      tokenExpired,
      isConfigured: github.isConfigured(),
    },
  });
}
