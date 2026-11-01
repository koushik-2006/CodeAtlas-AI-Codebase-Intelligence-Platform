/**
 * CodeAtlas Central Demo Store
 *
 * Provides a rich, reactive, offline-capable in-memory & localStorage data store
 * for the static GitHub Pages export of CodeAtlas.
 */

import { SAMPLE_REPOSITORIES_DATA } from "@/lib/constants";
import { SAMPLE_PROJECT_TREE, SAMPLE_PROJECT_CODE } from "@/lib/sample-repository-files";

export interface StoreUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  provider: string;
}

export const DEMO_USER: StoreUser = {
  id: "usr_demo",
  name: "Demo User",
  email: "demo@codeatlas.dev",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  role: "Lead Systems Architect",
  provider: "demo",
};

export interface FileTreeItem {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  language?: string;
  size?: string;
  children?: FileTreeItem[];
}

export interface DemoStoreData {
  version: number;
  workspaces: any[];
  workspaceMembers: Record<string, any[]>;
  workspaceRepositories: Record<string, any[]>;
  workspaceAnnotations: Record<string, any[]>;
  workspaceArtifacts: Record<string, any[]>;
  workspaceActivities: Record<string, any[]>;
  discussions: Record<string, any[]>;
  decisions: Record<string, any>;
  invitations: any[];
  repositories: any[];
  repositoryTrees: Record<string, FileTreeItem[]>;
  repositoryFiles: Record<string, Record<string, { code: string; language: string }>>;
  repositoryDependencies: Record<string, any[]>;
  repositorySymbols: Record<string, any[]>;
  pullRequests: any[];
  reviewSessions: Record<string, any>;
  agentRuns: any[];
  agentWorkflows: any[];
  debugInvestigations: any[];
  debugFollowUps: Record<string, any[]>;
  refactoringProposals: any[];
  debtOverviews: Record<string, any>;
  notifications: any[];
  activities: any[];
  userSettings: any;
  circuitBreakers: Record<string, any>;
  alertRules: any[];
  systemHealth: any;
  logs: any[];
  traces: any[];
}

const STORE_VERSION = 3;

/**
 * Generates the complete initial seeded dataset across 3 workspaces and 7 repositories.
 */
