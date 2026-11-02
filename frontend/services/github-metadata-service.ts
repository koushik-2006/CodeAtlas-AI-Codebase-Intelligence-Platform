/**
 * GitHub API Metadata, Tree, and File Content Service
 * 
 * Provides robust fetching from GitHub REST API and raw CDN:
 * - Rate limit detection and friendly countdowns
 * - Recursive Git Tree retrieval with filtering
 * - Smart CDN raw file contents for public repos (zero API quota consumption)
 * - IndexedDB caching for instant re-opening
 */

import { repoCache } from "@/lib/indexeddb-cache";

export interface RepoMetadata {
  id: number;
  name: string;
  fullName: string;
  owner: {
    login: string;
    avatarUrl: string;
    htmlUrl: string;
  };
  description: string;
  visibility: "public" | "private";
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  size: number;
  pushedAt: string;
  homepage?: string;
  topics: string[];
  license?: string;
  topLanguage: string;
  languages: Record<string, number>;
}

export interface GitTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

const SKIP_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "out",
  "vendor",
  "coverage",
  "__pycache__",
  ".vscode",
  ".idea",
  ".cache",
]);

const SKIP_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".exe",
  ".dll",
  ".dylib",
  ".so",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp4",
  ".mp3",
  ".wav",
]);

const MAX_FILE_SIZE_BYTES = 300 * 1024; // 300 KB

export class GitHubMetadataService {
  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return (
        sessionStorage.getItem("codeatlas_github_token") ||
        sessionStorage.getItem("github_access_token") ||
        null
      );
    } catch {
      return null;
    }
  }

  private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "CodeAtlas-Codebase-Intelligence",
    };
    const token = this.getAuthToken();
    if (token && !token.startsWith("sandbox_")) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  private handleRateLimit(res: Response): string {
    const remaining = res.headers.get("x-ratelimit-remaining");
    const reset = res.headers.get("x-ratelimit-reset");

    if (res.status === 403 || res.status === 429) {
      if (remaining === "0" && reset) {
        const resetTime = new Date(parseInt(reset, 10) * 1000);
        const timeStr = resetTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        return `GitHub API rate limit reached — try again at ${timeStr} or sign in with GitHub to increase limits.`;
      }
      return "Access denied or GitHub rate limit reached. Please sign in with GitHub.";
    }

    if (res.status === 404) {
      return "Repository not found or is private (sign in with GitHub to access private repositories).";
    }

    return `GitHub API request failed (HTTP ${res.status}): ${res.statusText}`;
  }

  async fetchRepoMetadata(owner: string, repo: string): Promise<RepoMetadata> {
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const res = await fetch(url, { headers: this.buildHeaders() });

    if (!res.ok) {
      throw new Error(this.handleRateLimit(res));
    }

    const data = await res.json();

    // Fetch languages in parallel
    const languages = await this.fetchRepoLanguages(owner, repo);
    const topLanguage = Object.keys(languages)[0] || data.language || "TypeScript";

    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      owner: {
        login: data.owner?.login || owner,
        avatarUrl: data.owner?.avatar_url || `https://avatars.githubusercontent.com/${owner}`,
        htmlUrl: data.owner?.html_url || `https://github.com/${owner}`,
      },
      description: data.description || "Imported code repository ready for code intelligence.",
      visibility: data.private ? "private" : "public",
      defaultBranch: data.default_branch || "main",
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      openIssues: data.open_issues_count ?? 0,
      size: data.size ?? 0,
      pushedAt: data.pushed_at || new Date().toISOString(),
      homepage: data.homepage || undefined,
      topics: Array.isArray(data.topics) ? data.topics : [],
      license: data.license?.name || data.license?.spdx_id || undefined,
      topLanguage,
      languages,
    };
  }

  async fetchRepoLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    try {
      const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`;
      const res = await fetch(url, { headers: this.buildHeaders() });
      if (!res.ok) return {};
      const data = await res.json();

      const totalBytes = Object.values(data as Record<string, number>).reduce((a, b) => a + b, 0);
      if (totalBytes === 0) return {};

      const percentages: Record<string, number> = {};
      for (const [lang, bytes] of Object.entries(data as Record<string, number>)) {
        percentages[lang] = Math.round((bytes / totalBytes) * 100);
      }
      return percentages;
    } catch {
      return {};
    }
  }

  async fetchBranches(owner: string, repo: string): Promise<string[]> {
    try {
      const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=30`;
      const res = await fetch(url, { headers: this.buildHeaders() });
      if (!res.ok) return ["main"];
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((b: any) => b.name);
      }
      return ["main"];
    } catch {
      return ["main"];
    }
  }

  async fetchFileTree(owner: string, repo: string, branch: string): Promise<GitTreeItem[]> {
    const cacheKey = `${owner}/${repo}/${branch}`;
    const cached = await repoCache.getTree(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
    const res = await fetch(url, { headers: this.buildHeaders() });

    if (!res.ok) {
      throw new Error(this.handleRateLimit(res));
    }

    const data = await res.json();
    if (!Array.isArray(data.tree)) {
      throw new Error("Invalid git tree response from GitHub");
    }

    const rawTree: GitTreeItem[] = data.tree;

    // Filter tree to ignore unwanted dependencies, build artifacts, etc.
    const filtered = rawTree.filter((item) => {
      const parts = item.path.split("/");
      for (const p of parts) {
        if (SKIP_DIRECTORIES.has(p)) return false;
      }
      return true;
    });

    await repoCache.setTree(cacheKey, filtered);
    return filtered;
  }

  async fetchFileContent(
    owner: string,
    repo: string,
    branch: string,
    path: string,
    isPrivate = false
  ): Promise<string> {
    const cacheKey = `${owner}/${repo}/${branch}/${path}`;
    const cached = await repoCache.getFile(cacheKey);
    if (cached !== null) return cached;

    // Check extension for binary files
    const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
    if (SKIP_EXTENSIONS.has(ext)) {
      return `// Binary or media file (${ext}) - View raw on GitHub`;
    }

    // Optimization: For public repositories, fetch from raw.githubusercontent.com (does not consume API quota!)
    if (!isPrivate) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
        const rawRes = await fetch(rawUrl);
        if (rawRes.ok) {
          const text = await rawRes.text();
          if (text.length > MAX_FILE_SIZE_BYTES) {
            return `// File too large (${Math.round(text.length / 1024)} KB, limit 300 KB). View on GitHub: https://github.com/${owner}/${repo}/blob/${branch}/${path}`;
          }
          await repoCache.setFile(cacheKey, text);
          return text;
        }
      } catch (err) {
        console.warn("raw.githubusercontent fetch failed, falling back to contents API:", err);
      }
    }

    // Fallback: GitHub Contents API with raw header
    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.raw",
      "User-Agent": "CodeAtlas-Codebase-Intelligence",
    };
    const token = this.getAuthToken();
    if (token && !token.startsWith("sandbox_")) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(apiUrl, { headers });
    if (!res.ok) {
      throw new Error(`Failed to load file content from ${owner}/${repo}/${path}: ${res.statusText}`);
    }

    const content = await res.text();
    if (content.length > MAX_FILE_SIZE_BYTES) {
      return `// File too large (${Math.round(content.length / 1024)} KB, limit 300 KB). View on GitHub: https://github.com/${owner}/${repo}/blob/${branch}/${path}`;
    }

    await repoCache.setFile(cacheKey, content);
    return content;
  }
}

export const githubMetadataService = new GitHubMetadataService();

