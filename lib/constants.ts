export const STORAGE_KEYS = {
  THEME: "codeatlas-theme",
  GITHUB_CONNECTED: "codeatlas-github-connected",
  RECENT_SEARCHES: "codeatlas-recent-searches",
  AUTH_USER: "codeatlas-auth-user",
  AUTH_SESSION: "codeatlas-auth-session",
} as const;

export const DEFAULT_SNIPPET = `def login(email, pw):
    user = db.find(email)
    if not user:
        raise AuthError("Invalid user")
    return verify(user, pw)`;

export const SAMPLE_REPOSITORIES_DATA = [
  {
    id: "my-project",
    name: "my-project",
    owner: "koush-dev",
    description: "Core authentication and user service pipeline with FastAPI & React.",
    visibility: "private" as const,
    language: "Python",
    lastAnalyzed: "12 mins ago",
    status: "ready" as const,
    progress: 100,
    symbolCount: 6,
    connectionType: "github" as const,
    loc: 1248,
    branch: "main",
  },
  {
    id: "ecommerce-platform",
    name: "ecommerce-platform",
    owner: "org-scale",
    description: "High-throughput checkout orchestration and inventory management.",
    visibility: "private" as const,
    language: "TypeScript",
    lastAnalyzed: "2 hours ago",
    status: "ready" as const,
    progress: 100,
    symbolCount: 142,
    connectionType: "github" as const,
    loc: 8420,
    branch: "master",
  },
  {
    id: "auth-service",
    name: "auth-service",
    owner: "koush-dev",
    description: "OAuth2 and JWT token validation microservice.",
    visibility: "public" as const,
    language: "Go",
    lastAnalyzed: "1 day ago",
    status: "indexing" as const,
    progress: 68,
    symbolCount: 38,
    connectionType: "git_url" as const,
    loc: 3100,
    branch: "main",
  },
  {
    id: "fastapi-backend",
    name: "fastapi-backend",
    owner: "team-infra",
    description: "RESTful API backend for analytics aggregation and reporting.",
    visibility: "public" as const,
    language: "Python",
    lastAnalyzed: "3 days ago",
    status: "ready" as const,
    progress: 100,
    symbolCount: 94,
    connectionType: "zip" as const,
    loc: 5600,
    branch: "dev",
  },
];
