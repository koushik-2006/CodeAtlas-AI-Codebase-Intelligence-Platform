/**
 * GitHub URL Parser and Normalizer
 * 
 * Supports all GitHub URL variants:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo/ (trailing slash)
 * - http://github.com/owner/repo
 * - http://www.github.com/owner/repo
 * - github.com/owner/repo (no scheme)
 * - git@github.com:owner/repo.git
 * - owner/repo (slug format)
 * - owner/repo.git
 * - https://github.com/owner/repo/tree/<branch>/<path>
 * - https://github.com/owner/repo/blob/<branch>/<path>
 */

export interface ParsedGitHubUrl {
  valid: boolean;
  owner: string;
  repo: string;
  fullName: string; // "owner/repo"
  branch?: string;
  path?: string;
  cloneUrl: string; // "https://github.com/owner/repo.git"
  htmlUrl: string; // "https://github.com/owner/repo"
  error?: string;
}

const GITHUB_NAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

export function parseGitHubUrl(input: string): ParsedGitHubUrl {
  const invalidResult = (error: string): ParsedGitHubUrl => ({
    valid: false,
    owner: "",
    repo: "",
    fullName: "",
    cloneUrl: "",
    htmlUrl: "",
    error,
  });

  if (!input || typeof input !== "string") {
    return invalidResult("Input URL is empty");
  }

  let trimmed = input.trim();

  // 1. Handle SSH format: git@github.com:owner/repo.git
  const sshMatch = trimmed.match(/^git@github\.com:([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?\/?$/);
  if (sshMatch) {
    const owner = sshMatch[1];
    let repo = sshMatch[2];
    if (repo.endsWith(".git")) repo = repo.slice(0, -4);

    return {
      valid: true,
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      cloneUrl: `https://github.com/${owner}/${repo}.git`,
      htmlUrl: `https://github.com/${owner}/${repo}`,
    };
  }

  // 2. Handle simple slug format: owner/repo or owner/repo.git (when no hostname or scheme is present)
  if (!trimmed.includes("://") && !trimmed.toLowerCase().startsWith("github.com") && !trimmed.toLowerCase().startsWith("www.github.com")) {
    const slugMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?\/?$/);
    if (slugMatch) {
      const owner = slugMatch[1];
      let repo = slugMatch[2];
      if (repo.endsWith(".git")) repo = repo.slice(0, -4);

      if (GITHUB_NAME_REGEX.test(owner) && GITHUB_NAME_REGEX.test(repo)) {
        return {
          valid: true,
          owner,
          repo,
          fullName: `${owner}/${repo}`,
          cloneUrl: `https://github.com/${owner}/${repo}.git`,
          htmlUrl: `https://github.com/${owner}/${repo}`,
        };
      }
    }
  }

  // 3. Normalize scheme if missing (e.g. github.com/owner/repo or www.github.com/owner/repo)
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();

    if (hostname !== "github.com" && hostname !== "www.github.com") {
      return invalidResult(`Host "${url.hostname}" is not GitHub (must be github.com)`);
    }

    // Split pathname segments, ignoring empty segments
    const segments = url.pathname.split("/").filter(Boolean);

    if (segments.length < 2) {
      return invalidResult("GitHub URL must include both owner and repository name");
    }

    const owner = segments[0];
    let repo = segments[1];

    // Strip .git suffix if present
    if (repo.toLowerCase().endsWith(".git")) {
      repo = repo.slice(0, -4);
    }

    if (!GITHUB_NAME_REGEX.test(owner)) {
      return invalidResult(`Invalid GitHub owner name: "${owner}"`);
    }

    if (!GITHUB_NAME_REGEX.test(repo)) {
      return invalidResult(`Invalid GitHub repository name: "${repo}"`);
    }

    let branch: string | undefined;
    let path: string | undefined;

    // Check for /tree/<branch>/<path> or /blob/<branch>/<path>
    if (segments.length >= 4 && (segments[2] === "tree" || segments[2] === "blob")) {
      branch = segments[3];
      if (segments.length > 4) {
        path = segments.slice(4).join("/");
      }
    }

    return {
      valid: true,
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      branch,
      path,
      cloneUrl: `https://github.com/${owner}/${repo}.git`,
      htmlUrl: `https://github.com/${owner}/${repo}`,
    };
  } catch (err: any) {
    return invalidResult(`Invalid URL format: ${err?.message || "parse error"}`);
  }
}
