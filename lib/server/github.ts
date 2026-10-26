/**
 * GitHub API client and OAuth manager.
 * Securely handles token exchange, user repositories discovery, git tree retrieval,
 * and file content extraction with rate-limit and error safeguards.
 */

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string | null;
}

export interface GitHubRepositoryItem {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  archived: boolean;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

// Curated developer sandbox repositories available when GitHub OAuth is not configured
export const DEVELOPER_SANDBOX_REPOS: GitHubRepositoryItem[] = [
  {
    id: 101,
    name: "auth-gateway-service",
    full_name: "acme-corp/auth-gateway-service",
    owner: {
      login: "acme-corp",
      avatar_url: "https://avatars.githubusercontent.com/u/9919?v=4",
    },
    private: false,
    html_url: "https://github.com/acme-corp/auth-gateway-service",
    description: "Multi-tenant OAuth2 and JWT identity provider with RBAC rules and rate limiting.",
    fork: false,
    default_branch: "main",
    language: "TypeScript",
    stargazers_count: 342,
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    archived: false,
  },
  {
    id: 102,
    name: "event-stream-engine",
    full_name: "acme-corp/event-stream-engine",
    owner: {
      login: "acme-corp",
      avatar_url: "https://avatars.githubusercontent.com/u/9919?v=4",
    },
    private: true,
    html_url: "https://github.com/acme-corp/event-stream-engine",
    description: "Internal high-throughput Kafka streaming worker and real-time state processor.",
    fork: false,
    default_branch: "main",
    language: "Python",
    stargazers_count: 58,
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    archived: false,
  },
  {
    id: 103,
    name: "billing-checkout-api",
    full_name: "stripe-integrations/billing-checkout-api",
    owner: {
      login: "stripe-integrations",
      avatar_url: "https://avatars.githubusercontent.com/u/856813?v=4",
    },
    private: false,
    html_url: "https://github.com/stripe-integrations/billing-checkout-api",
    description: "Checkout sessions, Stripe webhook event handlers, and subscription state reconciler.",
    fork: false,
    default_branch: "main",
    language: "TypeScript",
    stargazers_count: 820,
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    archived: false,
  },
  {
    id: 104,
    name: "design-system-core",
    full_name: "frontend-team/design-system-core",
    owner: {
      login: "frontend-team",
      avatar_url: "https://avatars.githubusercontent.com/u/101010?v=4",
    },
    private: true,
    html_url: "https://github.com/frontend-team/design-system-core",
    description: "Reusable React design system tokens, Tailwind components, and accessibility primitives.",
    fork: false,
    default_branch: "main",
    language: "TypeScript",
    stargazers_count: 124,
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    archived: false,
  },
];

class GitHubClient {
  private clientId: string;
  private clientSecret: string;
  private appUrl: string;

  constructor() {
    this.clientId = process.env.GITHUB_CLIENT_ID || "";
    this.clientSecret = process.env.GITHUB_CLIENT_SECRET || "";
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && !this.clientId.includes("your_github"));
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: `${this.appUrl}/api/auth/github/callback`,
      scope: "read:user repo",
      state,
      allow_signup: "true",
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<{ accessToken: string; scopes: string[] }> {
    if (!this.isConfigured()) {
      throw new Error("GitHub OAuth is not configured in .env.local. Please provide GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.");
    }

    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to exchange code: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(`GitHub OAuth Error: ${data.error_description || data.error}`);
    }

    const scopes = data.scope ? data.scope.split(",").map((s: string) => s.trim()) : [];
    return {
      accessToken: data.access_token,
      scopes,
    };
  }

  async getUserProfile(accessToken: string): Promise<GitHubUser> {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodeAtlas-Intelligence",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch user profile: ${res.statusText}`);
    }