export function createInitialData(): DemoStoreData {
  const timestamp = new Date().toISOString();

  // 1. Repositories (7 seeded codebases)
  const repositories = [
    {
      id: "sample-project",
      name: "demo-auth-service",
      owner: "codeatlas-demo",
      description: "Authentication & Session Management Architecture with AST symbol graphs and verified tests.",
      visibility: "public",
      language: "TypeScript",
      languages: ["TypeScript", "HTML", "JSON"],
      defaultBranch: "main",
      branch: "main",
      url: "https://github.com/codeatlas-demo/demo-auth-service",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 24,
      fileCount: 8,
      lastAnalyzed: "Just now",
      lastIndexed: "Just now",
      isIndexed: true,
      isStale: false,
      revision: "a8f7b2c",
      connectionType: "sample",
      loc: 1420,
    },
    {
      id: "my-project",
      name: "my-project",
      owner: "koush-dev",
      description: "Core authentication and user service pipeline with FastAPI & React.",
      visibility: "private",
      language: "Python",
      languages: ["Python", "TypeScript", "SQL"],
      defaultBranch: "main",
      branch: "main",
      url: "https://github.com/koush-dev/my-project",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 32,
      fileCount: 10,
      lastAnalyzed: "12 mins ago",
      lastIndexed: "12 mins ago",
      isIndexed: true,
      isStale: false,
      revision: "f4b1e9d",
      connectionType: "github",
      loc: 2480,
    },
    {
      id: "ecommerce-platform",
      name: "ecommerce-platform",
      owner: "org-scale",
      description: "High-throughput checkout orchestration and inventory management.",
      visibility: "private",
      language: "TypeScript",
      languages: ["TypeScript", "CSS", "JSON"],
      defaultBranch: "main",
      branch: "main",
      url: "https://github.com/org-scale/ecommerce-platform",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 142,
      fileCount: 16,
      lastAnalyzed: "2 hours ago",
      lastIndexed: "2 hours ago",
      isIndexed: true,
      isStale: false,
      revision: "c3d9a18",
      connectionType: "github",
      loc: 8420,
    },
    {
      id: "auth-service",
      name: "auth-service",
      owner: "koush-dev",
      description: "OAuth2 and JWT token validation microservice with high-availability caching.",
      visibility: "public",
      language: "Go",
      languages: ["Go", "Makefile"],
      defaultBranch: "main",
      branch: "main",
      url: "https://github.com/koush-dev/auth-service",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 38,
      fileCount: 8,
      lastAnalyzed: "1 day ago",
      lastIndexed: "1 day ago",
      isIndexed: true,
      isStale: false,
      revision: "8b7d14e",
      connectionType: "git_url",
      loc: 3100,
    },
    {
      id: "fastapi-backend",
      name: "fastapi-backend",
      owner: "team-infra",
      description: "RESTful API backend for analytics aggregation, report generation, and data marts.",
      visibility: "public",
      language: "Python",
      languages: ["Python", "Dockerfile"],
      defaultBranch: "main",
      branch: "main",
      url: "https://github.com/team-infra/fastapi-backend",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 94,
      fileCount: 14,
      lastAnalyzed: "3 days ago",
      lastIndexed: "3 days ago",
      isIndexed: true,
      isStale: false,
      revision: "9a2c3f1",
      connectionType: "zip",
      loc: 5600,
    },
    {
      id: "shared-core-lib",
      name: "shared-core-lib",
      owner: "acme-corp",
      description: "Internal shared TypeScript library (@acme/shared-utils) for validation, formatting, and HTTP clients.",
      visibility: "public",
      language: "TypeScript",
      languages: ["TypeScript", "JSON"],
      defaultBranch: "main",
      branch: "main",
      url: "https://github.com/acme-corp/shared-core-lib",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 28,
      fileCount: 7,
      lastAnalyzed: "Today at 09:30 AM",
      lastIndexed: "Today at 09:30 AM",
      isIndexed: true,
      isStale: false,
      revision: "e7d1a49",
      connectionType: "sample",
      loc: 2150,
    },
    {
      id: "payment-service",
      name: "payment-service",
      owner: "acme-corp",
      description: "Checkout orchestrator and payment processing microservice with currency formatting.",
      visibility: "public",
      language: "TypeScript",
      languages: ["TypeScript", "JSON"],
      defaultBranch: "main",
      branch: "main",
      url: "https://github.com/acme-corp/payment-service",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 22,
      fileCount: 6,
      lastAnalyzed: "Yesterday at 04:20 PM",
      lastIndexed: "Yesterday at 04:20 PM",
      isIndexed: true,
      isStale: false,
      revision: "7f4c12d",
      connectionType: "sample",
      loc: 1840,
    },
  ];

  // 2. Workspaces (3 seeded workspaces)
  const workspaces = [
    {
      id: "ws_team_demo",
      name: "Acme Engineering",
      slug: "acme-engineering",
      description: "Core platform and microservices shared intelligence workspace.",
      ownerId: "usr_demo",
      isPersonal: false,
      userRole: "owner",
      memberCount: 4,
      repoCount: 3,
      settings: {
        allowMemberInvites: true,
        defaultRepoId: "sample-project",
        requireReviewDismissalReason: true,
      },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-15T12:00:00.000Z",
    },
    {
      id: "ws_default",
      name: "Default Team Workspace",
      slug: "default-team",
      description: "General engineering workspace with connected demo services.",
      ownerId: "usr_demo",
      isPersonal: false,
      userRole: "owner",
      memberCount: 3,
      repoCount: 2,
      settings: {
        allowMemberInvites: true,
        defaultRepoId: "sample-project",
        requireReviewDismissalReason: false,
      },
      createdAt: "2026-01-05T00:00:00.000Z",
      updatedAt: "2026-01-18T10:00:00.000Z",
    },
    {
      id: "workspace-1",
      name: "Personal Workspace",
      slug: "personal-workspace",
      description: "Private developer sandbox and individual code exploration.",
      ownerId: "usr_demo",
      isPersonal: true,
      userRole: "owner",
      memberCount: 1,
      repoCount: 2,
      settings: {
        allowMemberInvites: false,
        defaultRepoId: "my-project",
        requireReviewDismissalReason: false,
      },
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-20T08:00:00.000Z",
    },
  ];

  const workspaceMembers: Record<string, any[]> = {
    ws_team_demo: [
      {
        id: "mem_1",
        workspaceId: "ws_team_demo",
        userId: "usr_demo",
        role: "owner",
        joinedAt: "2026-01-01T00:00:00.000Z",
        userName: "Demo User",
        userEmail: "demo@codeatlas.dev",
        userAvatar: DEMO_USER.avatar,
      },
      {
        id: "mem_2",
        workspaceId: "ws_team_demo",
        userId: "usr_elena",
        role: "admin",
        joinedAt: "2026-01-02T10:00:00.000Z",
        userName: "Elena Rostova",
        userEmail: "elena@codeatlas.dev",
        userAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
      },
      {
        id: "mem_3",
        workspaceId: "ws_team_demo",
        userId: "usr_marcus",
        role: "member",
        joinedAt: "2026-01-03T14:30:00.000Z",
        userName: "Marcus Chen",
        userEmail: "marcus@codeatlas.dev",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      },
      {
        id: "mem_4",
        workspaceId: "ws_team_demo",
        userId: "usr_sarah",
        role: "viewer",
        joinedAt: "2026-01-05T09:15:00.000Z",
        userName: "Sarah Jenkins",
        userEmail: "sarah@codeatlas.dev",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      },
    ],
    ws_default: [
      {
        id: "mem_def_1",
        workspaceId: "ws_default",
        userId: "usr_demo",
        role: "owner",
        joinedAt: "2026-01-05T00:00:00.000Z",
        userName: "Demo User",
        userEmail: "demo@codeatlas.dev",
        userAvatar: DEMO_USER.avatar,
      },
    ],
    "workspace-1": [
      {
        id: "mem_p_1",
        workspaceId: "workspace-1",
        userId: "usr_demo",
        role: "owner",
        joinedAt: "2026-01-10T00:00:00.000Z",
        userName: "Demo User",
        userEmail: "demo@codeatlas.dev",
        userAvatar: DEMO_USER.avatar,
      },
    ],
  };

  const workspaceRepositories: Record<string, any[]> = {
    ws_team_demo: [
      { id: "wsr_1", workspaceId: "ws_team_demo", repositoryId: "sample-project", addedBy: "usr_demo", addedAt: "2026-01-01T00:00:00.000Z" },
      { id: "wsr_2", workspaceId: "ws_team_demo", repositoryId: "shared-core-lib", addedBy: "usr_demo", addedAt: "2026-01-02T00:00:00.000Z" },
      { id: "wsr_3", workspaceId: "ws_team_demo", repositoryId: "payment-service", addedBy: "usr_demo", addedAt: "2026-01-02T00:00:00.000Z" },
    ],
    ws_default: [
      { id: "wsr_4", workspaceId: "ws_default", repositoryId: "sample-project", addedBy: "usr_demo", addedAt: "2026-01-05T00:00:00.000Z" },
      { id: "wsr_5", workspaceId: "ws_default", repositoryId: "ecommerce-platform", addedBy: "usr_demo", addedAt: "2026-01-05T00:00:00.000Z" },
    ],
    "workspace-1": [
      { id: "wsr_6", workspaceId: "workspace-1", repositoryId: "my-project", addedBy: "usr_demo", addedAt: "2026-01-10T00:00:00.000Z" },
      { id: "wsr_7", workspaceId: "workspace-1", repositoryId: "sample-project", addedBy: "usr_demo", addedAt: "2026-01-10T00:00:00.000Z" },
    ],
  };

  // 3. File trees and source code for all 7 repos
  const repositoryTrees: Record<string, FileTreeItem[]> = {
    "sample-project": SAMPLE_PROJECT_TREE,
    "my-project": [
      {
        id: "folder-app",
        name: "app",
        type: "folder",
        path: "app",
        children: [
          { id: "file-main", name: "main.py", type: "file", path: "app/main.py", language: "python", size: "2.1 KB" },
          { id: "file-auth-router", name: "auth.py", type: "file", path: "app/auth.py", language: "python", size: "1.9 KB" },
          { id: "file-models", name: "models.py", type: "file", path: "app/models.py", language: "python", size: "1.4 KB" },
        ],
      },
      { id: "file-py-readme", name: "README.md", type: "file", path: "README.md", language: "markdown", size: "850 B" },
    ],
    "shared-core-lib": [
      {
        id: "folder-shared-src",
        name: "src",
        type: "folder",
        path: "src",
        children: [
          { id: "file-shared-valid", name: "validators.ts", type: "file", path: "src/validators.ts", language: "typescript", size: "1.1 KB" },
          { id: "file-shared-client", name: "http-client.ts", type: "file", path: "src/http-client.ts", language: "typescript", size: "1.6 KB" },
          { id: "file-shared-index", name: "index.ts", type: "file", path: "src/index.ts", language: "typescript", size: "420 B" },
        ],
      },
    ],
    "payment-service": [
      {
        id: "folder-pay-src",
        name: "src",
        type: "folder",
        path: "src",
        children: [
          { id: "file-pay-checkout", name: "checkout.ts", type: "file", path: "src/checkout.ts", language: "typescript", size: "2.4 KB" },
          { id: "file-pay-gateway", name: "gateway.ts", type: "file", path: "src/gateway.ts", language: "typescript", size: "1.8 KB" },
        ],
      },
    ],
  };

  const repositoryFiles: Record<string, Record<string, { code: string; language: string }>> = {
    "sample-project": SAMPLE_PROJECT_CODE,
    "my-project": {
      "app/main.py": {
        language: "python",
        code: `from fastapi import FastAPI\nfrom app.auth import auth_router\n\napp = FastAPI(title="Core Auth API")\napp.include_router(auth_router, prefix="/api/v1/auth")\n\n@app.get("/health")\ndef health_check():\n    return {"status": "ok"}\n`,
      },
      "app/auth.py": {
        language: "python",
        code: `from fastapi import APIRouter, HTTPException, Depends\n\nauth_router = APIRouter()\n\n@auth_router.post("/login")\ndef login(payload: dict):\n    email = payload.get("email")\n    if not email:\n        raise HTTPException(status_code=400, detail="Email is required")\n    return {"token": "jwt_sample_token", "user": {"email": email}}\n`,
      },
    },
    "shared-core-lib": {
      "src/validators.ts": {
        language: "typescript",
        code: `export function validateEmail(val: string): boolean {\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(val.trim());\n}\n\nexport function validateUuid(id: string): boolean {\n  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);\n}\n`,
      },
      "src/http-client.ts": {
        language: "typescript",
        code: `export class HttpClient {\n  constructor(private baseUrl: string) {}\n  async get<T>(path: string): Promise<T> {\n    const res = await fetch(\`\${this.baseUrl}\${path}\`);\n    return res.json();\n  }\n}\n`,
      },
    },
    "payment-service": {
      "src/checkout.ts": {
        language: "typescript",
        code: `import { validateEmail } from "@acme/shared-utils";\n\nexport async function processCheckout(orderId: string, email: string, amount: number) {\n  if (!validateEmail(email)) throw new Error("Invalid customer email");\n  return { orderId, status: "processed", amount };\n}\n`,
      },
    },
  };

  // 4. Pull Requests
  const pullRequests = [
    {
      id: "pr_101",
      number: 101,
      title: "feat(auth): Add WebAuthn and passkey credential support",
      body: "Introduces public-key authentication endpoints and cryptographic assertion verification.\n\n- Updates `loginUser` to support public-key challenge verification.\n- Adds WebAuthn ceremony helper.",
      author: {
        name: "Elena Rostova",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
      },
      baseBranch: "main",
      headBranch: "feat/webauthn-passkeys",
      baseSha: "30e6d94e",
      headSha: "a8f7b2c1",
      state: "open",
      createdAt: "2026-01-20T10:15:00.000Z",
      updatedAt: "2026-01-21T14:22:00.000Z",
      additions: 142,
      deletions: 18,
      changedFilesCount: 3,
      files: [
        {
          filename: "src/services/auth.ts",
          status: "modified",
          additions: 84,
          deletions: 12,
          changes: 96,
          patch: "@@ -18,6 +18,18 @@ export async function loginUser(email, pass) {\n+  if (creds.isWebAuthn) {\n+    return verifyWebAuthnAssertion(creds.assertion);\n+  }",
        },
        {
          filename: "src/utils/validation.ts",
          status: "modified",
          additions: 32,
          deletions: 4,
          changes: 36,
          patch: "@@ -4,6 +4,12 @@ export function validateEmail(email) {\n+export function validatePasskeyChallenge(challenge: string): boolean {\n+  return typeof challenge === 'string' && challenge.length >= 32;\n+}",
        },
        {
          filename: "tests/auth.test.ts",
          status: "modified",
          additions: 26,
          deletions: 2,
          changes: 28,
          patch: "@@ -18,4 +18,14 @@ test('testLoginSuccess', async () => {\n+test('testWebAuthnChallengeVerification', async () => {\n+  const valid = validatePasskeyChallenge('challenge-bytes-12345678901234567890');\n+  expect(valid).toBe(true);\n+});",
        },
      ],
    },
    {
      id: "pr_102",
      number: 102,
      title: "fix(cache): Resolve race condition in distributed token cache",
      body: "Applies distributed lock mutex around refresh token rotation to prevent duplicate revocation events.",
      author: {
        name: "Marcus Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      },
      baseBranch: "main",
      headBranch: "fix/token-race-condition",
      baseSha: "30e6d94e",
      headSha: "b4c9e8d2",
      state: "open",
      createdAt: "2026-01-22T08:30:00.000Z",
      updatedAt: "2026-01-22T09:45:00.000Z",
      additions: 45,
      deletions: 9,
      changedFilesCount: 2,
      files: [],
    },
  ];

  // 5. Code Review Session
  const reviewSessions: Record<string, any> = {
    "sample-project_101": {
      id: "rev_session_101",
      repositoryId: "sample-project",
      pullRequestNumber: 101,
      summary: "Automated AI code review verified 3 changed files. Detected 1 critical security vulnerability (missing challenge replay check) and 1 test coverage recommendation.",
      analyzedAt: "2026-01-21T14:30:00.000Z",
      status: "completed",
      isSecurityReviewOnly: false,
      findings: [
        {
          id: "finding-sec-1",
          title: "WebAuthn challenge replay vulnerability in assertion validation",
          description: "The authentication handler parses `creds.assertion` but does not assert that the nonce was previously issued and not yet redeemed.",
          severity: "critical",
          category: "security",
          file: "src/services/auth.ts",
          line: 24,
          lineRange: "22-26",
          codeSnippet: "if (creds.isWebAuthn) {\n  return verifyWebAuthnAssertion(creds.assertion);\n}",
          whyItMatters: "An adversary capturing a signed assertion could replay it to authenticate as the target user without holding the private security key.",
          suggestedRemediation: "Verify the nonce against the Redis nonce cache and atomically mark it as used using `nonceCache.consume(assertion.challenge)`.",
          isVerifiedFromSource: true,
          status: "open",
          publishedToGitHub: false,
        },
        {
          id: "finding-test-1",
          title: "Missing unit test for invalid passkey challenge length",
          description: "While `validatePasskeyChallenge` is implemented, tests only cover valid strings of length >= 32. Zero tests verify rejection of empty or truncated challenges.",
          severity: "warning",
          category: "test-gap",
          file: "src/utils/validation.ts",
          line: 8,
          lineRange: "7-11",
          codeSnippet: "export function validatePasskeyChallenge(challenge: string): boolean {\n  return typeof challenge === 'string' && challenge.length >= 32;\n}",
          whyItMatters: "Edge cases like undefined, empty string, or non-base64 characters may cause unhandled exceptions at runtime.",
          suggestedRemediation: "Add test cases for empty string, 31-character strings, and null inputs in `tests/auth.test.ts`.",
          isVerifiedFromSource: true,
          status: "open",
          publishedToGitHub: false,
        },
      ],
    },
  };

  // 6. Developer Agents (6 developer agent descriptors & runs)
  const agentWorkflows = [
    {
      id: "wf_pr_review",
      name: "Pull Request Code Quality & Security Audit",
      description: "End-to-end automated PR review verifying security vulnerabilities, performance regressions, and test coverage.",
      agentType: "code_review",
      trigger: "pull_request",
    },
    {
      id: "wf_debug_root_cause",
      name: "Autonomous Crash & Stack Trace Investigation",
      description: "Correlates exception traces with git revisions, extracts AST symbol frames, and formulates ranked hypotheses.",
      agentType: "debugging",
      trigger: "manual",
    },
    {
      id: "wf_refactor_debt",
      name: "Technical Debt & Complexity Reduction",
      description: "Detects high-cyclomatic complexity hotspots and generates validated AST refactoring proposals.",
      agentType: "refactoring",
      trigger: "manual",
    },
  ];

  const agentRuns = [
    {
      id: "run_101",
      agentType: "debugging",
      repositoryId: "sample-project",
      userId: "usr_demo",
      status: "completed",
      objective: "Investigate TypeError: Cannot read properties of undefined (reading 'token') reported in loginUser",
      currentStepIndex: 4,
      totalSteps: 5,
      createdAt: "2026-01-25T10:00:00.000Z",
      updatedAt: "2026-01-25T10:04:30.000Z",
      steps: [
        {
          id: "step-1",
          order: 1,
          title: "Parse stack trace and locate frames",
          description: "Parsed 4 frames from error log. Correlated frames to `src/services/auth.ts:28`.",
          status: "completed",
          startedAt: "2026-01-25T10:00:02.000Z",
          completedAt: "2026-01-25T10:00:15.000Z",
          toolExecutions: [
            {
              toolId: "parse_stack_trace",
              toolName: "Parse Stack Trace",
              status: "completed",
              evidence: "Frame 0 points to loginUser() at line 28 in src/services/auth.ts.",
            },
          ],
        },
        {
          id: "step-2",
          order: 2,
          title: "Retrieve source context around failure site",
          description: "Extracted lines 15-45 in `src/services/auth.ts`. Confirmed `session` is dereferenced without a null check.",
          status: "completed",
          startedAt: "2026-01-25T10:00:16.000Z",
          completedAt: "2026-01-25T10:00:45.000Z",
          toolExecutions: [
            {
              toolId: "retrieve_source_context",
              toolName: "Retrieve Source Context",
              status: "completed",
              evidence: "Found unvalidated access: `session.token` when user is disabled.",
            },
          ],
        },
        {
          id: "step-3",
          order: 3,
          title: "Formulate and rank root-cause hypotheses",
          description: "Identified unhandled inactive user branch as primary root cause with 95% confidence.",
          status: "completed",
          startedAt: "2026-01-25T10:00:46.000Z",
          completedAt: "2026-01-25T10:02:10.000Z",
        },
        {
          id: "step-4",
          order: 4,
          title: "Synthesize targeted reproduction test and fix",
          description: "Generated test asserting explicit AuthError thrown when inactive user attempts authentication.",
          status: "completed",
          startedAt: "2026-01-25T10:02:12.000Z",
          completedAt: "2026-01-25T10:04:30.000Z",
        },
      ],
      citations: [
        {
          file: "src/services/auth.ts",
          startLine: 18,
          endLine: 42,
          symbolName: "loginUser",
          snippet: "const session = issueToken(user);\nreturn session.token;",
        },
      ],
      hypotheses: [
        {
          id: "hyp-main",
          title: "Missing null guard on session token issuance",
          explanation: "Inactive or locked accounts cause `issueToken()` to return null without throwing an explicit error.",
          likelihood: "high",
          confidenceScore: 0.95,
        },
      ],
      findings: [
        {
          id: "find-1",
          title: "Unchecked dereference of session object",
          description: "Line 28 unconditionally accesses `session.token`.",
          severity: "critical",
          file: "src/services/auth.ts",
          line: 28,
          suggestedFix: "if (!session) throw new AuthError('Unable to issue session for inactive user');",
        },
      ],
    },
    {
      id: "run_102",
      agentType: "code_review",
      repositoryId: "sample-project",
      userId: "usr_demo",
      status: "completed",
      objective: "Perform full correctness and security review of Pull Request #101 (WebAuthn)",
      currentStepIndex: 3,
      totalSteps: 3,
      createdAt: "2026-01-26T14:00:00.000Z",
      updatedAt: "2026-01-26T14:03:15.000Z",
      steps: [
        { id: "s-101", order: 1, title: "Review changed diffs", status: "completed" },
        { id: "s-102", order: 2, title: "Execute static security rules", status: "completed" },
        { id: "s-103", order: 3, title: "Publish summary findings", status: "completed" },
      ],
      citations: [],
      findings: [],
    },
  ];

  // 7. Debug Investigations (With BOTH suggestedFixes AND proposedFixes)
  const debugInvestigations = [
    {
      id: "inv_demo_1",
      userId: "usr_demo",
      repositoryId: "sample-project",
      title: "TypeError: Cannot read properties of undefined (reading 'token') at loginUser",
      stackTrace: "TypeError: Cannot read properties of undefined (reading 'token')\n    at loginUser (src/services/auth.ts:28:19)\n    at handleSubmit (src/components/LoginForm.tsx:28:25)",
      parsedFrames: [
        {
          id: "frame-1",
          order: 1,
          raw: "at loginUser (src/services/auth.ts:28:19)",
          functionName: "loginUser",
          filePath: "src/services/auth.ts",
          line: 28,
          column: 19,
          isExternal: false,
          isVerified: true,
          symbolName: "loginUser",
          sourceSnippet: {
            startLine: 24,
            endLine: 32,
            focusLine: 28,
            lines: [
              { lineNumber: 25, content: "  const user = await UserService.findUserByEmail(email);", isHighlighted: false },
              { lineNumber: 26, content: "  if (!user) throw new AuthError('User not found');", isHighlighted: false },
              { lineNumber: 27, content: "  const session = await issueSessionToken(user);", isHighlighted: false },
              { lineNumber: 28, content: "  return session.token;", isHighlighted: true },
              { lineNumber: 29, content: "}", isHighlighted: false },
            ],
          },
        },
        {
          id: "frame-2",
          order: 2,
          raw: "at handleSubmit (src/components/LoginForm.tsx:28:25)",
          functionName: "handleSubmit",
          filePath: "src/components/LoginForm.tsx",
          line: 28,
          column: 25,
          isExternal: false,
          isVerified: true,
          symbolName: "handleSubmit",
          sourceSnippet: {
            startLine: 24,
            endLine: 32,
            focusLine: 28,
            lines: [
              { lineNumber: 26, content: "  const handleSubmit = async (e: React.FormEvent) => {", isHighlighted: false },
              { lineNumber: 27, content: "    e.preventDefault();", isHighlighted: false },
              { lineNumber: 28, content: "    const res = await loginUser(email, password);", isHighlighted: true },
              { lineNumber: 29, content: "  };", isHighlighted: false },
            ],
          },
        },
      ],
      hypotheses: [
        {
          id: "hypo-1",
          rank: 1,
          title: "issueSessionToken returns null for unverified or inactive users",
          category: "null_undefined_access",
          categoryLabel: "Null / Undefined Property Access",
          explanation: "In `src/services/auth.ts:28`, `session` is assumed to be an object. If the user account is flagged as unverified, `issueSessionToken()` returns null, causing property access `session.token` to crash.",
          likelihood: "high",
          supportingEvidence: [
            "Source line 27: `const session = await issueSessionToken(user)`",
            "UserService defines inactive account status returning null token bundle",
          ],
          counterEvidence: [],
          recommendedAction: "Add an explicit null guard and throw `AccountSuspendedError` or `UnverifiedEmailError`.",
        },
        {
          id: "hypo-2",
          rank: 2,
          title: "Session issuer threw an uncaught internal rejection",
          category: "exception_propagation",
          categoryLabel: "Exception Handling Gap",
          explanation: "JWT secret environment variable was missing or malformed during execution.",
          likelihood: "low",
          supportingEvidence: [],
          counterEvidence: ["Crash is a TypeError on line 28, not a JWT configuration error"],
          recommendedAction: "Verify environment configurations at application startup.",
        },
      ],
      suggestedFixes: [
        {
          id: "fix-1",
          hypothesisId: "hypo-1",
          title: "Add null guard for session token and throw descriptive AuthError",
          description: "Prevents undefined property dereference and returns an actionable error message to the client form.",
          filePath: "src/services/auth.ts",
          startLine: 27,
          endLine: 29,
          diff: `@@ -27,3 +27,6 @@\n   const session = await issueSessionToken(user);\n+  if (!session || !session.token) {\n+    throw new AuthError('Failed to issue session token. Account may be inactive.');\n+  }\n   return session.token;`,
          explanation: "Guards against undefined `session` and surfaces clean business exception to UI.",
          riskLevel: "low",
          isApplied: false,
        },
      ],
      proposedFixes: [
        {
          id: "fix-1",
          hypothesisId: "hypo-1",
          title: "Add null guard for session token and throw descriptive AuthError",
          description: "Prevents undefined property dereference and returns an actionable error message to the client form.",
          filePath: "src/services/auth.ts",
          startLine: 27,
          endLine: 29,
          diff: `@@ -27,3 +27,6 @@\n   const session = await issueSessionToken(user);\n+  if (!session || !session.token) {\n+    throw new AuthError('Failed to issue session token. Account may be inactive.');\n+  }\n   return session.token;`,
          explanation: "Guards against undefined `session` and surfaces clean business exception to UI.",
          riskLevel: "low",
          isApplied: false,
        },
      ],
      testRecommendations: [
        {
          id: "test-rec-1",
          title: "Verify AuthError is thrown when issueSessionToken returns null",
          filePath: "tests/auth.test.ts",
          code: `test('should throw AuthError when user session issuance fails', async () => {\n  jest.spyOn(UserService, 'findUserByEmail').mockResolvedValue({ id: '1', isActive: false });\n  await expect(loginUser('inactive@example.com', 'pass')).rejects.toThrow('Account may be inactive');\n});`,
          explanation: "Automated regression test verifying that inactive user accounts produce clean errors.",
          targetSymbol: "loginUser",
        },
      ],
      createdAt: "2026-01-25T10:00:00.000Z",
      status: "analyzed",
    },
  ];

  // 8. Refactoring & Technical Debt Overview
  const initialDebtOverview = {
    repositoryId: "sample-project",
    overallScore: 84,
    grade: "B+",
    totalDebtHours: 18.5,
    debtRatioPercent: 14.2,
    scannedFilesCount: 5,
    scannedSymbolsCount: 24,
    criticalFindingsCount: 1,
    warningFindingsCount: 3,
    infoFindingsCount: 2,
    findings: [
      {
        id: "find-debt-1",
        title: "Cyclomatic complexity of 12 in loginUser() exceeds team threshold (10)",
        category: "excessive_complexity",
        categoryLabel: "Excessive Complexity",
        severity: "warning",
        filePath: "src/services/auth.ts",
        symbolName: "loginUser",
        lineRange: { start: 18, end: 42 },
        detectionMethod: "ast_metric",
        isVerifiedMetric: true,
        metricValue: 12,
        threshold: 10,
        supportingEvidence: ["4 nested if/else control flow branches", "inline regex evaluation"],
        impactRationale: "Increases risk of regression when changing auth rules and slows onboarding.",
        suggestedAction: "Extract input assertion and credential checks into assertValidCredentials.",
        suggestedRefactoringOp: "extract_function",
      },
    ],
    categories: [
      { category: "excessive_complexity", label: "Cyclomatic Complexity", count: 2, severity: "warning" },
      { category: "missing_error_handling", label: "Missing Error Guards", count: 1, severity: "critical" },
      { category: "code_duplication", label: "Duplicated Validation Logic", count: 2, severity: "warning" },
      { category: "unused_symbol", label: "Unused Symbols", count: 1, severity: "info" },
    ],
    hotspots: [
      {
        filePath: "src/services/auth.ts",
        symbolName: "loginUser",
        lineRange: { start: 18, end: 42 },
        complexityScore: 12,
        lineCount: 25,
        nestingDepth: 4,
        rationale: "Nested conditionals for password hash, inactive status, and session token dispatch.",
      },
    ],
    couplingMetrics: [],
    circularDependencies: [],
    duplicateCandidates: [],
    isStale: false,
    analyzedAt: timestamp,
  };

  const refactoringProposals = [
    {
      id: "prop_demo_1",
      repositoryId: "sample-project",
      userId: "usr_demo",
      title: "Extract email & password verification guards into standalone validator",
      operationType: "extract_function",
      operation: "extract_function",
      filePath: "src/services/auth.ts",
      targetFile: "src/services/auth.ts",
      symbolName: "loginUser",
      targetSymbol: "loginUser",
      lineRange: { start: 18, end: 32 },
      rationale: "Reduces cyclomatic complexity of `loginUser` by 40% and allows unit testing of credentials validation in isolation.",
      diff: `@@ -18,12 +18,17 @@ export async function loginUser(email, pass) {\n+function assertValidCredentials(email: string, pass: string): void {\n+  if (!validateEmail(email)) throw new AuthError('Invalid email format');\n+  if (!pass || pass.length < 8) throw new AuthError('Password too short');\n+}\n+\n export async function loginUser(email, pass) {\n-  if (!validateEmail(email)) throw new AuthError('Invalid email format');\n-  if (!pass || pass.length < 8) throw new AuthError('Password too short');\n+  assertValidCredentials(email, pass);\n   const user = await UserService.findUserByEmail(email);`,
      status: "open",
      impactAnalysis: {
        riskLevel: "Low",
        riskScore: 22,
        affectedTests: ["tests/auth.test.ts"],
        blastRadiusFiles: ["src/services/auth.ts"],
      },
      createdAt: "2026-01-26T11:00:00.000Z",
    },
  ];

  // 9. System Health & Operations Metrics
  const systemHealth = {
    status: "healthy",
    environment: "demo-static",
    service: "codeatlas-web",
    uptimeSeconds: 86400,
    timestamp,
    system: {
      nodeVersion: "v20.18.0",
      platform: "web-client",
      memoryUsageMb: 142,
    },
  };

  const alertRules = [
    {
      id: "rule_high_error_rate",
      name: "High API Error Rate",
      metricName: "http_5xx_rate",
      condition: "gt",
      threshold: 5,
      severity: "critical",
      status: "resolved",
      description: "Fires when HTTP 5xx responses exceed 5% over a 5-minute sliding window.",
    },
    {
      id: "rule_p95_latency",
      name: "P95 Latency Spike",
      metricName: "p95_latency_ms",
      condition: "gt",
      threshold: 1200,
      severity: "warning",
      status: "resolved",
      description: "Fires when 95th percentile response latency exceeds 1.2 seconds.",
    },
  ];

  const circuitBreakers = {
    ai_provider: { name: "ai_provider", state: "CLOSED", failures: 0, lastFailure: null },
    github_api: { name: "github_api", state: "CLOSED", failures: 0, lastFailure: null },
    db_pool: { name: "db_pool", state: "CLOSED", failures: 0, lastFailure: null },
  };

  // 10. Activities & Notifications
  const notifications = [
    {
      id: "notif_1",
      userId: "usr_demo",
      title: "Repository Indexing Completed",
      description: "demo-auth-service AST symbols and call graphs are fully indexed.",
      timestamp: "5 mins ago",
      read: false,
      type: "indexing",
      href: "/repositories/sample-project",
    },
    {
      id: "notif_2",
      userId: "usr_demo",
      title: "New Automated Review Ready",
      description: "Pull Request #101 analyzed with 1 critical finding.",
      timestamp: "1 hour ago",
      read: false,
      type: "review",
      href: "/code-review",
    },
  ];

  const activities = [
    {
      id: "act_1",
      userId: "usr_demo",
      type: "review_completed",
      title: "Completed Code Review on PR #101",
      description: "AI review flagged WebAuthn challenge replay vulnerability.",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: "warning",
      href: "/code-review",
      linkText: "View Review",
    },
    {
      id: "act_2",
      userId: "usr_demo",
      type: "indexing_completed",
      title: "Indexed repository demo-auth-service",
      description: "Resolved 24 AST symbols and 15 cross-file relationships.",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: "success",
      href: "/repositories/sample-project",
      linkText: "Explore Symbols",
    },
  ];

  return {
    version: STORE_VERSION,
    workspaces,
    workspaceMembers,
    workspaceRepositories,
    workspaceAnnotations: {},
    workspaceArtifacts: {},
    workspaceActivities: {},
    discussions: {},
    decisions: {},
    invitations: [],
    repositories,
    repositoryTrees,
    repositoryFiles,
    repositoryDependencies: {},
    repositorySymbols: {},
    pullRequests,
    reviewSessions,
    agentRuns,
    agentWorkflows,
    debugInvestigations,
    debugFollowUps: {},
    refactoringProposals,
    debtOverviews: { "sample-project": initialDebtOverview },
    notifications,
    activities,
    userSettings: {
      userId: "usr_demo",
      explanationStyle: "detailed",
      responseDetail: "standard",
      defaultRepoContext: "sample-project",
      preferredModel: "gemini-1.5-pro",
      useStreaming: true,
      showLineNumbers: true,
      reducedMotion: false,
      updatedAt: timestamp,
    },
    circuitBreakers,
    alertRules,
    systemHealth,
    logs: [
      {
        id: "log_1",
        timestamp,
        level: "info",
        service: "codeatlas-core",
        environment: "production",
        correlationId: "req_demo_init",
        operation: "auth.session",
        outcome: "success",
        userId: "usr_demo",
        metadata: { client: "web-spa", mode: "demo" },
      },
    ],
    traces: [
      {
        traceId: "trace-demo-1",
        rootSpanName: "GET /api/repositories/sample-project",
        startTime: new Date(Date.now() - 300000).toISOString(),
        durationMs: 42,
        status: "ok",
        spansCount: 4,
        services: ["web-gateway", "ast-resolver", "cache-service"],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Store Persistence & PubSub Manager
// ---------------------------------------------------------------------------

let activeStore: DemoStoreData | null = null;
let activeUserId: string = "demo";
const listeners = new Set<() => void>();

function getStorageKey(userId: string = "demo"): string {
  const cleanId = (userId || "demo").replace(/[^a-zA-Z0-9_-]/g, "_");
  return `codeatlas_store_${cleanId}`;
}

export function getStore(userId: string = "demo"): DemoStoreData {
  if (activeStore && activeUserId === userId) {
    return activeStore;
  }

  activeUserId = userId;

  if (typeof window !== "undefined") {
    try {
      const key = getStorageKey(userId);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === STORE_VERSION) {
          activeStore = parsed;
          return activeStore!;
        }
      }
    } catch (e) {
      console.warn("Could not read demo store from localStorage:", e);
    }
  }

  activeStore = createInitialData();
  saveStore(activeStore, userId);
  return activeStore;
}

export function saveStore(store: DemoStoreData, userId: string = activeUserId): void {
  activeStore = store;
  if (typeof window !== "undefined") {
    try {
      const key = getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(store));
    } catch (e) {
      console.warn("Could not write demo store to localStorage:", e);
    }
  }
  emitChange();
}

export function resetStore(userId: string = activeUserId): DemoStoreData {
  const fresh = createInitialData();
  activeStore = fresh;
  if (typeof window !== "undefined") {
    try {
      const key = getStorageKey(userId);
      localStorage.removeItem(key);
      localStorage.setItem(key, JSON.stringify(fresh));
    } catch {}
  }
  emitChange();
  return fresh;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitChange(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error("Error in store subscriber listener:", err);
    }
  });
}