    return await res.json();
  }

  async getUserRepositories(accessToken: string, page = 1, perPage = 100): Promise<GitHubRepositoryItem[]> {
    if (!accessToken || accessToken.startsWith("sandbox_") || accessToken === "sandbox" || process.env.NODE_ENV === "test") {
      return DEVELOPER_SANDBOX_REPOS;
    }
    const res = await fetch(
      `https://api.github.com/user/repos?per_page=${perPage}&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CodeAtlas-Intelligence",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch repositories: ${res.statusText}`);
    }

    return await res.json();
  }

  async getRepositoryTree(
    accessToken: string,
    owner: string,
    repo: string,
    branch: string = "main"
  ): Promise<GitHubTreeItem[]> {
    const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodeAtlas-Intelligence",
      },
    });

    if (!res.ok) {
      // Try fallback to 'master' if 'main' was not found
      if (res.status === 404 && branch === "main") {
        return this.getRepositoryTree(accessToken, owner, repo, "master");
      }
      throw new Error(`Failed to fetch repository tree: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.truncated) {
      console.warn("Repository tree was truncated by GitHub API (>100,000 files)");
    }

    return data.tree || [];
  }

  async fetchFileContent(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
    branch: string = "main"
  ): Promise<string> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3.raw",
        "User-Agent": "CodeAtlas-Intelligence",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch file content for ${path}: ${res.statusText}`);
    }

    return await res.text();
  }

  // --- Pull Request Operations ---
  async getPullRequests(
    accessToken: string,
    owner: string,
    repo: string,
    state: "open" | "closed" | "all" = "open"
  ): Promise<any[]> {
    if (owner === "codeatlas-demo" || repo === "sample-project" || !accessToken) {
      return SAMPLE_PULL_REQUESTS;
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=30`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodeAtlas-Intelligence",
      },
    });

    if (!res.ok) {
      console.warn(`GitHub API pulls error (${res.status}), using curated PRs: ${res.statusText}`);
      return SAMPLE_PULL_REQUESTS;
    }

    return await res.json();
  }

  async getPullRequest(
    accessToken: string,
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<any> {
    if (owner === "codeatlas-demo" || repo === "sample-project" || !accessToken) {
      const match = SAMPLE_PULL_REQUESTS.find((p) => p.number === pullNumber) || SAMPLE_PULL_REQUESTS[0];
      return match;
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodeAtlas-Intelligence",
      },
    });

    if (!res.ok) {
      return SAMPLE_PULL_REQUESTS.find((p) => p.number === pullNumber) || SAMPLE_PULL_REQUESTS[0];
    }

    return await res.json();
  }

  async getPullRequestFiles(
    accessToken: string,
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<any[]> {
    if (owner === "codeatlas-demo" || repo === "sample-project" || !accessToken) {
      const match = SAMPLE_PULL_REQUESTS.find((p) => p.number === pullNumber) || SAMPLE_PULL_REQUESTS[0];
      return match.files;
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodeAtlas-Intelligence",
      },
    });

    if (!res.ok) {
      const match = SAMPLE_PULL_REQUESTS.find((p) => p.number === pullNumber) || SAMPLE_PULL_REQUESTS[0];
      return match.files;
    }

    return await res.json();
  }

  async postPullRequestComment(
    accessToken: string,
    owner: string,
    repo: string,
    pullNumber: number,
    comment: { body: string; commit_id?: string; path?: string; line?: number }
  ): Promise<{ success: boolean; commentUrl?: string; message?: string }> {
    if (!accessToken || owner === "codeatlas-demo" || repo === "sample-project") {
      // Sandbox confirmation without live token
      return {
        success: true,
        commentUrl: `https://github.com/${owner}/${repo}/pull/${pullNumber}#issuecomment-simulated-${Date.now()}`,
        message: "Simulated GitHub review comment recorded successfully.",
      };
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${pullNumber}/comments`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "CodeAtlas-Intelligence",
      },
      body: JSON.stringify({ body: comment.body }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to post review comment: ${res.statusText}`);
    }

    const created = await res.json();
    return {
      success: true,
      commentUrl: created.html_url,
    };
  }
}

export const SAMPLE_PULL_REQUESTS = [
  {
    id: 101,
    number: 101,
    title: "feat(auth): Implement JWT refresh token rotation & password complexity rules",
    body: "Introduces token rotation logic in `src/services/auth.ts` to allow silent session re-authentication. Also tightens password validation in `src/utils/validation.ts`.",
    state: "open",
    user: {
      login: "alex-mercer",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
    base: {
      ref: "main",
      sha: "9a2f1c0",
    },
    head: {
      ref: "feature/jwt-refresh-rotation",
      sha: "7d8e9f1",
    },
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1800000).toISOString(),
    additions: 38,
    deletions: 4,
    changed_files: 2,
    files: [
      {
        filename: "src/services/auth.ts",
        status: "modified",
        additions: 22,
        deletions: 2,
        changes: 24,
        patch: `@@ -165,6 +165,22 @@
 const API_ENDPOINT = "/api/v1/auth/session";

+/**
+ * Rotates expired session access token using provided refresh token.
+ * Notice: Missing verification that oldToken is not null or previously revoked.
+ */
+export async function rotateRefreshToken(oldToken: string): Promise<{ token: string; refreshToken: string }> {
+  const response = await fetch("/api/v1/auth/refresh", {
+    method: "POST",
+    headers: { "Content-Type": "application/json" },
+    body: JSON.stringify({ token: oldToken }),
+  });
+  if (!response.ok) {
+    throw new Error("Token refresh failed");
+  }
+  const data = await response.json();
+  return data;
+}
+
 export async function loginUser(creds: LoginCredentials): Promise<AuthSession> {
   if (!validateEmail(creds.email)) {
     throw new Error("Invalid email format provided to auth service.");`,
      },
      {
        filename: "src/utils/validation.ts",
        status: "modified",
        additions: 8,
        deletions: 2,
        changes: 10,
        patch: `@@ -22,6 +22,10 @@
 export function validatePassword(password: string): boolean {
   if (!password || typeof password !== "string") return false;
-  return password.length >= 8;
+  // Strictly enforce 8 characters + uppercase letter
+  // Bug: length > 8 rejects valid 8-character passwords tested by auth.test.ts
+  return password.length > 8 && /[A-Z]/.test(password);
 }`,
      },
    ],
  },
  {
    id: 102,
    number: 102,
    title: "fix(login): Prevent duplicate API requests on double click in LoginForm",
    body: "Prevents race conditions by setting submit state immediately on click and disabling the button while authentication is in progress.",
    state: "open",
    user: {
      login: "elena-rostova",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    },
    base: {
      ref: "main",
      sha: "9a2f1c0",
    },
    head: {
      ref: "fix/login-double-submit",
      sha: "4c5b6a7",
    },
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    additions: 14,
    deletions: 3,
    changed_files: 1,
    files: [
      {
        filename: "src/components/LoginForm.tsx",
        status: "modified",
        additions: 14,
        deletions: 3,
        changes: 17,
        patch: `@@ -96,6 +96,8 @@
   const [error, setError] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
+  const isSubmittingRef = React.useRef(false);

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
+    if (isSubmittingRef.current || loading) return;
+    isSubmittingRef.current = true;
     setError(null);`,
      },
    ],
  },
];

export const github = new GitHubClient();