// ---------------------------------------------------------------------------
// Typed Mutation Helpers (Auto-log activities & emit reactive changes)
// ---------------------------------------------------------------------------

export function logActivity(activity: {
  type: string;
  title: string;
  description: string;
  status?: "success" | "warning" | "error" | "info";
  href?: string;
  linkText?: string;
  userId?: string;
}) {
  const store = getStore();
  const newActivity = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: activity.userId || "usr_demo",
    type: activity.type,
    title: activity.title,
    description: activity.description,
    timestamp: new Date().toISOString(),
    status: activity.status || "success",
    href: activity.href,
    linkText: activity.linkText,
  };
  store.activities = [newActivity, ...(store.activities || [])];
  saveStore(store);
}

export function addNotification(notif: {
  title: string;
  description: string;
  type?: string;
  href?: string;
  userId?: string;
}) {
  const store = getStore();
  const newNotif = {
    id: `notif_${Date.now()}`,
    userId: notif.userId || "usr_demo",
    title: notif.title,
    description: notif.description,
    timestamp: "Just now",
    read: false,
    type: notif.type || "system",
    href: notif.href,
  };
  store.notifications = [newNotif, ...(store.notifications || [])];
  saveStore(store);
}

export function createWorkspace(data: { name: string; description?: string }): any {
  const store = getStore();
  const id = `ws_${Date.now()}`;
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const newWs = {
    id,
    name: data.name,
    slug,
    description: data.description || "",
    ownerId: "usr_demo",
    isPersonal: false,
    userRole: "owner",
    memberCount: 1,
    repoCount: 0,
    settings: {
      allowMemberInvites: true,
      requireReviewDismissalReason: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.workspaces.push(newWs);
  store.workspaceMembers[id] = [
    {
      id: `mem_${Date.now()}`,
      workspaceId: id,
      userId: "usr_demo",
      role: "owner",
      joinedAt: new Date().toISOString(),
      userName: "Demo User",
      userEmail: "demo@codeatlas.dev",
      userAvatar: DEMO_USER.avatar,
    },
  ];

  logActivity({
    type: "workspace_created",
    title: `Created workspace "${data.name}"`,
    description: "New team intelligence workspace configured.",
    href: `/workspaces/${id}`,
    linkText: "Open Workspace",
  });

  saveStore(store);
  return newWs;
}

export function addRepository(repo: any): any {
  const store = getStore();
  const newRepo = {
    ...repo,
    id: repo.id || repo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    status: "ready",
    progress: 100,
    isIndexed: true,
    lastAnalyzed: "Just now",
    symbolCount: repo.symbolCount || 12,
  };

  store.repositories.push(newRepo);
  logActivity({
    type: "repository_connected",
    title: `Connected repository "${newRepo.name}"`,
    description: `Repository added and scheduled for AST symbol indexing.`,
    href: `/repositories/${newRepo.id}`,
    linkText: "View Repository",
  });

  saveStore(store);
  return newRepo;
}

