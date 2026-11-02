/**
 * CodeAtlas Central Demo Store
 *
 * Provides a rich, reactive, offline-capable in-memory & localStorage data store
 * for the static GitHub Pages export of CodeAtlas.
 */

import { SAMPLE_REPOSITORIES_DATA } from "@/lib/constants";
import { SAMPLE_PROJECT_TREE, SAMPLE_PROJECT_CODE } from "@/lib/sample-repository-files";
import { STANDARD_WORKFLOWS, STEP_DEFINITIONS, synthesizeDiff } from "@/lib/demo/agent-engine";
import { AgentRun, AgentPolicy, WorkflowTemplate } from "@/types/agent";
import { SavedImpactAnalysis } from "@/types/impact";
import {
  ActivityEvent,
  ActivityModule,
  ActivityAction,
  ActivityStatus,
  ActivityActor,
  ActivityTarget,
  ActivityFilterState,
} from "@/types/activity";

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

export function getActiveUser(): ActivityActor {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("codeatlas-auth-user") || localStorage.getItem("codeatlas-auth-session");
      if (raw) {
        const parsed = JSON.parse(raw);
        const u = parsed.user || parsed;
        if (u && (u.name || u.email || u.displayName)) {
          return {
            id: u.id || u.uid || "usr_demo",
            name: u.displayName || u.name || "Demo User",
            avatar: u.photoURL || u.avatar || DEMO_USER.avatar,
            email: u.email || DEMO_USER.email,
            role: u.role || "Lead Systems Architect",
          };
        }
      }
    } catch {}
  }
  return {
    id: DEMO_USER.id,
    name: DEMO_USER.name,
    avatar: DEMO_USER.avatar,
    email: DEMO_USER.email,
    role: DEMO_USER.role,
  };
}

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
  agentPolicies?: Record<string, any>;
  debugInvestigations: any[];
  debugFollowUps: Record<string, any[]>;
  refactoringProposals: any[];
  refactoringHistory?: any[];
  debtOverviews: Record<string, any>;
  notifications: any[];
  activities: ActivityEvent[];
  userSettings: any;
  circuitBreakers: Record<string, any>;
  alertRules: any[];
  systemHealth: any;
  logs: any[];
  traces: any[];
  multiRepoAnalysis?: any;
  activeWorkspaceId?: string;
  explorerHistory?: CodeAnalysisHistoryItem[];
  architectureNodePositions?: Record<string, Record<string, { x: number; y: number }>>;
  architectureLayerOverrides?: Record<string, Record<string, string>>;
  architectureLayerRules?: Record<string, any[]>;
  architectureAiOverviews?: Record<string, { summary: string; mermaid: string; timestamp: string }>;
  impactAnalyses?: SavedImpactAnalysis[];
}

export interface CodeAnalysisHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  inputPreview: string;
  code: string;
  language: string;
  mode: string;
  targetLanguage?: string;
  resultMarkdown: string;
  mermaidChart?: string | null;
  repositoryId?: string;
}

const STORE_VERSION = 7;

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
      { id: "wsr_4", workspaceId: "ws_team_demo", repositoryId: "ecommerce-platform", addedBy: "usr_demo", addedAt: "2026-01-03T00:00:00.000Z" },
      { id: "wsr_5", workspaceId: "ws_team_demo", repositoryId: "auth-service", addedBy: "usr_demo", addedAt: "2026-01-03T00:00:00.000Z" },
      { id: "wsr_6", workspaceId: "ws_team_demo", repositoryId: "fastapi-backend", addedBy: "usr_demo", addedAt: "2026-01-04T00:00:00.000Z" },
      { id: "wsr_7", workspaceId: "ws_team_demo", repositoryId: "my-project", addedBy: "usr_demo", addedAt: "2026-01-04T00:00:00.000Z" },
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
          { id: "file-shared-validation", name: "validation.ts", type: "file", path: "src/validation.ts", language: "typescript", size: "1.2 KB" },
          { id: "file-shared-valid", name: "validators.ts", type: "file", path: "src/validators.ts", language: "typescript", size: "1.1 KB" },
          { id: "file-shared-client", name: "http-client.ts", type: "file", path: "src/http-client.ts", language: "typescript", size: "1.6 KB" },
          { id: "file-shared-index", name: "index.ts", type: "file", path: "src/index.ts", language: "typescript", size: "420 B" },
        ],
      },
      {
        id: "folder-shared-tests",
        name: "tests",
        type: "folder",
        path: "tests",
        children: [
          { id: "file-shared-test-val", name: "validation.test.ts", type: "file", path: "tests/validation.test.ts", language: "typescript", size: "850 B" },
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
    "sample-project": {
      ...SAMPLE_PROJECT_CODE,
      "package.json": {
        language: "json",
        code: JSON.stringify(
          {
            name: "demo-auth-service",
            version: "1.0.0",
            private: true,
            dependencies: {
              react: "18.2.0",
              "react-dom": "18.2.0",
              axios: "^1.6.2",
              "@acme/shared-utils": "^1.2.0",
            },
          },
          null,
          2
        ),
      },
    },
    "my-project": {
      "requirements.txt": {
        language: "text",
        code: "fastapi==0.110.0\npydantic==2.6.4\nuvicorn==0.28.0\n",
      },
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
      "package.json": {
        language: "json",
        code: JSON.stringify(
          {
            name: "@acme/shared-utils",
            version: "1.4.0",
            private: false,
            dependencies: {
              axios: "^1.7.2",
              lodash: "^4.17.21",
            },
          },
          null,
          2
        ),
      },
      "src/validators.ts": {
        language: "typescript",
        code: `export function validateEmail(val: string): boolean {\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(val.trim());\n}\n\nexport function validateUuid(id: string): boolean {\n  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);\n}\n`,
      },
      "src/http-client.ts": {
        language: "typescript",
        code: `export class HttpClient {\n  constructor(private baseUrl: string) {}\n  async get<T>(path: string): Promise<T> {\n    const res = await fetch(\`\${this.baseUrl}\${path}\`);\n    return res.json();\n  }\n  async post<T>(path: string, body: any): Promise<T> {\n    const res = await fetch(\`\${this.baseUrl}\${path}\`, {\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n      body: JSON.stringify(body),\n    });\n    return res.json();\n  }\n}\n`,
      },
      "src/validation.ts": {
        language: "typescript",
        code: `export function validateEmail(email: string): boolean {\n  if (!email || typeof email !== "string") return false;\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim());\n}\n\nexport function validatePassword(password: string): boolean {\n  return typeof password === "string" && password.length >= 8;\n}\n\nexport function sanitizeInput(input: string): string {\n  return input.replace(/[<>]/g, "").trim();\n}\n`,
      },
      "tests/validation.test.ts": {
        language: "typescript",
        code: `import { validateEmail, validatePassword } from "../src/validation";\n\ndescribe("validateEmail Suite", () => {\n  it("validates enterprise email formats correctly", () => {\n    expect(validateEmail("developer@acme.corp")).toBe(true);\n    expect(validateEmail("invalid-email")).toBe(false);\n  });\n});\n`,
      },
      "src/index.ts": {
        language: "typescript",
        code: `export * from "./validators";\nexport * from "./http-client";\n`,
      },
    },
    "payment-service": {
      "src/checkout-route.ts": {
        language: "typescript",
        code: `import { validateEmail } from "@acme/shared-utils";\n\nexport async function handleCheckoutRoute(req: any) {\n  const { customerEmail, amountCents } = req.body || {};\n  if (!validateEmail(customerEmail)) {\n    return { status: 400, error: "Invalid customer email provided" };\n  }\n  return { status: 200, success: true, reference: "pay_tx_7719" };\n}\n`,
      },
      "PaymentProcessor.java": {
        language: "java",
        code: `package com.acme.payment;

public class PaymentProcessor {
    private final PaymentGateway gateway;

    public PaymentProcessor(PaymentGateway gateway) {
        this.gateway = gateway;
    }

    public PaymentResult process(Order order) {
        if (order == null) {
            throw new IllegalArgumentException("Order cannot be null");
        }

        // Validate order items
        order.validate();

        String transactionId = order.getTransaction().getId();
        return this.gateway.capture(transactionId, order.getAmount());
    }
}
`,
      },
      "src/PaymentProcessor.java": {
        language: "java",
        code: `package com.acme.payment;

public class PaymentProcessor {
    private final PaymentGateway gateway;

    public PaymentProcessor(PaymentGateway gateway) {
        this.gateway = gateway;
    }

    public PaymentResult process(Order order) {
        if (order == null) {
            throw new IllegalArgumentException("Order cannot be null");
        }

        // Validate order items
        order.validate();

        String transactionId = order.getTransaction().getId();
        return this.gateway.capture(transactionId, order.getAmount());
    }
}
`,
      },
      "package.json": {
        language: "json",
        code: JSON.stringify(
          {
            name: "payment-service",
            version: "1.2.0",
            dependencies: {
              react: "18.3.1",
              axios: "^1.7.2",
              "@acme/shared-utils": "^1.4.0",
            },
          },
          null,
          2
        ),
      },
      "src/checkout.ts": {
        language: "typescript",
        code: `import { validateEmail } from "@acme/shared-utils";\n\nexport async function processCheckout(orderId: string, email: string, amount: number) {\n  if (!validateEmail(email)) throw new Error("Invalid customer email");\n  // Verify user authorization token with auth microservice\n  const tokenRes = await fetch("https://auth.internal/token", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({ orderId, email }),\n  });\n  // Check order validity with order validator\n  await fetch("https://api.internal/api/v1/orders/validate", {\n    method: "POST",\n    body: JSON.stringify({ orderId }),\n  });\n  return { orderId, status: "processed", amount };\n}\n`,
      },
      "src/payment-api.ts": {
        language: "typescript",
        code: `export async function handlePaymentRoute(req: any, res: any) {\n  const { orderId, email, amount } = req.body;\n  return res.json({ success: true, timestamp: Date.now() });\n}\n`,
      },
      "src/validators.ts": {
        language: "typescript",
        code: `/**\n * RFC 5322 compliant regex check for email formatting.\n */\nexport function validateEmail(email: string): boolean {\n  if (!email || typeof email !== "string") return false;\n  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n  return emailRegex.test(email.trim());\n}\n`,
      },
    },
    "ecommerce-platform": {
      "package.json": {
        language: "json",
        code: JSON.stringify(
          {
            name: "ecommerce-platform",
            version: "2.4.0",
            dependencies: {
              react: "18.3.1",
              axios: "^1.7.2",
              "@acme/shared-utils": "^1.4.0",
            },
          },
          null,
          2
        ),
      },
      "src/api.ts": {
        language: "typescript",
        code: `import axios from "axios";\n\nexport async function fetchAuthToken(credentials: any) {\n  const res = await fetch("https://auth.internal/token", {\n    method: "POST",\n    body: JSON.stringify(credentials),\n  });\n  return res.json();\n}\n\nexport async function createSession(sessionPayload: any) {\n  const res = await axios.post("https://api.internal/api/v1/auth/session", sessionPayload);\n  return res.data;\n}\n`,
      },
      "src/cart.ts": {
        language: "typescript",
        code: `import { validateEmail } from "@acme/shared-utils";\n\nexport function validateCartCheckout(email: string, items: any[]) {\n  if (!validateEmail(email)) throw new Error("Invalid checkout email");\n  return { valid: true, count: items.length };\n}\n`,
      },
    },
    "auth-service": {
      "go.mod": {
        language: "text",
        code: `module github.com/koush-dev/auth-service\n\ngo 1.22\n\nrequire (\n\tgithub.com/golang-jwt/jwt/v5 v5.2.0\n\tgithub.com/gorilla/mux v1.8.1\n)\n`,
      },
      "main.go": {
        language: "go",
        code: `package main

import (
\t"net/http"
\t"github.com/gorilla/mux"
)

type Session struct {
\tClaims map[string]interface{}
\tUser   *User
}

type User struct {
\tRole string
}

func handleTokenAuth(w http.ResponseWriter, r *http.Request) {
\tw.Write([]byte(\`{"token":"jwt_token_sample"}\`))
}

func authHandler(session *Session, w http.ResponseWriter) {
\ttoken := session.Claims["token"].(string)
\tw.Write([]byte(token))
}

func main() {
\tr := mux.NewRouter()
\tr.HandleFunc("/token", handleTokenAuth).Methods("POST")
\thttp.ListenAndServe(":8080", r)
}
`,
      },
    },
    "fastapi-backend": {
      "routers/analytics.py": {
        language: "python",
        code: `from typing import Dict, Any

def calculate_metric(raw_data: Dict[str, Any], offset: float = 0.0) -> float:
    """
    Calculates aggregate performance metric from sensor telemetry dict.
    Throws KeyError if 'value' is missing.
    """
    if not raw_data:
        return 0.0
    # Direct lookup on raw_data
    # Assumes key exists unconditionally
    total = raw_data['value'] + offset
    return round(total, 4)
`,
      },
      "app/routers/analytics.py": {
        language: "python",
        code: `from typing import Dict, Any

def calculate_metric(raw_data: Dict[str, Any], offset: float = 0.0) -> float:
    """
    Calculates aggregate performance metric from sensor telemetry dict.
    Throws KeyError if 'value' is missing.
    """
    if not raw_data:
        return 0.0
    # Direct lookup on raw_data
    # Assumes key exists unconditionally
    total = raw_data['value'] + offset
    return round(total, 4)
`,
      },
      "requirements.txt": {
        language: "text",
        code: "fastapi==0.111.0\npydantic==2.7.4\nuvicorn==0.30.1\nrequests==2.32.3\n",
      },
      "app/main.py": {
        language: "python",
        code: `from fastapi import FastAPI\n\napp = FastAPI(title="FastAPI Analytics Backend")\n\n@app.get("/health")\ndef health():\n    return {"status": "healthy"}\n\n@app.get("/api/v1/reports")\ndef get_reports():\n    return [{"id": 1, "title": "Quarterly Performance"}]\n`,
      },
    },
  };

  // 4. Pull Requests
  const pullRequests = [
    {
      id: "pr_101",
      number: 101,
      repositoryId: "sample-project",
      source: "Demo",
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
      reviewStatus: "pending",
      riskLevel: "High",
      riskScore: 78,
      labels: ["security", "auth", "fido2"],
      createdAt: "2026-01-20T10:15:00.000Z",
      updatedAt: "2026-01-21T14:22:00.000Z",
      additions: 142,
      deletions: 18,
      changedFilesCount: 3,
      checklist: [
        { id: "chk_tests", label: "Tests added and passing", checked: true },
        { id: "chk_docs", label: "Documentation updated", checked: false },
        { id: "chk_secrets", label: "No secrets or API keys exposed", checked: true },
        { id: "chk_impact", label: "Impact analysis checked", checked: false },
      ],
      timeline: [
        {
          id: "tl_1",
          type: "opened",
          title: "Elena Rostova opened pull request #101",
          actor: {
            name: "Elena Rostova",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
          },
          timestamp: "2026-01-20T10:15:00.000Z",
          description: "Branch feat/webauthn-passkeys into main.",
        },
        {
          id: "tl_2",
          type: "reviewed",
          title: "CodeAtlas AI Review completed",
          actor: {
            name: "CodeAtlas AI",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
          },
          timestamp: "2026-01-20T10:16:30.000Z",
          description: "Flagged 1 critical security finding (WebAuthn challenge replay).",
        },
      ],
      inlineComments: [
        {
          id: "inline_1",
          file: "src/services/auth.ts",
          line: 24,
          author: {
            name: "Marcus Chen",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
          },
          text: "Are we guaranteeing challenge expiration in Redis before verification?",
          timestamp: "2026-01-20T11:00:00.000Z",
          resolved: false,
          replies: [
            {
              id: "reply_1",
              author: {
                name: "Elena Rostova",
                avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
              },
              text: "Good catch, I will add an atomic consume check in the Redis nonce cache.",
              timestamp: "2026-01-20T11:20:00.000Z",
            },
          ],
        },
      ],
      discussions: {
        "finding-sec-1": {
          id: "disc_sec_1",
          findingId: "finding-sec-1",
          resolved: false,
          comments: [
            {
              id: "disc_c1",
              author: {
                name: "Alex Chen",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
              },
              text: "We should definitely consume the challenge nonce before calling verifyWebAuthnAssertion.",
              timestamp: "2026-01-20T12:00:00.000Z",
              reactions: { "👍": 3 },
            },
          ],
        },
      },
      viewedFiles: {
        "src/services/auth.ts": true,
      },
      aiSummary: {
        what: "Introduces WebAuthn passkey assertion support to user sign-in flows and cryptographic challenge validation.",
        why: "Supports modern FIDO2 passwordless authentication standards and decreases credential theft risk.",
        risk: "High architectural impact on authentication contracts. 1 critical vulnerability detected: assertion challenge replay without Redis nonce consumption.",
        recommendedAction: "Block merge until WebAuthn nonce consumption is implemented and negative challenge unit tests are added.",
      },
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
      repositoryId: "sample-project",
      source: "Demo",
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
      reviewStatus: "approved",
      riskLevel: "Medium",
      riskScore: 42,
      labels: ["cache", "bugfix"],
      createdAt: "2026-01-22T08:30:00.000Z",
      updatedAt: "2026-01-22T09:45:00.000Z",
      additions: 45,
      deletions: 9,
      changedFilesCount: 2,
      files: [
        {
          filename: "src/services/auth.ts",
          status: "modified",
          additions: 35,
          deletions: 7,
          changes: 42,
          patch: "@@ -80,5 +80,12 @@ export async function rotateRefreshToken(oldToken: string) {\n+  const lock = await acquireDistributedLock(`lock:${oldToken}`);\n+  try {\n+    return await executeTokenRotation(oldToken);\n+  } finally {\n+    await lock.release();\n+  }",
        },
        {
          filename: "tests/cache.test.ts",
          status: "modified",
          additions: 10,
          deletions: 2,
          changes: 12,
          patch: "@@ -1,4 +1,8 @@\n+test('concurrentTokenRotationAcquiresLock', async () => {\n+  expect(true).toBe(true);\n+});",
        },
      ],
    },
    {
      id: "pr_agent_1",
      number: 103,
      repositoryId: "sample-project",
      source: "Agent",
      title: "[Agent] Automated Security & Dependency Hardening",
      body: "Automated patch generated by CodeAtlas AI Agent applying security best practices to authentication middleware.",
      author: {
        name: "CodeAtlas Agent",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      },
      baseBranch: "main",
      headBranch: "agent/security-hardening",
      baseSha: "30e6d94e",
      headSha: "c8e1d4b9",
      state: "open",
      reviewStatus: "pending",
      riskLevel: "Low",
      riskScore: 18,
      labels: ["agent", "automated", "security"],
      createdAt: "2026-01-23T11:00:00.000Z",
      updatedAt: "2026-01-23T11:05:00.000Z",
      additions: 16,
      deletions: 4,
      changedFilesCount: 1,
      files: [
        {
          filename: "src/services/auth.ts",
          status: "modified",
          additions: 16,
          deletions: 4,
          changes: 20,
          patch: "@@ -1,4 +1,8 @@\n+// Hardened by CodeAtlas Agent\n+export const AUTH_HEADER_MAX_LENGTH = 4096;\n+if (header.length > AUTH_HEADER_MAX_LENGTH) throw new Error('Header too large');",
        },
      ],
    },
    {
      id: "pr_debug_1",
      number: 104,
      repositoryId: "sample-project",
      source: "Debugger",
      title: "fix(debug): Handle NullReference in TokenDecoder",
      body: "Automated bug fix generated by CodeAtlas AI Debugger resolving runtime NullReferenceException in TokenDecoder.",
      author: {
        name: "AI Debugger",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      },
      baseBranch: "main",
      headBranch: "fix/debug-token-decoder",
      baseSha: "30e6d94e",
      headSha: "d9e2a3f4",
      state: "open",
      reviewStatus: "pending",
      riskLevel: "Low",
      riskScore: 22,
      labels: ["debugger", "bugfix"],
      createdAt: "2026-01-23T14:10:00.000Z",
      updatedAt: "2026-01-23T14:15:00.000Z",
      additions: 8,
      deletions: 2,
      changedFilesCount: 1,
      files: [
        {
          filename: "src/services/auth.ts",
          status: "modified",
          additions: 8,
          deletions: 2,
          changes: 10,
          patch: "@@ -55,3 +55,7 @@\n-  const raw = token.split('.')[1];\n+  if (!token || typeof token !== 'string') return null;\n+  const parts = token.split('.');\n+  if (parts.length < 2) return null;\n+  const raw = parts[1];",
        },
      ],
    },
    {
      id: "pr_refactor_1",
      number: 105,
      repositoryId: "sample-project",
      source: "Refactoring",
      title: "[Refactor] Extract duplicate validateEmail to shared-core-lib",
      body: "Safe refactoring proposal consolidating duplicate email validation logic across sample-project and payment-service into @acme/shared-utils.",
      author: {
        name: "Alex Chen",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      },
      baseBranch: "main",
      headBranch: "refactor/extract-validate-email",
      baseSha: "30e6d94e",
      headSha: "e1f2a3b4",
      state: "open",
      reviewStatus: "pending",
      riskLevel: "Medium",
      riskScore: 48,
      labels: ["refactor", "debt-reduction"],
      createdAt: "2026-01-23T16:00:00.000Z",
      updatedAt: "2026-01-23T16:05:00.000Z",
      additions: 12,
      deletions: 28,
      changedFilesCount: 2,
      files: [
        {
          filename: "src/utils/validation.ts",
          status: "modified",
          additions: 2,
          deletions: 18,
          changes: 20,
          patch: "@@ -1,18 +1,2 @@\n-export function validateEmail(email: string): boolean {\n-  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\n-}\n+export { validateEmail } from 'shared-core-lib';",
        },
      ],
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
          isLocalCheck: true,
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
          isLocalCheck: true,
          status: "open",
          publishedToGitHub: false,
        },
      ],
    },
  };

  // 6. Developer Agents (7 workflows, policies, and runs)
  const agentWorkflows = [...STANDARD_WORKFLOWS];

  const agentPolicies: Record<string, any> = {
    ws_team_demo: {
      workspaceId: "ws_team_demo",
      requireApproval: true,
      allowedTemplates: [
        "fix_bug",
        "unit_tests",
        "documentation",
        "security_audit",
        "upgrade_dependency",
        "refactor_function",
        "explain_module",
      ],
      maxFilesPerRun: 5,
      blockedPaths: [".env", "secrets/", ".pem", "id_rsa"],
      allowDependencyUpgrades: true,
      updatedAt: timestamp,
    },
    ws_default: {
      workspaceId: "ws_default",
      requireApproval: true,
      allowedTemplates: [
        "fix_bug",
        "unit_tests",
        "documentation",
        "security_audit",
        "upgrade_dependency",
        "refactor_function",
        "explain_module",
      ],
      maxFilesPerRun: 5,
      blockedPaths: [".env", "secrets/"],
      allowDependencyUpgrades: true,
      updatedAt: timestamp,
    },
  };

  const agentRuns = [
    {
      id: "run_101",
      userId: "usr_demo",
      workspaceId: "ws_team_demo",
      repositoryId: "sample-project",
      repositoryName: "sample-project",
      agentType: "debugging",
      templateId: "fix_bug",
      templateName: "Fix a bug from a description/stack trace",
      taskPrompt: "Investigate TypeError: Cannot read properties of undefined (reading 'token') reported in loginUser",
      title: "Fix TypeError in loginUser",
      target: "src/services/auth.ts",
      stackTrace: "TypeError: Cannot read properties of undefined (reading 'token')\n    at loginUser (src/services/auth.ts:28:19)\n    at handleSubmit (src/components/LoginForm.tsx:28:25)",
      instructions: "Isolate the root cause and provide a null-safe guard.",
      requireApproval: true,
      maxFilesToChange: 1,
      status: "completed",
      currentStepIndex: 6,
      steps: [
        { id: "step_plan", order: 1, title: "Plan", description: "Formulate task plan and evaluate dependencies", status: "completed", startedAt: "2026-01-25T10:00:02.000Z", completedAt: "2026-01-25T10:00:04.000Z" },
        { id: "step_read_files", order: 2, title: "Read relevant files", description: "Inspect targeted repository files, import graphs, and interfaces", status: "completed", startedAt: "2026-01-25T10:00:04.000Z", completedAt: "2026-01-25T10:00:08.000Z" },
        { id: "step_analyze", order: 3, title: "Analyze", description: "Perform semantic AST checks, invariant validation, and contract matching", status: "completed", startedAt: "2026-01-25T10:00:08.000Z", completedAt: "2026-01-25T10:00:15.000Z" },
        { id: "step_propose_changes", order: 4, title: "Propose changes (diff)", description: "Synthesize targeted unified diff patch with line-level context", status: "completed", startedAt: "2026-01-25T10:00:15.000Z", completedAt: "2026-01-25T10:00:22.000Z" },
        { id: "step_self_check", order: 5, title: "Self-check", description: "Verify syntax validity, boundary conditions, and regression safety", status: "completed", startedAt: "2026-01-25T10:00:22.000Z", completedAt: "2026-01-25T10:00:26.000Z" },
        { id: "step_wait_for_approval", order: 6, title: "Wait for approval", description: "Awaiting human review and explicit authorization gate", isApprovalGate: true, status: "completed", startedAt: "2026-01-25T10:00:26.000Z", completedAt: "2026-01-25T10:01:10.000Z" },
        { id: "step_apply", order: 7, title: "Apply", description: "Apply approved diff to repository file tree and create Pull Request", status: "completed", startedAt: "2026-01-25T10:01:10.000Z", completedAt: "2026-01-25T10:01:15.000Z" },
      ],
      planChecklist: [
        { id: "p1", text: "Correlate error stack trace with symbol line ranges", done: true },
        { id: "p2", text: "Trace variable state and null dereference vulnerabilities", done: true },
        { id: "p3", text: "Construct targeted null-safe guard and error hierarchy", done: true },
        { id: "p4", text: "Generate regression test asserting graceful failure behavior", done: true },
      ],
      diff: synthesizeDiff("fix_bug", "src/services/auth.ts", undefined, ""),
      logs: [
        { id: "l1", timestamp: "10:00:02", level: "info", message: "Agent execution initialized for repository 'sample-project'.", stepId: "step_plan" },
        { id: "l2", timestamp: "10:00:04", level: "info", message: "Parsed 4 stack trace frames. Primary failure point located at src/services/auth.ts:28.", stepId: "step_read_files" },
        { id: "l3", timestamp: "10:00:08", level: "info", message: "Analyzing session token issuance path. Unchecked access to session.token identified.", stepId: "step_analyze" },
        { id: "l4", timestamp: "10:00:15", level: "info", message: "Synthesized null-guard patch in src/services/auth.ts.", stepId: "step_propose_changes" },
        { id: "l5", timestamp: "10:00:22", level: "info", message: "Self-check completed: zero typecheck errors, null guard validated.", stepId: "step_self_check" },
        { id: "l6", timestamp: "10:01:10", level: "success", message: "Human approval granted by Alex Chen. Applying patch...", stepId: "step_apply" },
        { id: "l7", timestamp: "10:01:15", level: "success", message: "Run completed successfully. Pull Request #101 registered in Code Review.", stepId: "step_apply" },
      ],
      filesTouched: ["src/services/auth.ts"],
      tokensUsed: 1420,
      durationSeconds: 48,
      startedBy: { id: "usr_demo", name: "Alex Chen", email: "alex@codeatlas.dev" },
      actions: [],
      findings: [],
      hypotheses: [],
      citations: [],
      createdAt: "2026-01-25T10:00:00.000Z",
      updatedAt: "2026-01-25T10:04:30.000Z",
      completedAt: "2026-01-25T10:04:30.000Z",
    },
    {
      id: "run_102",
      userId: "usr_demo",
      workspaceId: "ws_team_demo",
      repositoryId: "sample-project",
      repositoryName: "sample-project",
      agentType: "test_generation",
      templateId: "unit_tests",
      templateName: "Write unit tests for a file",
      taskPrompt: "Write unit tests for src/services/auth.ts",
      title: "Unit Tests for src/services/auth.ts",
      target: "src/services/auth.ts",
      instructions: "Generate comprehensive Vitest unit test suite covering happy paths and edge cases.",
      requireApproval: true,
      maxFilesToChange: 1,
      status: "awaiting_approval",
      currentStepIndex: 5,
      steps: [
        { id: "step_plan", order: 1, title: "Plan", description: "Formulate task plan and evaluate dependencies", status: "completed", startedAt: "2026-01-26T14:00:02.000Z", completedAt: "2026-01-26T14:00:05.000Z" },
        { id: "step_read_files", order: 2, title: "Read relevant files", description: "Inspect targeted repository files, import graphs, and interfaces", status: "completed", startedAt: "2026-01-26T14:00:05.000Z", completedAt: "2026-01-26T14:00:10.000Z" },
        { id: "step_analyze", order: 3, title: "Analyze", description: "Perform semantic AST checks, invariant validation, and contract matching", status: "completed", startedAt: "2026-01-26T14:00:10.000Z", completedAt: "2026-01-26T14:00:18.000Z" },
        { id: "step_propose_changes", order: 4, title: "Propose changes (diff)", description: "Synthesize targeted unified diff patch with line-level context", status: "completed", startedAt: "2026-01-26T14:00:18.000Z", completedAt: "2026-01-26T14:00:28.000Z" },
        { id: "step_self_check", order: 5, title: "Self-check", description: "Verify syntax validity, boundary conditions, and regression safety", status: "completed", startedAt: "2026-01-26T14:00:28.000Z", completedAt: "2026-01-26T14:00:33.000Z" },
        { id: "step_wait_for_approval", order: 6, title: "Wait for approval", description: "Awaiting human review and explicit authorization gate", isApprovalGate: true, status: "waiting", startedAt: "2026-01-26T14:00:33.000Z" },
        { id: "step_apply", order: 7, title: "Apply", description: "Apply approved diff to repository file tree and create Pull Request", status: "pending" },
      ],
      planChecklist: [
        { id: "p1", text: "Analyze exported interface and symbol declarations in src/services/auth.ts", done: true },
        { id: "p2", text: "Identify critical happy paths and authentication ceremonies", done: true },
        { id: "p3", text: "Isolate edge cases: missing credentials, malformed tokens, inactive accounts", done: true },
        { id: "p4", text: "Synthesize isolated unit tests with zero network side effects", done: true },
        { id: "p5", text: "Validate assertion coverage and syntax correctness", done: true },
      ],
      diff: synthesizeDiff("unit_tests", "src/services/auth.ts", undefined, ""),
      logs: [
        { id: "l1", timestamp: "14:00:02", level: "info", message: "Agent execution initialized for repository 'sample-project'.", stepId: "step_plan" },
        { id: "l2", timestamp: "14:00:05", level: "info", message: "Read src/services/auth.ts (42 lines, 3 symbols).", stepId: "step_read_files" },
        { id: "l3", timestamp: "14:00:10", level: "info", message: "Identified test targets: loginUser(), validateEmail(), issueSession().", stepId: "step_analyze" },
        { id: "l4", timestamp: "14:00:18", level: "info", message: "Synthesized Vitest unit test suite (42 additions).", stepId: "step_propose_changes" },
        { id: "l5", timestamp: "14:00:28", level: "info", message: "Self-check passed: 0 syntax issues, 5/5 assertions verified.", stepId: "step_self_check" },
        { id: "l6", timestamp: "14:00:33", level: "warn", message: "Execution paused: Awaiting developer review and approval to apply changes.", stepId: "step_wait_for_approval" },
      ],
      filesTouched: ["tests/auth.test.ts"],
      tokensUsed: 2150,
      durationSeconds: 35,
      startedBy: { id: "usr_demo", name: "Alex Chen", email: "alex@codeatlas.dev" },
      actions: [
        {
          id: "act_102",
          actionType: "apply_patch",
          title: "Create unit test suite for auth service",
          description: "Generates tests/auth.test.ts testing authentication ceremonies and edge cases",
          rationale: "Ensures regression resilience and verifies token validation behavior",
          affectedFiles: ["tests/auth.test.ts"],
          status: "pending",
          riskLevel: "low",
          createdAt: "2026-01-26T14:00:33.000Z",
        },
      ],
      findings: [],
      hypotheses: [],
      citations: [],
      createdAt: "2026-01-26T14:00:00.000Z",
      updatedAt: "2026-01-26T14:03:15.000Z",
    },
  ];

  // 7. Debug Investigations (With BOTH suggestedFixes AND proposedFixes)
  const debugInvestigations = [
    {
      id: "inv_demo_1",
      userId: "usr_demo",
      workspaceId: "ws_team_demo",
      repositoryId: "sample-project",
      repositoryName: "demo-auth-service",
      title: "TypeError: Cannot read properties of undefined (reading 'token') at loginUser",
      status: "investigating",
      mode: "repository_grounded",
      errorType: "TypeError",
      errorMessage: "Cannot read properties of undefined (reading 'token')",
      runtime: "nodejs",
      rawTrace: "TypeError: Cannot read properties of undefined (reading 'token')\n    at loginUser (src/services/auth.ts:28:19)\n    at handleSubmit (src/components/LoginForm.tsx:28:25)",
      parsedTrace: {
        raw: "TypeError: Cannot read properties of undefined (reading 'token')\n    at loginUser (src/services/auth.ts:28:19)\n    at handleSubmit (src/components/LoginForm.tsx:28:25)",
        runtime: "nodejs",
        errorType: "TypeError",
        errorMessage: "Cannot read properties of undefined (reading 'token')",
        totalFrames: 2,
        verifiedFramesCount: 2,
        unresolvedFramesCount: 0,
        frames: [
          {
            id: "frame_1",
            order: 1,
            raw: "at loginUser (src/services/auth.ts:28:19)",
            functionName: "loginUser",
            filePath: "src/services/auth.ts",
            normalizedPath: "src/services/auth.ts",
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
                { lineNumber: 25, content: "export async function loginUser(email: string, password: string): Promise<string> {", isHighlighted: false },
                { lineNumber: 26, content: "  const user = { email, isActive: false };", isHighlighted: false },
                { lineNumber: 27, content: "  const session = await issueSessionToken(user);", isHighlighted: false },
                { lineNumber: 28, content: "  return session.token;", isHighlighted: true },
                { lineNumber: 29, content: "}", isHighlighted: false },
              ],
            },
          },
          {
            id: "frame_2",
            order: 2,
            raw: "at handleSubmit (src/components/LoginForm.tsx:28:25)",
            functionName: "handleSubmit",
            filePath: "src/components/LoginForm.tsx",
            normalizedPath: "src/components/LoginForm.tsx",
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
      },
      observedEvidence: {
        errorType: "TypeError",
        errorMessage: "Cannot read properties of undefined (reading 'token')",
        verifiedLocations: [
          { filePath: "src/services/auth.ts", line: 28, symbolName: "loginUser" },
        ],
        expectedBehavior: "loginUser should handle missing token in response and throw a descriptive error.",
        actualBehavior: "Uncaught TypeError crashed the login form rendering.",
        missingContext: [
          "Runtime values of user credentials payload",
          "API session status response under inactive account",
        ],
      },
      hypotheses: [
        {
          id: "hypo-1",
          rank: 1,
          title: "issueSessionToken returns null for inactive users",
          category: "null_undefined_access",
          categoryLabel: "Null / Undefined Property Access",
          explanation: "In src/services/auth.ts:28, session is assumed to be an object. If the user account is flagged as unverified, issueSessionToken() returns null, causing property access session.token to crash.",
          likelihood: "high",
          supportingEvidence: [
            "Source line 27: const session = await issueSessionToken(user)",
            "Inactive account status returns null token bundle",
          ],
          counterEvidence: [],
          suggestedSteps: ["Add an explicit null guard and throw descriptive AuthError."],
          targetFile: "src/services/auth.ts",
          targetSymbol: "loginUser",
          isInvestigated: false,
          isConfirmedRootCause: true,
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
          suggestedSteps: ["Verify environment configurations at application startup."],
          targetFile: "src/services/auth.ts",
          isInvestigated: false,
          isConfirmedRootCause: false,
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
          originalSnippet: "  return session.token;",
          replacementSnippet: "  if (!session || !session.token) {\n    throw new Error('Authentication failed: No valid session token returned.');\n  }\n  return session.token;",
          patchDiff: "@@ -27,3 +27,6 @@\n   const session = await issueSessionToken(user);\n+  if (!session || !session.token) {\n+    throw new Error('Authentication failed: No valid session token returned.');\n+  }\n   return session.token;",
          potentialSideEffects: ["Caller must handle exception"],
          requiredTests: ["Verify error thrown when session is null"],
          assumptions: ["Caller catches Promise rejection"],
          isApplicable: true,
          validationStatus: "validated",
          isApplied: false,
        },
      ],
      testRecommendations: [
        {
          id: "test-rec-1",
          title: "Verify error is thrown when user session issuance fails",
          testFile: "tests/auth.test.ts",
          targetSymbol: "loginUser",
          framework: "jest",
          category: "regression",
          rationale: "Automated regression test verifying that inactive user accounts produce clean errors.",
          testCode: "test('should throw error when user session issuance fails', async () => {\n  await expect(loginUser('inactive@example.com', 'pass')).rejects.toThrow('No valid session token');\n});",
          status: "suggested",
          isExistingTest: false,
        },
      ],
      createdAt: "2026-01-25T10:00:00.000Z",
      updatedAt: "2026-01-25T10:00:00.000Z",
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
      id: "prop_demo_dup_1",
      repositoryId: "sample-project",
      userId: "usr_demo",
      title: "Extract duplicate validateEmail to @acme/shared-utils (shared-core-lib)",
      operationType: "extract_function",
      operation: "extract_function",
      filePath: "src/utils/validation.ts",
      targetFile: "src/utils/validation.ts",
      symbolName: "validateEmail",
      targetSymbol: "validateEmail",
      lineRange: { start: 1, end: 10 },
      rationale: "Identical email regex validator is duplicated across sample-project, payment-service, and shared-core-lib. Consolidating into shared-core-lib eliminates cross-repo drift.",
      diff: "@@ -1,7 +1,3 @@\n-export function validateEmail(email: string): boolean {\n-  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\n-}\n+export { validateEmail } from \"@acme/shared-utils\";",
      status: "open",
      impactAnalysis: {
        riskLevel: "Low",
        riskScore: 15,
        affectedTests: ["tests/validation.test.ts"],
        blastRadiusFiles: ["src/utils/validation.ts", "package.json"],
      },
      createdAt: "2026-01-26T14:30:00.000Z",
    },
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

  const initialRefactoringHistory = [
    {
      id: "hist_init_1",
      type: "scan",
      title: "Scheduled Architecture Quality Scan",
      description: "AST metric scan detected 7 findings across 5 files in sample-project.",
      repositoryId: "sample-project",
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      author: { name: "CodeAtlas Daemon" },
      status: "completed",
    },
    {
      id: "hist_init_2",
      type: "proposal",
      title: "Extract email & password verification guards into standalone validator",
      description: "Proposed extract_function on src/services/auth.ts:18-32.",
      repositoryId: "sample-project",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      author: { name: "Alex Chen" },
      status: "proposed",
      proposalId: "prop_demo_1",
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

  const now = Date.now();
  const activities: ActivityEvent[] = [
    {
      id: "act_seed_1",
      time: new Date(now - 1000 * 60 * 15).toISOString(),
      timestamp: new Date(now - 1000 * 60 * 15).toISOString(),
      actor: {
        id: "usr_demo",
        name: "Demo User",
        avatar: DEMO_USER.avatar,
        email: "demo@codeatlas.dev",
        role: "Lead Systems Architect",
      },
      module: "code-review",
      action: "merge",
      type: "pr_merged",
      target: { type: "pr", id: "pr_101", name: "PR #101" },
      status: "success",
      title: "Merged PR #101: WebAuthn Nonce Invalidation",
      shortDescription: "Applied atomic redis challenge eviction diff to demo-auth-service main branch.",
      description: "Successfully merged pull request #101 into main branch. Automated validation passed 18/18 tests.",
      link: "/code-review?pr=pr_101",
      href: "/code-review?pr=pr_101",
      repositoryId: "sample-project",
      details: {
        diff: `--- a/src/services/auth.ts\n+++ b/src/services/auth.ts\n@@ -24,7 +24,8 @@ export async function verifyAssertion(assertion) {\n-  const valid = checkSignature(assertion);\n+  const valid = checkSignature(assertion);\n+  await nonceCache.invalidate(assertion.challenge);\n   return valid;`,
      },
    },
    {
      id: "act_seed_2",
      time: new Date(now - 1000 * 60 * 45).toISOString(),
      timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
      actor: {
        id: "usr_alex",
        name: "Alex Chen",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        email: "alex.chen@codeatlas.dev",
        role: "Senior Security Engineer",
      },
      module: "agents",
      action: "apply",
      type: "agent_patch_applied",
      target: { type: "agent", id: "run_agent_1", name: "Security Remediation Agent" },
      status: "success",
      title: "Security Agent Applied Parameterized Query Patch",
      shortDescription: "Automated agent generated and applied SQL injection fix in demo-auth-service.",
      description: "AI Agent 'Security Vulnerability Remediation' detected unescaped sql query in src/services/auth.ts and replaced it with parameterized prepared statement.",
      link: "/agents",
      href: "/agents",
      repositoryId: "sample-project",
      details: {
        diff: `--- a/src/services/auth.ts\n+++ b/src/services/auth.ts\n@@ -42,3 +42,3 @@\n-  const query = "SELECT * FROM users WHERE email = '" + email + "'";\n+  const query = "SELECT * FROM users WHERE email = $1";\n+  const result = await db.query(query, [email]);`,
      },
    },
    {
      id: "act_seed_3",
      time: new Date(now - 1000 * 60 * 90).toISOString(),
      timestamp: new Date(now - 1000 * 60 * 90).toISOString(),
      actor: {
        id: "usr_demo",
        name: "Demo User",
        avatar: DEMO_USER.avatar,
        email: "demo@codeatlas.dev",
        role: "Lead Systems Architect",
      },
      module: "debugger",
      action: "apply",
      type: "debug_fix_applied",
      target: { type: "investigation", id: "inv_1", name: "Token Verification Timing Attack" },
      status: "success",
      title: "Resolved Debug Investigation: Constant-Time Token Compare",
      shortDescription: "Applied crypto.timingSafeEqual fix and opened PR #104.",
      description: "Investigated timing leakage in signature check. Replaced string comparison with crypto.timingSafeEqual in src/services/auth.ts.",
      link: "/debug?id=inv_1",
      href: "/debug?id=inv_1",
      repositoryId: "sample-project",
      details: {
        diff: `--- a/src/services/auth.ts\n+++ b/src/services/auth.ts\n@@ -88,3 +88,3 @@\n-  if (receivedToken === expectedToken) {\n+  if (crypto.timingSafeEqual(Buffer.from(receivedToken), Buffer.from(expectedToken))) {`,
      },
    },
    {
      id: "act_seed_4",
      time: new Date(now - 1000 * 60 * 180).toISOString(),
      timestamp: new Date(now - 1000 * 60 * 180).toISOString(),
      actor: {
        id: "usr_marcus",
        name: "Marcus Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        email: "marcus.chen@codeatlas.dev",
        role: "DevOps Tech Lead",
      },
      module: "indexing",
      action: "index",
      type: "indexing_completed",
      target: { type: "repository", id: "sample-project", name: "demo-auth-service" },
      status: "success",
      title: "Re-indexed repository demo-auth-service",
      shortDescription: "Resolved 24 AST symbols and 15 cross-file relationships.",
      description: "Deterministic AST parser scanned all 12 source files, extracting 24 functions/classes and verifying zero broken imports.",
      link: "/repositories/sample-project",
      href: "/repositories/sample-project",
      repositoryId: "sample-project",
    },
    {
      id: "act_seed_5",
      time: new Date(now - 1000 * 60 * 300).toISOString(),
      timestamp: new Date(now - 1000 * 60 * 300).toISOString(),
      actor: {
        id: "usr_demo",
        name: "Demo User",
        avatar: DEMO_USER.avatar,
        email: "demo@codeatlas.dev",
        role: "Lead Systems Architect",
      },
      module: "change-impact",
      action: "analyze",
      type: "impact_analysis_saved",
      target: { type: "file", id: "src/services/auth.ts", name: "loginUser() in auth.ts" },
      status: "warning",
      title: "Evaluated Blast Radius for loginUser()",
      shortDescription: "High Risk (68/100): 4 files, 5 symbols, and 1 public API endpoint affected.",
      description: "Analyzed change impact graph for loginUser(). Identified direct call sites in LoginForm.tsx and session API route.",
      link: "/change-impact?repo=sample-project&file=src/services/auth.ts&symbol=loginUser",
      href: "/change-impact?repo=sample-project&file=src/services/auth.ts&symbol=loginUser",
      repositoryId: "sample-project",
    },
    {
      id: "act_seed_6",
      time: new Date(now - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
      timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
      actor: {
        id: "usr_elena",
        name: "Elena Rostova",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
        email: "elena.rostova@codeatlas.dev",
        role: "Senior Security Architect",
      },
      module: "refactoring",
      action: "apply",
      type: "refactoring_proposal_applied",
      target: { type: "proposal", id: "refact_prop_1", name: "Extract Shared WebAuthn Provider" },
      status: "success",
      title: "Applied Refactoring: Extract Shared WebAuthn Provider",
      shortDescription: "Reduced technical debt score by 14 points across demo-auth-service.",
      description: "Extracted duplicated challenge generation and verification logic into shared-core-lib WebAuthn adapter.",
      link: "/refactoring",
      href: "/refactoring",
      repositoryId: "sample-project",
      details: {
        diff: `--- a/src/services/auth.ts\n+++ b/src/services/auth.ts\n@@ -12,8 +12,3 @@\n-import { generateRegistrationOptions } from "@simplewebauthn/server";\n-import { verifyRegistrationResponse } from "@simplewebauthn/server";\n+import { WebAuthnProvider } from "@codeatlas/shared-core";`,
      },
    },
    {
      id: "act_seed_7",
      time: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      timestamp: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      actor: {
        id: "usr_demo",
        name: "Demo User",
        avatar: DEMO_USER.avatar,
        email: "demo@codeatlas.dev",
        role: "Lead Systems Architect",
      },
      module: "architecture",
      action: "analyze",
      type: "architecture_explored",
      target: { type: "repository", id: "sample-project", name: "demo-auth-service" },
      status: "info",
      title: "Architecture Analysis: Resolved Circular Import Loop",
      shortDescription: "Explored Modules layer and generated decoupling boundary rules.",
      description: "Inspected dependency cycle between src/services/auth.ts and src/api/auth-routes.ts. Configured layer boundary constraints.",
      link: "/architecture?repo=sample-project&level=modules",
      href: "/architecture?repo=sample-project&level=modules",
      repositoryId: "sample-project",
    },
    {
      id: "act_seed_8",
      time: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
      timestamp: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
      actor: {
        id: "usr_demo",
        name: "Demo User",
        avatar: DEMO_USER.avatar,
        email: "demo@codeatlas.dev",
        role: "Lead Systems Architect",
      },
      module: "workspaces",
      action: "update",
      type: "role_changed",
      target: { type: "member", id: "usr_elena", name: "Elena Rostova" },
      status: "success",
      title: "Promoted Elena Rostova to Admin",
      shortDescription: "Updated workspace membership permissions in Acme Engineering.",
      description: "Elevated Elena Rostova role from member to admin with full repository indexing privileges.",
      link: "/workspaces/ws_team_demo",
      href: "/workspaces/ws_team_demo",
      workspaceId: "ws_team_demo",
      details: {
        before: { role: "member" },
        after: { role: "admin" },
        changedFields: ["role"],
      },
    },
    {
      id: "act_seed_9",
      time: new Date(now - 1000 * 60 * 60 * 34).toISOString(),
      timestamp: new Date(now - 1000 * 60 * 60 * 34).toISOString(),
      actor: {
        id: "usr_alex",
        name: "Alex Chen",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
        email: "alex.chen@codeatlas.dev",
        role: "Senior Security Engineer",
      },
      module: "assistant",
      action: "create",
      type: "question_answered",
      target: { type: "conversation", id: "conv_seed_1", name: "JWT Token Invalidation Best Practices" },
      status: "info",
      title: "Consulted AI Assistant on JWT Token Invalidation",
      shortDescription: "Grounded answer with 3 AST code citations from auth.ts and validation.ts.",
      description: "AI Assistant verified token revocation mechanisms against current repository implementation and cited src/services/auth.ts:18-42.",
      link: "/assistant",
      href: "/assistant",
      repositoryId: "sample-project",
    },
    {
      id: "act_seed_10",
      time: new Date(now - 1000 * 60 * 60 * 36).toISOString(),
      timestamp: new Date(now - 1000 * 60 * 60 * 36).toISOString(),
      actor: {
        id: "usr_marcus",
        name: "Marcus Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        email: "marcus.chen@codeatlas.dev",
        role: "DevOps Tech Lead",
      },
      module: "multi-repo",
      action: "analyze",
      type: "multi_repo_analysis",
      target: { type: "workspace", id: "ws_team_demo", name: "Acme Engineering" },
      status: "warning",
      title: "Executed Cross-Repository Dependency Scan",
      shortDescription: "Detected 1 semantic version mismatch for @shared/core across 3 services.",
      description: "Unified multi-repository intelligence scan across demo-auth-service, shared-core-lib, and api-gateway identified conflicting peer dependencies.",
      link: "/multi-repo",
      href: "/multi-repo",
      workspaceId: "ws_team_demo",
    },
    {
      id: "act_seed_11",
      time: new Date(now - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      timestamp: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
      actor: {
        id: "usr_demo",
        name: "Demo User",
        avatar: DEMO_USER.avatar,
        email: "demo@codeatlas.dev",
        role: "Lead Systems Architect",
      },
      module: "explorer",
      action: "scan",
      type: "code_explained",
      target: { type: "file", id: "src/utils/cart.ts", name: "calculateUserDiscounts()" },
      status: "warning",
      title: "Bug Audit: calculateUserDiscounts()",
      shortDescription: "Identified 3 vulnerabilities: off-by-one boundary, unchecked null, negative balance.",
      description: "Visual Code Explorer CodeLens inspection identified off-by-one boundary check (<= instead of <) in cart item loop.",
      link: "/visual-explorer",
      href: "/visual-explorer",
      repositoryId: "sample-project",
    },
    {
      id: "act_seed_12",
      time: new Date(now - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
      timestamp: new Date(now - 1000 * 60 * 60 * 96).toISOString(),
      actor: {
        id: "usr_demo",
        name: "Demo User",
        avatar: DEMO_USER.avatar,
        email: "demo@codeatlas.dev",
        role: "Lead Systems Architect",
      },
      module: "settings",
      action: "update",
      type: "settings_updated",
      target: { type: "settings", id: "user_settings", name: "User Preferences" },
      status: "success",
      title: "Updated AI Engine & Notification Preferences",
      shortDescription: "Configured preferred model to gemini-1.5-pro with streaming enabled.",
      description: "Updated workspace preferences: enabled real-time streaming, AST code citations, and line numbering.",
      link: "/settings?tab=preferences",
      href: "/settings?tab=preferences",
      details: {
        before: { preferredModel: "gemini-1.0-flash", useStreaming: false },
        after: { preferredModel: "gemini-1.5-pro", useStreaming: true },
        changedFields: ["preferredModel", "useStreaming"],
      },
    },
    {
      id: "act_seed_13",
      time: new Date(now - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
      timestamp: new Date(now - 1000 * 60 * 60 * 120).toISOString(),
      actor: {
        id: "usr_marcus",
        name: "Marcus Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        email: "marcus.chen@codeatlas.dev",
        role: "DevOps Tech Lead",
      },
      module: "repositories",
      action: "connect",
      type: "repository_connected",
      target: { type: "repository", id: "shared-core-lib", name: "shared-core-lib" },
      status: "success",
      title: "Connected Repository shared-core-lib",
      shortDescription: "Linked shared core library to workspace Acme Engineering.",
      description: "Repository added and scheduled for AST symbol indexing.",
      link: "/repositories/shared-core-lib",
      href: "/repositories/shared-core-lib",
      repositoryId: "shared-core-lib",
    },
    {
      id: "act_seed_14",
      time: new Date(now - 1000 * 60 * 60 * 144).toISOString(), // 6 days ago
      timestamp: new Date(now - 1000 * 60 * 60 * 144).toISOString(),
      actor: {
        id: "usr_demo",
        name: "Demo User",
        avatar: DEMO_USER.avatar,
        email: "demo@codeatlas.dev",
        role: "Lead Systems Architect",
      },
      module: "auth",
      action: "login",
      type: "auth_sign_in",
      target: { type: "session", id: "sess_init", name: "Active Session" },
      status: "success",
      title: "User Signed In via GitHub OAuth",
      shortDescription: "Authenticated demo-developer session from Chrome / macOS.",
      description: "Single Sign-On authentication completed successfully with scopes [read:user, repo].",
      link: "/settings?tab=account",
      href: "/settings?tab=account",
      details: {
        metadata: { browser: "Chrome 128", os: "macOS Sonoma", ip: "192.168.1.1" },
      },
    },
  ];

  return {
    version: STORE_VERSION,
    workspaces,
    workspaceMembers,
    workspaceRepositories,
    workspaceAnnotations: {
      ws_team_demo: [
        {
          id: "anno_1",
          workspaceId: "ws_team_demo",
          repositoryId: "sample-project",
          filePath: "src/services/auth.ts",
          startLine: 18,
          endLine: 26,
          symbolName: "loginUser",
          category: "security",
          title: "WebAuthn Assertion Ceremony",
          content: "Core authentication entrypoint. Verify challenge nonces against Redis before issuing JWT session tokens.",
          codeSnippet: "export async function loginUser(email: string, pass: string): Promise<string> {\n  if (creds.isWebAuthn) {\n    return verifyWebAuthnAssertion(creds.assertion);\n  }\n  const user = await UserService.findUserByEmail(email);",
          tags: ["auth", "security", "webauthn"],
          authorId: "usr_demo",
          authorName: "Demo User",
          authorAvatar: DEMO_USER.avatar,
          createdAt: "2026-01-20T10:00:00.000Z",
          updatedAt: "2026-01-20T10:00:00.000Z",
        },
        {
          id: "anno_2",
          workspaceId: "ws_team_demo",
          repositoryId: "sample-project",
          filePath: "src/utils/validation.ts",
          startLine: 7,
          endLine: 11,
          symbolName: "validatePasskeyChallenge",
          category: "architecture",
          title: "Passkey Challenge Boundary",
          content: "Validates minimum 32-character requirement for cryptographic nonces.",
          codeSnippet: "export function validatePasskeyChallenge(challenge: string): boolean {\n  return typeof challenge === 'string' && challenge.length >= 32;\n}",
          tags: ["validation", "crypto"],
          authorId: "usr_elena",
          authorName: "Elena Rostova",
          authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
          createdAt: "2026-01-21T11:30:00.000Z",
          updatedAt: "2026-01-21T11:30:00.000Z",
        },
      ],
    },
    workspaceArtifacts: {
      ws_team_demo: [
        {
          id: "art_1",
          workspaceId: "ws_team_demo",
          repositoryId: "sample-project",
          title: "Authentication & Session Architecture Blueprint",
          description: "System diagram and security verification for WebAuthn passkey integration.",
          type: "architecture_snapshot",
          creatorId: "usr_demo",
          creatorName: "Demo User",
          creatorAvatar: DEMO_USER.avatar,
          content: "# Authentication & Session Architecture\n\nDeterministic verification flow for WebAuthn passkey assertion validation and distributed session caching.",
          visibility: "workspace",
          createdAt: "2026-01-20T12:00:00.000Z",
          updatedAt: "2026-01-20T12:00:00.000Z",
        },
      ],
    },
    workspaceActivities: {
      ws_team_demo: [
        {
          id: "ws_act_1",
          workspaceId: "ws_team_demo",
          userId: "usr_demo",
          userName: "Demo User",
          type: "repo_connected",
          title: "Connected demo-auth-service",
          description: "Added repository and parsed 24 AST symbols.",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: "success",
        },
        {
          id: "ws_act_2",
          workspaceId: "ws_team_demo",
          userId: "usr_elena",
          userName: "Elena Rostova",
          type: "member_joined",
          title: "Elena Rostova joined workspace",
          description: "Accepted invite as Admin.",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: "info",
        },
        {
          id: "ws_act_3",
          workspaceId: "ws_team_demo",
          userId: "usr_marcus",
          userName: "Marcus Chen",
          type: "review_completed",
          title: "Code review completed for PR #101",
          description: "Automated scan detected 1 critical security finding.",
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          status: "warning",
        },
      ],
    },
    discussions: {
      ws_team_demo: [
        {
          id: "disc_thread_1",
          workspaceId: "ws_team_demo",
          title: "WebAuthn challenge replay remediation architecture",
          body: "We need to ensure that the WebAuthn challenge nonce is atomically invalidated in the Redis cluster cache immediately upon assertion verification to prevent replay attacks.",
          repositoryId: "sample-project",
          filePath: "src/services/auth.ts",
          line: 24,
          authorId: "usr_demo",
          authorName: "Demo User",
          authorAvatar: DEMO_USER.avatar,
          status: "open",
          createdAt: "2026-01-22T09:00:00.000Z",
          replies: [
            {
              id: "disc_rep_1",
              authorId: "usr_elena",
              authorName: "Elena Rostova",
              authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
              body: "Agreed @Demo. I have implemented a distributed Lua script in `nonceCache.consume(assertion.challenge)` on branch `feat/webauthn-passkeys`.",
              createdAt: "2026-01-22T09:45:00.000Z",
            },
          ],
          reactions: {
            "👍": ["usr_demo", "usr_elena", "usr_marcus"],
            "🚀": ["usr_demo", "usr_elena"],
          },
        },
        {
          id: "disc_thread_2",
          workspaceId: "ws_team_demo",
          title: "Centralizing AST parser options across microservices",
          body: "Should we extract the shared TypeScript AST configuration from demo-auth-service into shared-core-lib so all services share identical parsing rules?",
          repositoryId: "shared-core-lib",
          authorId: "usr_marcus",
          authorName: "Marcus Chen",
          authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
          status: "resolved",
          createdAt: "2026-01-18T14:00:00.000Z",
          replies: [],
          reactions: {
            "💡": ["usr_demo", "usr_marcus"],
          },
        },
      ],
    },
    decisions: {},
    invitations: [
      {
        id: "inv_preview",
        workspaceId: "ws_team_demo",
        workspaceName: "Acme Engineering",
        email: "newteammate@example.com",
        role: "member",
        token: "preview-token",
        status: "pending",
        invitedBy: "usr_demo",
        invitedByName: "Demo User",
        expiresAt: "2026-12-31T23:59:59.000Z",
        createdAt: "2026-01-20T10:00:00.000Z",
      },
    ],
    repositories,
    repositoryTrees,
    repositoryFiles,
    repositoryDependencies: {},
    repositorySymbols: {},
    pullRequests,
    reviewSessions,
    agentRuns,
    agentWorkflows,
    agentPolicies,
    debugInvestigations,
    debugFollowUps: {},
    refactoringProposals,
    refactoringHistory: initialRefactoringHistory,
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
    architectureNodePositions: {},
    architectureLayerOverrides: {},
    architectureLayerRules: {},
    architectureAiOverviews: {},
    impactAnalyses: [
      {
        id: "impact_seed_1",
        title: "shared-core-lib: validateEmail() Evolution",
        repositoryId: "shared-core-lib",
        repositoryName: "shared-core-lib",
        targetFile: "src/validation.ts",
        targetSymbol: "validateEmail",
        changeType: "change_signature",
        depth: 3,
        includeCrossRepo: true,
        riskScore: 84,
        riskLevel: "Critical",
        summaryCounts: {
          filesCount: 6,
          symbolsCount: 7,
          endpointsCount: 2,
          reposCount: 2,
          testsCount: 2,
          gapsCount: 1,
          directCount: 3,
          indirectCount: 4,
        },
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        result: {
          symbol: "validateEmail()",
          file: "src/validation.ts",
          repositoryId: "shared-core-lib",
          repositoryName: "shared-core-lib",
          changeType: "change_signature",
          maxDepth: 3,
          includeCrossRepo: true,
          riskLevel: "Critical",
          riskScore: 84,
          affectedEndpoints: [
            { method: "POST", path: "/api/v1/auth/session", file: "src/api/auth-routes.ts", line: 15, handlerName: "handleLoginRoute", repositoryId: "sample-project", repositoryName: "demo-auth-service" },
            { method: "POST", path: "/api/v1/checkout", file: "src/checkout.ts", line: 19, handlerName: "handleCheckoutRoute", repositoryId: "payment-service", repositoryName: "payment-service" },
          ],
          affectedComponents: [
            { name: "LoginForm.tsx", file: "src/components/LoginForm.tsx", callerLine: 24, repositoryId: "sample-project" },
            { name: "UserProfile.tsx", file: "src/components/UserProfile.tsx", callerLine: 12, repositoryId: "sample-project" },
          ],
          affectedServices: [
            { name: "auth.ts", file: "src/services/auth.ts", line: 28, repositoryId: "sample-project" },
          ],
          testsToRerun: [
            { name: "tests/validation.test.ts", file: "tests/validation.test.ts", line: 5, repositoryId: "shared-core-lib", command: "npm test -- tests/validation.test.ts", status: "needs-update" },
            { name: "tests/auth.test.ts", file: "tests/auth.test.ts", line: 18, repositoryId: "sample-project", command: "npm test -- tests/auth.test.ts", status: "needs-update" },
          ],
          coverageGaps: [
            { id: "gap_1", name: "UserProfile.tsx", file: "src/components/UserProfile.tsx", repositoryId: "sample-project", repositoryName: "demo-auth-service", line: 12, reason: "UserProfile renders validation checks but has no unit test suite." },
          ],
          directlyDependent: [
            { id: "dep_1", name: "auth.ts", type: "service", file: "src/services/auth.ts", line: 28, reason: "Direct caller in loginUser credential check", severity: "High", relationship: "Direct Caller" },
            { id: "dep_2", name: "tests/validation.test.ts", type: "test", file: "tests/validation.test.ts", line: 5, reason: "Unit tests covering validateEmail()", severity: "High", relationship: "Test Suite" },
          ],
          downstreamAffected: [
            { id: "down_1", name: "LoginForm.tsx", type: "component", file: "src/components/LoginForm.tsx", line: 24, reason: "UI form submission callback", severity: "Medium", relationship: "Hop 2 Caller" },
            { id: "down_2", name: "auth-routes.ts", type: "endpoint", file: "src/api/auth-routes.ts", line: 15, reason: "Public API session creation", severity: "High", relationship: "Hop 2 Endpoint" },
          ],
          reviewRequired: [],
          recommendation: "Modifying 'src/validation.ts' (change signature) carries a Critical risk score of 84/100. It reaches 6 files across 2 repos, impacting 2 public endpoints and requiring 2 test suites to be updated.",
        },
      },
      {
        id: "impact_seed_2",
        title: "sample-project: loginUser() Refactoring",
        repositoryId: "sample-project",
        repositoryName: "demo-auth-service",
        targetFile: "src/services/auth.ts",
        targetSymbol: "loginUser",
        changeType: "modify_behavior",
        depth: 3,
        includeCrossRepo: false,
        riskScore: 68,
        riskLevel: "High",
        summaryCounts: {
          filesCount: 4,
          symbolsCount: 5,
          endpointsCount: 1,
          reposCount: 1,
          testsCount: 1,
          gapsCount: 1,
          directCount: 3,
          indirectCount: 1,
        },
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        result: {
          symbol: "loginUser()",
          file: "src/services/auth.ts",
          repositoryId: "sample-project",
          repositoryName: "demo-auth-service",
          changeType: "modify_behavior",
          maxDepth: 3,
          includeCrossRepo: false,
          riskLevel: "High",
          riskScore: 68,
          affectedEndpoints: [
            { method: "POST", path: "/api/v1/auth/session", file: "src/api/auth-routes.ts", line: 18, handlerName: "handleLoginRoute", repositoryId: "sample-project", repositoryName: "demo-auth-service" },
          ],
          affectedComponents: [
            { name: "LoginForm.tsx", file: "src/components/LoginForm.tsx", callerLine: 28, repositoryId: "sample-project" },
            { name: "UserProfile.tsx", file: "src/components/UserProfile.tsx", callerLine: 14, repositoryId: "sample-project" },
          ],
          affectedServices: [],
          testsToRerun: [
            { name: "tests/auth.test.ts", file: "tests/auth.test.ts", line: 18, repositoryId: "sample-project", command: "npm test -- tests/auth.test.ts", status: "needs-update" },
          ],
          coverageGaps: [
            { id: "gap_2", name: "UserProfile.tsx", file: "src/components/UserProfile.tsx", repositoryId: "sample-project", repositoryName: "demo-auth-service", line: 14, reason: "Lacks direct automated tests." },
          ],
          directlyDependent: [
            { id: "dep_a1", name: "LoginForm.tsx", type: "component", file: "src/components/LoginForm.tsx", line: 28, reason: "Calls loginUser in form submit handler", severity: "High", relationship: "Direct Caller" },
          ],
          downstreamAffected: [],
          reviewRequired: [],
          recommendation: "Modifying loginUser() carries High risk (68/100). Directly affects LoginForm.tsx and POST /api/v1/auth/session.",
        },
      },
    ],
    explorerHistory: [
      {
        id: "hist_sample_1",
        title: "Bug Audit: calculateUserDiscounts",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        inputPreview: "export function calculateUserDiscounts(cart: ...",
        code: "export function calculateUserDiscounts(cart: { items: any[]; couponCode?: string; user: any }) {\n  let total = 0;\n  for (let i = 0; i <= cart.items.length; i++) {\n    total += cart.items[i].price * cart.items[i].quantity;\n  }\n  return total;\n}",
        language: "typescript",
        mode: "find-bugs",
        resultMarkdown: "### 🐛 Bug Audit (3 Issues Identified)\n- Line 9: Off-by-one boundary (<= instead of <)\n- Line 15: Unchecked null dereference\n- Line 20: Negative balance on coupon subtraction",
        repositoryId: "sample-project",
      },
      {
        id: "hist_sample_2",
        title: "Explain Simply: loginUser",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        inputPreview: "export async function loginUser(email: string...",
        code: "export async function loginUser(email: string, password: string): Promise<AuthResult> {\n  const user = await db.users.findUnique({ where: { email } });\n  return { token: createToken(user.id), user };\n}",
        language: "typescript",
        mode: "explain",
        resultMarkdown: "### 💡 High-Level Overview\nValidates incoming user email and password against stored database credentials and returns a signed session token.",
        repositoryId: "sample-project",
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

export interface LogActivityInput {
  type: string;
  title: string;
  description?: string;
  shortDescription?: string;
  status?: "success" | "warning" | "error" | "failed" | "info";
  href?: string;
  link?: string;
  linkText?: string;
  userId?: string;
  userName?: string;
  module?: ActivityModule;
  action?: ActivityAction | string;
  target?: ActivityTarget | string;
  actor?: ActivityActor;
  workspaceId?: string;
  repositoryId?: string;
  details?: {
    before?: any;
    after?: any;
    diff?: string;
    changedFields?: string[];
    metadata?: Record<string, any>;
  };
}

export function logActivity(activity: LogActivityInput): ActivityEvent {
  const store = getStore();
  const time = new Date().toISOString();
  const rawStatus = (activity.status || "success").toLowerCase();
  const status: ActivityStatus =
    rawStatus === "error" || rawStatus === "failed"
      ? "failed"
      : rawStatus === "warning"
      ? "warning"
      : rawStatus === "info"
      ? "info"
      : "success";

  const actor: ActivityActor = activity.actor || (activity.userId && activity.userName ? {
    id: activity.userId,
    name: activity.userName,
    avatar: DEMO_USER.avatar,
  } : getActiveUser());

  const link = activity.link || activity.href || "#";

  // Infer module if not supplied
  let module: ActivityModule = activity.module || "repositories";
  if (!activity.module) {
    const t = (activity.type || "").toLowerCase();
    const h = (link || "").toLowerCase();
    if (h.includes("/workspace") || t.startsWith("workspace") || t.startsWith("member_") || t.startsWith("role_")) {
      module = "workspaces";
    } else if (h.includes("/code-review") || t.startsWith("pr_") || t.startsWith("review_")) {
      module = "code-review";
    } else if (h.includes("/agents") || t.startsWith("agent")) {
      module = "agents";
    } else if (h.includes("/debug") || t.startsWith("debug") || t.includes("investigation")) {
      module = "debugger";
    } else if (h.includes("/refactoring") || t.startsWith("refactor") || t.includes("debt")) {
      module = "refactoring";
    } else if (h.includes("/architecture") || t.startsWith("arch")) {
      module = "architecture";
    } else if (h.includes("/change-impact") || t.startsWith("impact")) {
      module = "change-impact";
    } else if (h.includes("/multi-repo") || t.startsWith("multi_repo")) {
      module = "multi-repo";
    } else if (h.includes("/assistant") || t.startsWith("assistant") || t.includes("question")) {
      module = "assistant";
    } else if (h.includes("/visual-explorer") || t.startsWith("explorer") || t.includes("code_explained")) {
      module = "explorer";
    } else if (h.includes("/settings") || t.startsWith("settings")) {
      module = "settings";
    } else if (t.startsWith("auth_") || t.includes("login") || t.includes("logout") || t.includes("signed_")) {
      module = "auth";
    } else if (t.includes("index") || t.includes("indexing")) {
      module = "indexing";
    } else {
      module = "repositories";
    }
  }

  // Infer action if not supplied
  let action: ActivityAction | string = activity.action || "create";
  if (!activity.action) {
    const t = (activity.type || "").toLowerCase();
    const title = (activity.title || "").toLowerCase();
    if (t.includes("created") || t.includes("opened") || title.includes("create") || title.includes("opened")) {
      action = "create";
    } else if (t.includes("updated") || t.includes("changed") || title.includes("update") || title.includes("change")) {
      action = "update";
    } else if (t.includes("deleted") || t.includes("removed") || title.includes("delete") || title.includes("remove")) {
      action = "delete";
    } else if (t.includes("merged") || title.includes("merge")) {
      action = "merge";
    } else if (t.includes("approved") || title.includes("approve")) {
      action = "approve";
    } else if (t.includes("applied") || title.includes("appl")) {
      action = "apply";
    } else if (t.includes("indexed") || t.includes("indexing") || title.includes("index")) {
      action = "index";
    } else if (t.includes("analyzed") || t.includes("analysis") || title.includes("analyz") || title.includes("blast")) {
      action = "analyze";
    } else if (t.includes("login") || t.includes("sign_in") || title.includes("sign in") || title.includes("logged in")) {
      action = "login";
    } else if (t.includes("logout") || t.includes("sign_out") || title.includes("sign out")) {
      action = "logout";
    } else if (t.includes("comment") || title.includes("comment")) {
      action = "comment";
    } else if (t.includes("scan") || title.includes("scan") || title.includes("audit")) {
      action = "scan";
    } else if (t.includes("connected") || title.includes("connect")) {
      action = "connect";
    } else if (t.includes("disconnected") || title.includes("disconnect")) {
      action = "disconnect";
    } else {
      action = "run";
    }
  }

  // Infer target if not supplied
  let target: ActivityTarget = { type: module, id: "target", name: activity.title };
  if (activity.target) {
    if (typeof activity.target === "string") {
      target = { type: module, id: activity.target, name: activity.target };
    } else {
      target = activity.target;
    }
  } else {
    if (activity.repositoryId) {
      target = { type: "repository", id: activity.repositoryId, name: activity.repositoryId };
    } else if (activity.workspaceId) {
      target = { type: "workspace", id: activity.workspaceId, name: activity.workspaceId };
    }
  }

  const shortDescription =
    activity.shortDescription ||
    (activity.description && activity.description.length > 140
      ? activity.description.slice(0, 137) + "..."
      : activity.description) ||
    activity.title;

  const description = activity.description || shortDescription;

  const newActivity: ActivityEvent = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    time,
    timestamp: time,
    actor,
    userId: actor.id,
    type: activity.type,
    module,
    action,
    target,
    status,
    title: activity.title,
    shortDescription,
    description,
    link,
    href: link,
    linkText: activity.linkText,
    workspaceId: activity.workspaceId,
    repositoryId: activity.repositoryId,
    details: activity.details,
  };

  store.activities = [newActivity, ...(store.activities || [])];
  saveStore(store);
  return newActivity;
}

export function getAuditTrail(filters?: Partial<ActivityFilterState>): ActivityEvent[] {
  const store = getStore();
  let list = (store.activities || []).map((raw: any) => {
    const time = raw.time || raw.timestamp || new Date().toISOString();
    const actor: ActivityActor = raw.actor || {
      id: raw.userId || "usr_demo",
      name: raw.userName || "Demo User",
      avatar: DEMO_USER.avatar,
      email: "demo@codeatlas.dev",
      role: "Lead Systems Architect",
    };
    let target: ActivityTarget = { type: raw.module || "resource", id: "item", name: raw.title || "Item" };
    if (raw.target) {
      target = typeof raw.target === "string" ? { type: raw.module || "item", id: raw.target, name: raw.target } : raw.target;
    } else if (raw.repositoryName || raw.repositoryId) {
      target = { type: "repository", id: raw.repositoryId || "sample-project", name: raw.repositoryName || raw.repositoryId || "sample-project" };
    }
    return {
      id: raw.id || `act_${Date.now()}`,
      time,
      timestamp: time,
      actor,
      userId: raw.userId || actor.id,
      type: raw.type || "system_activity",
      module: (raw.module || "repositories") as ActivityModule,
      action: raw.action || "create",
      target,
      status: (raw.status === "error" ? "failed" : raw.status || "success") as ActivityStatus,
      title: raw.title || "Audit Activity",
      shortDescription: raw.shortDescription || raw.description?.slice(0, 140) || raw.title,
      description: raw.description || raw.shortDescription || raw.title,
      link: raw.link || raw.href || "#",
      href: raw.link || raw.href || "#",
      linkText: raw.linkText,
      workspaceId: raw.workspaceId,
      repositoryId: raw.repositoryId,
      details: raw.details,
    } as ActivityEvent;
  });

  if (!filters) return list;

  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.shortDescription.toLowerCase().includes(q) ||
        e.actor.name.toLowerCase().includes(q) ||
        (typeof e.target === "object" ? e.target.name.toLowerCase().includes(q) : String(e.target).toLowerCase().includes(q)) ||
        e.module.toLowerCase().includes(q) ||
        String(e.action).toLowerCase().includes(q)
    );
  }

  if (filters.modules && filters.modules.length > 0) {
    list = list.filter((e) => filters.modules!.includes(e.module));
  }

  if (filters.action && filters.action !== "all") {
    list = list.filter((e) => String(e.action).toLowerCase() === filters.action!.toLowerCase());
  }

  if (filters.status && filters.status !== "all") {
    list = list.filter((e) => e.status.toLowerCase() === filters.status!.toLowerCase());
  }

  if (filters.actor && filters.actor !== "all") {
    list = list.filter(
      (e) =>
        e.actor.id === filters.actor ||
        e.actor.name.toLowerCase() === filters.actor!.toLowerCase()
    );
  }

  if (filters.workspace && filters.workspace !== "all") {
    list = list.filter((e) => e.workspaceId === filters.workspace);
  }

  if (filters.repository && filters.repository !== "all") {
    list = list.filter((e) => e.repositoryId === filters.repository);
  }

  if (filters.dateRange && filters.dateRange !== "all") {
    const now = Date.now();
    if (filters.dateRange === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      list = list.filter((e) => new Date(e.time).getTime() >= todayStart.getTime());
    } else if (filters.dateRange === "7d") {
      const cutoff = now - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((e) => new Date(e.time).getTime() >= cutoff);
    } else if (filters.dateRange === "30d") {
      const cutoff = now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((e) => new Date(e.time).getTime() >= cutoff);
    } else if (filters.dateRange === "custom" && filters.customDate) {
      list = list.filter((e) => e.time.startsWith(filters.customDate!));
    }
  }

  return list;
}

export function updateUserSettings(settings: Partial<any>): any {
  const store = getStore();
  const oldSettings = { ...(store.userSettings || {}) };
  store.userSettings = {
    ...store.userSettings,
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  logActivity({
    module: "settings",
    action: "update",
    type: "settings_updated",
    title: "Updated User Preferences",
    description: `Updated configuration settings (${Object.keys(settings).join(", ")}).`,
    target: { type: "settings", id: "user_settings", name: "User Preferences" },
    href: "/settings",
    status: "success",
    details: {
      before: oldSettings,
      after: store.userSettings,
      changedFields: Object.keys(settings),
    },
  });

  saveStore(store);
  return store.userSettings;
}

export function logAuthSignIn(user: any, provider?: string): ActivityEvent {
  return logActivity({
    module: "auth",
    action: "login",
    type: "auth_sign_in",
    title: `User Signed In (${provider || "session"})`,
    description: `Authenticated session for ${user?.name || user?.email || "User"}.`,
    target: { type: "session", id: user?.id || "session", name: user?.name || "Active Session" },
    status: "success",
    actor: {
      id: user?.id || "usr_demo",
      name: user?.name || "Demo User",
      avatar: user?.avatar || DEMO_USER.avatar,
      email: user?.email,
      role: user?.role,
    },
    href: "/settings?tab=account",
  });
}

export function logAuthSignOut(user?: any): ActivityEvent {
  return logActivity({
    module: "auth",
    action: "logout",
    type: "auth_sign_out",
    title: "User Signed Out",
    description: "Terminated active authentication session.",
    target: { type: "session", id: "session", name: "Active Session" },
    status: "info",
    href: "/settings?tab=account",
  });
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



// ---------------------------------------------------------------------------
// Comprehensive Workspace Mutation Helpers
// ---------------------------------------------------------------------------

export function updateWorkspace(id: string, updates: Partial<any>): any {
  const store = getStore();
  const wsIndex = store.workspaces.findIndex((w) => w.id === id);
  if (wsIndex === -1) return null;
  const updated = {
    ...store.workspaces[wsIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  store.workspaces[wsIndex] = updated;

  logActivity({
    type: "workspace_updated",
    title: `Updated workspace "${updated.name}"`,
    description: "Workspace settings and details were updated.",
    href: `/workspaces/${id}`,
    linkText: "View Workspace",
  });

  saveStore(store);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("codeatlas:workspace-changed", { detail: { workspaceId: id } }));
  }
  return updated;
}

export function duplicateWorkspace(id: string): any {
  const store = getStore();
  const source = store.workspaces.find((w) => w.id === id);
  if (!source) return null;

  const newId = `ws_${Date.now()}`;
  const newName = `${source.name} (Copy)`;
  const newSlug = `${source.slug}-copy-${Math.random().toString(36).substring(2, 6)}`;

  const newWs = {
    ...source,
    id: newId,
    name: newName,
    slug: newSlug,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.workspaces.push(newWs);
  store.workspaceMembers[newId] = [
    {
      id: `mem_${Date.now()}`,
      workspaceId: newId,
      userId: "usr_demo",
      role: "owner",
      joinedAt: new Date().toISOString(),
      userName: "Demo User",
      userEmail: "demo@codeatlas.dev",
      userAvatar: DEMO_USER.avatar,
    },
  ];

  store.workspaceRepositories[newId] = [...(store.workspaceRepositories[id] || [])].map((r, i) => ({
    ...r,
    id: `wsr_${Date.now()}_${i}`,
    workspaceId: newId,
  }));

  logActivity({
    type: "workspace_created",
    title: `Duplicated workspace "${newName}"`,
    description: `Cloned configuration and repositories from "${source.name}".`,
    href: `/workspaces/${newId}`,
    linkText: "Open Copy",
  });

  saveStore(store);
  return newWs;
}

export function deleteWorkspace(id: string): boolean {
  const store = getStore();
  const ws = store.workspaces.find((w) => w.id === id);
  if (!ws) return false;

  store.workspaces = store.workspaces.filter((w) => w.id !== id);
  delete store.workspaceMembers[id];
  delete store.workspaceRepositories[id];
  delete store.workspaceAnnotations[id];
  delete store.workspaceArtifacts[id];
  delete store.workspaceActivities[id];
  delete store.discussions[id];

  logActivity({
    type: "workspace_deleted",
    title: `Deleted workspace "${ws.name}"`,
    description: "Workspace and its linked resources have been permanently removed.",
  });

  saveStore(store);

  // If deleted workspace was active, switch to first remaining
  if (typeof window !== "undefined") {
    const activeId = localStorage.getItem("codeatlas_active_workspace_id");
    if (activeId === id) {
      const fallback = store.workspaces[0]?.id || "ws_team_demo";
      localStorage.setItem("codeatlas_active_workspace_id", fallback);
      window.dispatchEvent(new CustomEvent("codeatlas:workspace-changed", { detail: { workspaceId: fallback } }));
    }
  }

  return true;
}

export function addWorkspaceMember(workspaceId: string, member: { email: string; role: string; name?: string }): any {
  const store = getStore();
  if (!store.workspaceMembers[workspaceId]) store.workspaceMembers[workspaceId] = [];

  const newMem = {
    id: `mem_${Date.now()}`,
    workspaceId,
    userId: `usr_${Math.random().toString(36).substring(2, 8)}`,
    role: member.role || "member",
    joinedAt: new Date().toISOString(),
    userName: member.name || member.email.split("@")[0],
    userEmail: member.email,
    userAvatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop`,
  };

  store.workspaceMembers[workspaceId].push(newMem);

  // Update member count on workspace
  const ws = store.workspaces.find((w) => w.id === workspaceId);
  if (ws) ws.memberCount = store.workspaceMembers[workspaceId].length;

  logActivity({
    type: "member_joined",
    title: `Added ${newMem.userName} to workspace`,
    description: `Assigned role: ${newMem.role}.`,
    href: `/workspaces/${workspaceId}`,
  });

  saveStore(store);
  return newMem;
}

export function updateWorkspaceMemberRole(workspaceId: string, userId: string, newRole: string): boolean {
  const store = getStore();
  const list = store.workspaceMembers[workspaceId] || [];
  const member = list.find((m) => m.userId === userId);
  if (!member) return false;

  member.role = newRole;

  logActivity({
    type: "role_changed",
    title: `Updated role for ${member.userName}`,
    description: `Role changed to ${newRole}.`,
    href: `/workspaces/${workspaceId}`,
  });

  saveStore(store);
  return true;
}



export function removeWorkspaceMember(workspaceId: string, userId: string): boolean {
  const store = getStore();
  const list = store.workspaceMembers[workspaceId] || [];
  const target = list.find((m) => m.userId === userId);
  if (!target) return false;

  store.workspaceMembers[workspaceId] = list.filter((m) => m.userId !== userId);

  const ws = store.workspaces.find((w) => w.id === workspaceId);
  if (ws) ws.memberCount = store.workspaceMembers[workspaceId].length;

  logActivity({
    type: "member_removed",
    title: `Removed ${target.userName} from workspace`,
    description: "Member access revoked.",
    href: `/workspaces/${workspaceId}`,
  });

  saveStore(store);
  return true;
}



export function addWorkspaceRepository(workspaceId: string, repositoryId: string): any {
  const store = getStore();
  if (!store.workspaceRepositories[workspaceId]) store.workspaceRepositories[workspaceId] = [];

  const existing = store.workspaceRepositories[workspaceId].find((r) => r.repositoryId === repositoryId);
  if (existing) return existing;

  const item = {
    id: `wsr_${Date.now()}`,
    workspaceId,
    repositoryId,
    addedBy: "usr_demo",
    addedAt: new Date().toISOString(),
  };

  store.workspaceRepositories[workspaceId].push(item);

  const ws = store.workspaces.find((w) => w.id === workspaceId);
  if (ws) ws.repoCount = store.workspaceRepositories[workspaceId].length;

  const repo = store.repositories.find((r) => r.id === repositoryId);
  logActivity({
    type: "repo_connected",
    title: `Connected ${repo?.name || repositoryId} to workspace`,
    description: "Repository added to shared intelligence workspace.",
    href: `/workspaces/${workspaceId}`,
  });

  saveStore(store);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("codeatlas:repositories-changed"));
  }
  return item;
}

export function removeWorkspaceRepository(workspaceId: string, repositoryId: string): boolean {
  const store = getStore();
  const list = store.workspaceRepositories[workspaceId] || [];
  store.workspaceRepositories[workspaceId] = list.filter((r) => r.repositoryId !== repositoryId);

  const ws = store.workspaces.find((w) => w.id === workspaceId);
  if (ws) ws.repoCount = store.workspaceRepositories[workspaceId].length;

  const repo = store.repositories.find((r) => r.id === repositoryId);
  logActivity({
    type: "repo_disconnected",
    title: `Removed ${repo?.name || repositoryId} from workspace`,
    description: "Repository disconnected from this workspace.",
    href: `/workspaces/${workspaceId}`,
  });

  saveStore(store);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("codeatlas:repositories-changed"));
  }
  return true;
}

export function reindexWorkspaceRepository(workspaceId: string, repositoryId: string): any {
  const store = getStore();
  const repo = store.repositories.find((r) => r.id === repositoryId);
  if (repo) {
    repo.lastAnalyzed = "Just now";
    repo.lastIndexed = "Just now";
    repo.status = "ready";
    repo.progress = 100;
  }

  logActivity({
    module: "indexing",
    action: "index",
    type: "indexing_completed",
    title: `Re-indexed ${repo?.name || repositoryId}`,
    description: "Full AST deterministic symbol graph refreshed.",
    href: `/repositories/${repositoryId}`,
    target: { type: "repository", id: repositoryId, name: repo?.name || repositoryId },
    repositoryId,
    workspaceId,
  });

  saveStore(store);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("codeatlas:repositories-changed"));
  }
  return repo;
}

export function reindexRepository(repositoryId: string): any {
  return reindexWorkspaceRepository("ws_team_demo", repositoryId);
}

export function createWorkspaceInvitation(workspaceId: string, email: string, role: string): any {
  const store = getStore();
  const ws = store.workspaces.find((w) => w.id === workspaceId);
  const token = `invite_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const inv = {
    id: `inv_${Date.now()}`,
    workspaceId,
    workspaceName: ws?.name || "Workspace",
    email,
    role: role || "member",
    token,
    status: "pending",
    invitedBy: "usr_demo",
    invitedByName: "Demo User",
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  store.invitations = [inv, ...(store.invitations || [])];

  addNotification({
    title: `Invitation created for ${email}`,
    description: `Invite link generated for role: ${role}.`,
    href: `/workspaces/${workspaceId}`,
  });

  logActivity({
    type: "invitation_sent",
    title: `Invited ${email} to ${ws?.name || "workspace"}`,
    description: `Role: ${role}.`,
    href: `/workspaces/${workspaceId}`,
  });

  saveStore(store);
  return inv;
}

export function revokeWorkspaceInvitation(invitationId: string): boolean {
  const store = getStore();
  store.invitations = (store.invitations || []).filter((i) => i.id !== invitationId && i.token !== invitationId);
  saveStore(store);
  return true;
}



export function acceptWorkspaceInvitation(token: string, user?: any): any {
  const store = getStore();
  const inv = (store.invitations || []).find((i) => i.token === token);
  if (!inv) return null;

  inv.status = "accepted";
  const ws = store.workspaces.find((w) => w.id === inv.workspaceId);

  // Add user to workspace members
  if (inv.workspaceId) {
    if (!store.workspaceMembers[inv.workspaceId]) store.workspaceMembers[inv.workspaceId] = [];
    const exists = store.workspaceMembers[inv.workspaceId].some((m) => m.userEmail === inv.email || m.userId === user?.id);
    if (!exists) {
      store.workspaceMembers[inv.workspaceId].push({
        id: `mem_${Date.now()}`,
        workspaceId: inv.workspaceId,
        userId: user?.id || `usr_${Math.random().toString(36).substring(2, 8)}`,
        role: inv.role || "member",
        joinedAt: new Date().toISOString(),
        userName: user?.name || inv.email.split("@")[0],
        userEmail: inv.email,
        userAvatar: user?.avatar || DEMO_USER.avatar,
      });
      if (ws) ws.memberCount = store.workspaceMembers[inv.workspaceId].length;
    }
  }

  logActivity({
    type: "member_joined",
    title: `Joined workspace "${ws?.name || "Workspace"}"`,
    description: `Accepted invite as ${inv.role}.`,
    href: `/workspaces/${inv.workspaceId}`,
  });

  addNotification({
    title: `Welcome to ${ws?.name || "Workspace"}!`,
    description: "You have successfully joined the team workspace.",
    href: `/workspaces/${inv.workspaceId}`,
  });

  saveStore(store);

  // Switch active workspace
  if (typeof window !== "undefined" && inv.workspaceId) {
    localStorage.setItem("codeatlas_active_workspace_id", inv.workspaceId);
    window.dispatchEvent(new CustomEvent("codeatlas:workspace-changed", { detail: { workspaceId: inv.workspaceId } }));
  }

  return { invitation: inv, workspace: ws };
}

export function createDiscussion(workspaceId: string, thread: any): any {
  const store = getStore();
  if (!store.discussions[workspaceId]) store.discussions[workspaceId] = [];

  const newThread = {
    id: `disc_${Date.now()}`,
    workspaceId,
    title: thread.title,
    body: thread.body,
    repositoryId: thread.repositoryId || "sample-project",
    filePath: thread.filePath || "",
    line: thread.line || undefined,
    authorId: "usr_demo",
    authorName: "Demo User",
    authorAvatar: DEMO_USER.avatar,
    status: "open",
    createdAt: new Date().toISOString(),
    replies: [],
    reactions: {},
  };

  store.discussions[workspaceId].unshift(newThread);

  logActivity({
    type: "discussion_created",
    title: `Started discussion: "${thread.title}"`,
    description: `Thread opened on ${thread.filePath || "workspace"}.`,
    href: `/workspaces/${workspaceId}?tab=discussions`,
  });

  saveStore(store);
  return newThread;
}

export function replyToDiscussion(workspaceId: string, threadId: string, replyText: string): any {
  const store = getStore();
  const list = store.discussions[workspaceId] || [];
  const thread = list.find((t) => t.id === threadId);
  if (!thread) return null;

  const reply = {
    id: `rep_${Date.now()}`,
    authorId: "usr_demo",
    authorName: "Demo User",
    authorAvatar: DEMO_USER.avatar,
    body: replyText,
    createdAt: new Date().toISOString(),
  };

  if (!thread.replies) thread.replies = [];
  thread.replies.push(reply);

  saveStore(store);
  return reply;
}

export function reactToDiscussion(workspaceId: string, threadId: string, emoji: string, userId: string = "usr_demo"): any {
  const store = getStore();
  const list = store.discussions[workspaceId] || [];
  const thread = list.find((t) => t.id === threadId);
  if (!thread) return null;

  if (!thread.reactions) thread.reactions = {};
  if (!thread.reactions[emoji]) thread.reactions[emoji] = [];

  if (thread.reactions[emoji].includes(userId)) {
    thread.reactions[emoji] = thread.reactions[emoji].filter((u: string) => u !== userId);
  } else {
    thread.reactions[emoji].push(userId);
  }

  saveStore(store);
  return thread.reactions;
}

export function toggleDiscussionStatus(workspaceId: string, threadId: string): any {
  const store = getStore();
  const list = store.discussions[workspaceId] || [];
  const thread = list.find((t) => t.id === threadId);
  if (!thread) return null;

  thread.status = thread.status === "open" ? "resolved" : "open";
  saveStore(store);
  return thread;
}

export function createAnnotation(workspaceId: string, annotation: any): any {
  const store = getStore();
  if (!store.workspaceAnnotations[workspaceId]) store.workspaceAnnotations[workspaceId] = [];

  // Extract code snippet from repositoryFiles if available
  let snippet = annotation.codeSnippet || "";
  if (!snippet && annotation.repositoryId && annotation.filePath && store.repositoryFiles?.[annotation.repositoryId]?.[annotation.filePath]) {
    const lines = store.repositoryFiles[annotation.repositoryId][annotation.filePath].code.split("\n");
    const start = Math.max(0, (annotation.startLine || 1) - 1);
    const end = Math.min(lines.length, annotation.endLine || start + 5);
    snippet = lines.slice(start, end).join("\n");
  }

  const newAnno = {
    id: `anno_${Date.now()}`,
    workspaceId,
    repositoryId: annotation.repositoryId || "sample-project",
    filePath: annotation.filePath || "src/services/auth.ts",
    startLine: Number(annotation.startLine) || 1,
    endLine: Number(annotation.endLine) || 10,
    symbolName: annotation.symbolName || "function",
    category: annotation.category || "architecture",
    title: annotation.title || "Code Note",
    content: annotation.content || "",
    codeSnippet: snippet,
    tags: annotation.tags || ["note"],
    authorId: "usr_demo",
    authorName: "Demo User",
    authorAvatar: DEMO_USER.avatar,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.workspaceAnnotations[workspaceId].unshift(newAnno);

  logActivity({
    type: "annotation_added",
    title: `Added code note on ${newAnno.filePath}`,
    description: `Lines ${newAnno.startLine}-${newAnno.endLine}: ${newAnno.title}.`,
    href: `/repositories/${newAnno.repositoryId}`,
  });

  saveStore(store);
  return newAnno;
}

export function updateAnnotation(workspaceId: string, id: string, updates: Partial<any>): any {
  const store = getStore();
  const list = store.workspaceAnnotations[workspaceId] || [];
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const updated = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  store.workspaceAnnotations[workspaceId][index] = updated;
  saveStore(store);
  return updated;
}

export function deleteAnnotation(workspaceId: string, id: string): boolean {
  const store = getStore();
  const list = store.workspaceAnnotations[workspaceId] || [];
  store.workspaceAnnotations[workspaceId] = list.filter((a) => a.id !== id);
  saveStore(store);
  return true;
}



// ---------------------------------------------------------------------------
// Multi-Repo & Refactoring Mutation Helpers
// ---------------------------------------------------------------------------

export function addRefactoringProposal(proposal: {
  title: string;
  repositoryId?: string;
  filePath?: string;
  targetFile?: string;
  operationType?: string;
  operation?: string;
  symbolName?: string;
  description?: string;
  confidenceScore?: number;
  expectedDebtReduction?: number;
  sourceCodeSnippet?: string;
  suggestedReplacement?: string;
}): any {
  const store = getStore();
  if (!store.refactoringProposals) store.refactoringProposals = [];

  const newProp = {
    id: `prop_refactor_${Date.now()}`,
    repositoryId: proposal.repositoryId || "shared-core-lib",
    userId: "usr_demo",
    title: proposal.title,
    operationType: proposal.operationType || "extract_function",
    operation: proposal.operation || "extract_function",
    filePath: proposal.filePath || "src/validators.ts",
    targetFile: proposal.targetFile || "src/validators.ts",
    symbolName: proposal.symbolName || "consolidateFunction",
    description: proposal.description || "Consolidate duplicate implementations into shared-core-lib.",
    confidenceScore: proposal.confidenceScore || 96,
    expectedDebtReduction: proposal.expectedDebtReduction || 15,
    sourceCodeSnippet: proposal.sourceCodeSnippet || "",
    suggestedReplacement: proposal.suggestedReplacement || "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  store.refactoringProposals.unshift(newProp);

  logActivity({
    type: "refactoring_proposed",
    title: `Created Refactoring Proposal: ${newProp.title}`,
    description: `Targeting consolidation in ${newProp.repositoryId}. Reduces cross-codebase duplication.`,
    status: "info",
    href: "/refactoring",
    linkText: "View on Refactoring & Debt",
  });

  saveStore(store);
  return newProp;
}

export function updateRepositoryFile(repoId: string, filePath: string, newCode: string): void {
  const store = getStore();
  if (!store.repositoryFiles) store.repositoryFiles = {};
  if (!store.repositoryFiles[repoId]) store.repositoryFiles[repoId] = {};

  store.repositoryFiles[repoId][filePath] = {
    code: newCode,
    language: filePath.endsWith(".json")
      ? "json"
      : filePath.endsWith(".py")
      ? "python"
      : filePath.endsWith(".go")
      ? "go"
      : "typescript",
  };

  logActivity({
    type: "manifest_aligned",
    title: `Aligned package version in ${repoId}`,
    description: `Updated ${filePath} to resolve dependency version conflict across workspaces.`,
    status: "success",
    href: `/repositories/${repoId}`,
    linkText: "Inspect Repo",
  });

  saveStore(store);
}

export function cacheMultiRepoAnalysis(analysis: any): void {
  const store = getStore();
  store.multiRepoAnalysis = analysis;
  saveStore(store);
}

export function getCachedMultiRepoAnalysis(): any {
  const store = getStore();
  return store.multiRepoAnalysis || null;
}

// ---------------------------------------------------------------------------
// AI AGENT WORKSPACE STORE HELPERS
// ---------------------------------------------------------------------------

export function getAgentRuns(): AgentRun[] {
  const store = getStore();
  return store.agentRuns ? [...store.agentRuns] : [];
}

export function getAgentRun(id: string): AgentRun | null {
  const store = getStore();
  return (store.agentRuns || []).find((r: AgentRun) => r.id === id) || null;
}

export function addAgentRun(run: AgentRun): void {
  const store = getStore();
  if (!store.agentRuns) store.agentRuns = [];
  store.agentRuns.unshift(run);

  logActivity({
    type: "agent_run",
    title: `Launched Agent Run: ${run.title || run.taskPrompt}`,
    description: `Workflow '${run.templateName || run.templateId}' initiated on ${run.repositoryName || run.repositoryId}.`,
    status: "info",
    href: `/agents?id=${run.id}`,
    linkText: "View Agent Run",
  });

  saveStore(store);
}

export function updateAgentRun(runId: string, updates: Partial<AgentRun>): void {
  const store = getStore();
  if (!store.agentRuns) return;
  const idx = store.agentRuns.findIndex((r: AgentRun) => r.id === runId);
  if (idx !== -1) {
    store.agentRuns[idx] = {
      ...store.agentRuns[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStore(store);
  }
}

export function deleteAgentRun(runId: string): void {
  const store = getStore();
  if (!store.agentRuns) return;
  store.agentRuns = store.agentRuns.filter((r: AgentRun) => r.id !== runId);
  saveStore(store);
}

export function getAgentWorkflows(): WorkflowTemplate[] {
  const store = getStore();
  return store.agentWorkflows || STANDARD_WORKFLOWS;
}

export function saveCustomWorkflow(workflow: WorkflowTemplate): void {
  const store = getStore();
  if (!store.agentWorkflows) store.agentWorkflows = [...STANDARD_WORKFLOWS];
  const idx = store.agentWorkflows.findIndex((w: any) => w.id === workflow.id);
  if (idx !== -1) {
    store.agentWorkflows[idx] = workflow;
  } else {
    store.agentWorkflows.push(workflow);
  }

  logActivity({
    type: "workflow_created",
    title: `Custom Workflow created: ${workflow.name}`,
    description: `Saved customized agent workflow with ${workflow.typicalSteps?.length || 7} pipeline steps.`,
    status: "success",
    href: "/agents",
  });

  saveStore(store);
}

export function getAgentPolicy(workspaceId: string = "ws_team_demo"): AgentPolicy {
  const store = getStore();
  const existing = store.agentPolicies?.[workspaceId];
  if (existing) return existing;

  return {
    workspaceId,
    requireApproval: true,
    allowedTemplates: [
      "fix_bug",
      "unit_tests",
      "documentation",
      "security_audit",
      "upgrade_dependency",
      "refactor_function",
      "explain_module",
    ],
    maxFilesPerRun: 5,
    blockedPaths: [".env", "secrets/", ".pem", "id_rsa"],
    allowDependencyUpgrades: true,
    updatedAt: new Date().toISOString(),
  };
}

export function saveAgentPolicy(workspaceId: string, policy: Partial<AgentPolicy>): void {
  const store = getStore();
  if (!store.agentPolicies) store.agentPolicies = {};

  const current = getAgentPolicy(workspaceId);
  const updated: AgentPolicy = {
    ...current,
    ...policy,
    workspaceId,
    updatedAt: new Date().toISOString(),
  };

  store.agentPolicies[workspaceId] = updated;

  logActivity({
    type: "policy_updated",
    title: `Agent Safety Policy updated for ${workspaceId}`,
    description: `Enforcing requireApproval=${updated.requireApproval}, maxFiles=${updated.maxFilesPerRun}, blockedPaths=[${updated.blockedPaths.join(", ")}].`,
    status: "info",
    href: "/agents",
  });

  saveStore(store);
}

export function applyAgentDiffToStore(run: AgentRun): void {
  const store = getStore();
  if (!run.diff) return;

  const repoId = run.repositoryId;
  const filePath = run.diff.file;
  const newCode = run.diff.newContent;

  // 1. Update repo file
  if (!store.repositoryFiles) store.repositoryFiles = {};
  if (!store.repositoryFiles[repoId]) store.repositoryFiles[repoId] = {};
  store.repositoryFiles[repoId][filePath] = {
    code: newCode,
    language: filePath.endsWith(".json")
      ? "json"
      : filePath.endsWith(".py")
      ? "python"
      : filePath.endsWith(".go")
      ? "go"
      : "typescript",
  };

  // 2. Create Pull Request
  if (!store.pullRequests) store.pullRequests = [];
  const prNumber = store.pullRequests.length + 101;
  const prId = `pr_agent_${Date.now()}`;

  const newPr = {
    id: prId,
    number: prNumber,
    title: `[Agent] ${run.title || run.taskPrompt}`,
    body: `### Automated Engineering Changes\nGenerated by CodeAtlas AI Agent (${run.templateName || run.agentType}).\n\n**Instructions:**\n${run.instructions || run.taskPrompt}\n\n**Summary:**\n- Target file: \`${filePath}\`\n- Additions: +${run.diff.additions}\n- Deletions: -${run.diff.deletions}\n- Safety policy verified.`,
    author: {
      name: run.startedBy?.name || "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    baseBranch: "main",
    headBranch: `agent/${run.templateId || "fix"}-${Date.now().toString(36)}`,
    baseSha: "30e6d94e",
    headSha: "a8f7b2c1",
    state: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    additions: run.diff.additions,
    deletions: run.diff.deletions,
    changedFilesCount: 1,
    files: [
      {
        filename: filePath,
        status: "modified",
        additions: run.diff.additions,
        deletions: run.diff.deletions,
        changes: run.diff.additions + run.diff.deletions,
        patch: run.diff.patch,
      },
    ],
  };

  store.pullRequests.unshift(newPr);

  // 3. Mark run completed with PR link
  if (store.agentRuns) {
    const rIdx = store.agentRuns.findIndex((r: AgentRun) => r.id === run.id);
    if (rIdx !== -1) {
      store.agentRuns[rIdx].status = "completed";
      store.agentRuns[rIdx].completedAt = new Date().toISOString();
      store.agentRuns[rIdx].pullRequestId = prId;
      if (store.agentRuns[rIdx].steps?.[6]) {
        store.agentRuns[rIdx].steps[6].status = "completed";
        store.agentRuns[rIdx].steps[6].completedAt = new Date().toISOString();
      }
    }
  }

  // 4. Activity & Notification
  const agentDiffString =
    run.diff?.patch ||
    (run.diff?.newContent
      ? `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,5 +1,6 @@\n+${run.diff.newContent.slice(0, 500)}`
      : undefined);

  logActivity({
    module: "agents",
    action: "apply",
    type: "agent_patch_applied",
    title: `Agent Applied Patch: ${run.title || run.taskPrompt}`,
    description: `Applied approved changes to ${filePath} and opened PR #${prNumber}.`,
    status: "success",
    href: `/code-review?pr=${prId}`,
    linkText: "View Pull Request",
    target: { type: "agent", id: run.id, name: run.title || run.templateName || "Engineering Agent", path: filePath },
    repositoryId: repoId,
    details: {
      diff: agentDiffString,
    },
  });

  if (!store.notifications) store.notifications = [];
  store.notifications.unshift({
    id: `notif_${Date.now()}`,
    title: `Agent Run Completed: ${run.title || run.taskPrompt}`,
    message: `Patch approved and applied. Pull Request #${prNumber} is ready for review in Code Review.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: "agent_run",
  });

  saveStore(store);
}

// ---------------------------------------------------------------------------
// Visual Code Explorer History Helpers
// ---------------------------------------------------------------------------

export function getExplorerHistory(): CodeAnalysisHistoryItem[] {
  const store = getStore();
  return store.explorerHistory || [];
}

export function addExplorerHistoryItem(
  item: Omit<CodeAnalysisHistoryItem, "id" | "timestamp">
): CodeAnalysisHistoryItem {
  const store = getStore();
  if (!store.explorerHistory) store.explorerHistory = [];

  const newItem: CodeAnalysisHistoryItem = {
    ...item,
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  store.explorerHistory.unshift(newItem);

  if (store.explorerHistory.length > 40) {
    store.explorerHistory = store.explorerHistory.slice(0, 40);
  }

  saveStore(store);
  return newItem;
}

export function updateExplorerHistoryItem(
  id: string,
  updates: Partial<CodeAnalysisHistoryItem>
): void {
  const store = getStore();
  if (!store.explorerHistory) return;

  const idx = store.explorerHistory.findIndex((h) => h.id === id);
  if (idx !== -1) {
    store.explorerHistory[idx] = {
      ...store.explorerHistory[idx],
      ...updates,
    };
    saveStore(store);
  }
}

export function deleteExplorerHistoryItem(id: string): void {
  const store = getStore();
  if (!store.explorerHistory) return;

  store.explorerHistory = store.explorerHistory.filter((h) => h.id !== id);
  saveStore(store);
}

export function clearExplorerHistory(): void {
  const store = getStore();
  store.explorerHistory = [];
  saveStore(store);
}

// ---------------------------------------------------------------------------
// Refactoring & Technical Debt Store Helpers
// ---------------------------------------------------------------------------

export function getTechnicalDebtOverview(repoId?: string): any {
  const store = getStore();
  if (!store.debtOverviews) store.debtOverviews = {};
  if (repoId && repoId !== "workspace_all") {
    return store.debtOverviews[repoId] || null;
  }
  return store.debtOverviews["workspace_all"] || store.debtOverviews["sample-project"] || null;
}

export function saveTechnicalDebtOverview(repoId: string, overview: any): void {
  const store = getStore();
  if (!store.debtOverviews) store.debtOverviews = {};
  store.debtOverviews[repoId] = overview;
  saveStore(store);
}

export function getRefactoringProposals(repoId?: string): any[] {
  const store = getStore();
  if (!store.refactoringProposals) store.refactoringProposals = [];
  if (repoId && repoId !== "workspace_all") {
    return store.refactoringProposals.filter((p: any) => p.repositoryId === repoId);
  }
  return store.refactoringProposals;
}

export function saveRefactoringProposal(proposal: any): void {
  const store = getStore();
  if (!store.refactoringProposals) store.refactoringProposals = [];
  const idx = store.refactoringProposals.findIndex((p: any) => p.id === proposal.id);
  if (idx !== -1) {
    store.refactoringProposals[idx] = proposal;
  } else {
    store.refactoringProposals.unshift(proposal);
  }
  saveStore(store);
}

export function deleteRefactoringProposal(proposalId: string): void {
  const store = getStore();
  if (!store.refactoringProposals) return;
  store.refactoringProposals = store.refactoringProposals.filter((p: any) => p.id !== proposalId);
  saveStore(store);
}

export function updateRefactoringProposalStatus(proposalId: string, status: string): void {
  const store = getStore();
  if (!store.refactoringProposals) return;
  const p = store.refactoringProposals.find((x: any) => x.id === proposalId);
  if (p) {
    p.status = status;
    p.updatedAt = new Date().toISOString();
    saveStore(store);
  }
}

export function ignoreQualityFinding(findingId: string, reason: string, repoId?: string): void {
  const store = getStore();
  const targetRepo = repoId && repoId !== "workspace_all" ? repoId : "sample-project";
  const overview = store.debtOverviews?.[targetRepo];
  if (overview && overview.findings) {
    const finding = overview.findings.find((f: any) => f.id === findingId);
    if (finding) {
      finding.status = "ignored";
      finding.ignoreReason = reason || "Ignored by user";
    }
  }
  // Also check workspace_all
  const wsOverview = store.debtOverviews?.["workspace_all"];
  if (wsOverview && wsOverview.findings) {
    const finding = wsOverview.findings.find((f: any) => f.id === findingId);
    if (finding) {
      finding.status = "ignored";
      finding.ignoreReason = reason || "Ignored by user";
    }
  }
  saveStore(store);
}

export function restoreQualityFinding(findingId: string, repoId?: string): void {
  const store = getStore();
  const targetRepo = repoId && repoId !== "workspace_all" ? repoId : "sample-project";
  const overview = store.debtOverviews?.[targetRepo];
  if (overview && overview.findings) {
    const finding = overview.findings.find((f: any) => f.id === findingId);
    if (finding) {
      finding.status = "open";
      delete finding.ignoreReason;
    }
  }
  const wsOverview = store.debtOverviews?.["workspace_all"];
  if (wsOverview && wsOverview.findings) {
    const finding = wsOverview.findings.find((f: any) => f.id === findingId);
    if (finding) {
      finding.status = "open";
      delete finding.ignoreReason;
    }
  }
  saveStore(store);
}

export function getRefactoringHistory(repoId?: string): any[] {
  const store = getStore();
  if (!store.refactoringHistory) store.refactoringHistory = [];
  if (repoId && repoId !== "workspace_all") {
    return store.refactoringHistory.filter((h: any) => h.repositoryId === repoId);
  }
  return store.refactoringHistory;
}

export function deleteRefactoringHistoryItem(id: string): void {
  const store = getStore();
  if (!store.refactoringHistory) return;
  store.refactoringHistory = store.refactoringHistory.filter((h: any) => h.id !== id);
  saveStore(store);
}

// ==========================================
// 19. AI Debugger Helpers & Persistence
// ==========================================

export function getDebugInvestigations(): any[] {
  const store = getStore();
  if (!store.debugInvestigations) store.debugInvestigations = [];
  return store.debugInvestigations;
}

export function getDebugInvestigation(id: string): any | undefined {
  const store = getStore();
  return (store.debugInvestigations || []).find((inv: any) => inv.id === id);
}

export function saveDebugInvestigation(inv: any): void {
  const store = getStore();
  if (!store.debugInvestigations) store.debugInvestigations = [];
  const existingIdx = store.debugInvestigations.findIndex((i: any) => i.id === inv.id);
  if (existingIdx !== -1) {
    store.debugInvestigations[existingIdx] = { ...store.debugInvestigations[existingIdx], ...inv, updatedAt: new Date().toISOString() };
  } else {
    store.debugInvestigations.unshift({
      ...inv,
      createdAt: inv.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Also log activity on creation if not already logged
  if (existingIdx === -1) {
    logActivity({
      type: "debug_investigation_started",
      title: "Started Investigation",
      description: `Investigating ${inv.errorType}: ${inv.title.slice(0, 50)}`,
      href: `/debug?id=${inv.id}`,
      status: "success",
    });
  }

  saveStore(store);
}

export function deleteDebugInvestigation(id: string): void {
  const store = getStore();
  if (!store.debugInvestigations) return;
  const inv = store.debugInvestigations.find((i: any) => i.id === id);
  store.debugInvestigations = store.debugInvestigations.filter((i: any) => i.id !== id);
  if (store.debugFollowUps && store.debugFollowUps[id]) {
    delete store.debugFollowUps[id];
  }
  if (inv) {
    logActivity({
      type: "debug_investigation_deleted",
      title: "Deleted Investigation",
      description: `Deleted investigation session for ${inv.errorType}.`,
      href: "/debug",
      status: "warning",
    });
  }
  saveStore(store);
}

export function updateInvestigationStatus(id: string, status: string, note?: string): void {
  const store = getStore();
  const inv = (store.debugInvestigations || []).find((i: any) => i.id === id);
  if (inv) {
    inv.status = status;
    if (note) inv.resolutionNote = note;
    inv.updatedAt = new Date().toISOString();
    logActivity({
      type: "debug_status_updated",
      title: status === "resolved" ? "Resolved Error" : "Updated Investigation",
      description: `Marked investigation as ${status}.${note ? " Note: " + note : ""}`,
      href: `/debug?id=${id}`,
      status: "success",
    });
    saveStore(store);
  }
}

export function toggleHypothesisStatus(
  invId: string,
  hypothesisId: string,
  action: "confirmed" | "ruled_out" | "investigated"
): void {
  const store = getStore();
  const inv = (store.debugInvestigations || []).find((i: any) => i.id === invId);
  if (!inv || !inv.hypotheses) return;

  const hypo = inv.hypotheses.find((h: any) => h.id === hypothesisId);
  if (hypo) {
    if (action === "confirmed") {
      inv.hypotheses.forEach((h: any) => (h.isConfirmedRootCause = false));
      hypo.isConfirmedRootCause = true;
      hypo.isInvestigated = true;
      inv.confirmedRootCauseId = hypo.id;
      inv.confirmedRootCauseSummary = hypo.title;
      inv.status = "root_cause_confirmed";
    } else if (action === "ruled_out") {
      hypo.isConfirmedRootCause = false;
      hypo.isInvestigated = true;
      hypo.isRuledOut = !hypo.isRuledOut;
      if (inv.confirmedRootCauseId === hypo.id) {
        inv.confirmedRootCauseId = undefined;
        inv.confirmedRootCauseSummary = undefined;
      }
    } else if (action === "investigated") {
      hypo.isInvestigated = !hypo.isInvestigated;
    }
    inv.updatedAt = new Date().toISOString();
    saveStore(store);
  }
}

export function applyDebugFixToStore(
  invId: string,
  fixId: string
): { success: boolean; message: string; prId: string; prNumber: number } {
  const store = getStore();
  const inv = (store.debugInvestigations || []).find((i: any) => i.id === invId);
  if (!inv) throw new Error("Investigation session not found");

  const fixes = inv.suggestedFixes || inv.proposedFixes || [];
  const fix = fixes.find((f: any) => f.id === fixId);
  if (!fix) throw new Error("Repair fix suggestion not found");

  const repoId = inv.repositoryId || "sample-project";

  // 1. Patch file if available in store.repositoryFiles
  if (store.repositoryFiles && store.repositoryFiles[repoId] && fix.filePath) {
    let matchedKey: string | null = null;
    const files = store.repositoryFiles[repoId];
    if (files[fix.filePath]) {
      matchedKey = fix.filePath;
    } else {
      const keys = Object.keys(files);
      for (const k of keys) {
        if (k.endsWith(fix.filePath) || fix.filePath.endsWith(k) || k.split("/").pop() === fix.filePath.split("/").pop()) {
          matchedKey = k;
          break;
        }
      }
    }

    if (matchedKey && files[matchedKey]) {
      const oldCode = files[matchedKey].code;
      if (fix.originalSnippet && oldCode.includes(fix.originalSnippet)) {
        files[matchedKey].code = oldCode.replace(fix.originalSnippet, fix.replacementSnippet);
      } else {
        // Line-based replacement if originalSnippet doesn't match directly
        const lines = oldCode.split("\n");
        const s = Math.max(0, (fix.startLine || 1) - 1);
        const e = Math.max(s + 1, (fix.endLine || fix.startLine || 1));
        lines.splice(s, e - s, fix.replacementSnippet);
        files[matchedKey].code = lines.join("\n");
      }
    }
  }

  // 2. Create Pull Request
  if (!store.pullRequests) store.pullRequests = [];
  const prNum = 100 + store.pullRequests.length + 1;
  const prId = `pr_${prNum}`;

  const newPr = {
    id: prId,
    number: prNum,
    title: `fix(debug): ${fix.title}`,
    body: "Automated bug fix generated by CodeAtlas AI Debugger for " + inv.errorType + ": " + inv.title + ".\n\n### Target File: " + fix.filePath + "\n\n### Diff Applied:\n" + (fix.patchDiff || fix.replacementSnippet),
    author: {
      name: "AI Debugger",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    baseBranch: "main",
    headBranch: `fix/debug-${fix.id}`,
    baseSha: "30e6d94e",
    headSha: "a8f7b2c1",
    state: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    additions: 3,
    deletions: 1,
    changedFilesCount: 1,
    files: [
      {
        filename: fix.filePath,
        status: "modified",
        additions: 3,
        deletions: 1,
        changes: 4,
        patch: fix.patchDiff || `@@ -1,1 +1,3 @@\n+${fix.replacementSnippet}`,
      },
    ],
  };

  store.pullRequests.unshift(newPr);

  // 3. Mark fix applied & investigation resolved
  fix.isApplied = true;
  fix.appliedAt = new Date().toISOString();
  inv.status = "resolved";
  inv.resolutionNote = `Applied fix "${fix.title}" and opened Pull Request #${prNum}.`;
  inv.updatedAt = new Date().toISOString();

  // 4. Log to Activity
  logActivity({
    type: "debug_fix_applied",
    title: "Applied Fix",
    description: `Applied fix "${fix.title}" and opened PR #${prNum}.`,
    href: `/code-review?pr=${prId}`,
    status: "success",
  });

  saveStore(store);
  return {
    success: true,
    message: `Patch applied to ${fix.filePath} and PR #${prNum} opened in Code Review.`,
    prId,
    prNumber: prNum,
  };
}

export function addTestRecommendationToStore(
  repoId: string,
  testPath: string,
  testCode: string
): { success: boolean; message: string } {
  const store = getStore();
  const targetRepo = repoId || "sample-project";
  if (!store.repositoryFiles) store.repositoryFiles = {};
  if (!store.repositoryFiles[targetRepo]) store.repositoryFiles[targetRepo] = {};

  store.repositoryFiles[targetRepo][testPath] = {
    language: testPath.endsWith(".py") ? "python" : testPath.endsWith(".go") ? "go" : testPath.endsWith(".java") ? "java" : "typescript",
    code: testCode,
  };

  logActivity({
    type: "debug_test_added",
    title: "Added Test Suite",
    description: `Added regression test suite to ${testPath}.`,
    href: `/visual-explorer?repo=${targetRepo}&file=${encodeURIComponent(testPath)}`,
    status: "success",
  });

  saveStore(store);
  return {
    success: true,
    message: `Regression test suite saved to ${testPath}.`,
  };
}

export function getDebugFollowUps(invId: string): any[] {
  const store = getStore();
  if (!store.debugFollowUps) store.debugFollowUps = {};
  return store.debugFollowUps[invId] || [];
}

export function addDebugFollowUp(invId: string, followUp: any): void {
  const store = getStore();
  if (!store.debugFollowUps) store.debugFollowUps = {};
  if (!store.debugFollowUps[invId]) store.debugFollowUps[invId] = [];
  store.debugFollowUps[invId].push(followUp);
  saveStore(store);
}

// ---------------------------------------------------------------------------
// Architecture Persistence Helpers
// ---------------------------------------------------------------------------

export function saveArchitecturePositions(
  repoId: string,
  level: string,
  positions: Record<string, { x: number; y: number }>
): void {
  const store = getStore();
  if (!store.architectureNodePositions) store.architectureNodePositions = {};
  const key = `${repoId || "all"}_${level || "files"}`;
  store.architectureNodePositions[key] = {
    ...(store.architectureNodePositions[key] || {}),
    ...positions,
  };
  saveStore(store);
}

export function getArchitecturePositions(
  repoId: string,
  level: string
): Record<string, { x: number; y: number }> {
  const store = getStore();
  const key = `${repoId || "all"}_${level || "files"}`;
  return store.architectureNodePositions?.[key] || {};
}

export function saveArchitectureLayerOverride(
  repoId: string,
  itemPath: string,
  layer: string
): void {
  const store = getStore();
  if (!store.architectureLayerOverrides) store.architectureLayerOverrides = {};
  if (!store.architectureLayerOverrides[repoId]) store.architectureLayerOverrides[repoId] = {};
  store.architectureLayerOverrides[repoId][itemPath] = layer;

  logActivity({
    type: "architecture_layer_assigned",
    title: "Reassigned Architecture Layer",
    description: `Reassigned ${itemPath} to layer '${layer}' in ${repoId}.`,
    href: `/architecture?repo=${repoId}`,
    status: "success",
  });

  saveStore(store);
}

export function saveArchitectureLayerRules(repoId: string, rules: any[]): void {
  const store = getStore();
  if (!store.architectureLayerRules) store.architectureLayerRules = {};
  store.architectureLayerRules[repoId] = rules;

  logActivity({
    type: "architecture_rules_updated",
    title: "Updated Architecture Layer Rules",
    description: `Updated architectural boundary rules for ${repoId}.`,
    href: `/architecture?repo=${repoId}`,
    status: "success",
  });

  saveStore(store);
}

export function getArchitectureLayerRules(repoId: string): any[] | null {
  const store = getStore();
  return store.architectureLayerRules?.[repoId] || null;
}

export function saveArchitectureAiOverview(
  repoId: string,
  overview: { summary: string; mermaid: string; timestamp: string }
): void {
  const store = getStore();
  if (!store.architectureAiOverviews) store.architectureAiOverviews = {};
  store.architectureAiOverviews[repoId] = overview;
  saveStore(store);
}

export function getArchitectureAiOverview(
  repoId: string
): { summary: string; mermaid: string; timestamp: string } | null {
  const store = getStore();
  return store.architectureAiOverviews?.[repoId] || null;
}

// ---------------------------------------------------------------------------
// Change Impact Analysis Persistence & State Helpers
// ---------------------------------------------------------------------------

export function saveImpactAnalysis(analysis: SavedImpactAnalysis): void {
  const store = getStore();
  if (!store.impactAnalyses) store.impactAnalyses = [];
  
  const existingIdx = store.impactAnalyses.findIndex((a) => a.id === analysis.id);
  if (existingIdx >= 0) {
    store.impactAnalyses[existingIdx] = analysis;
  } else {
    store.impactAnalyses = [analysis, ...store.impactAnalyses];
  }

  logActivity({
    type: "impact_analyzed",
    title: `Analyzed Change Impact: ${analysis.targetSymbol || analysis.targetFile}`,
    description: `Computed blast radius: ${analysis.riskLevel} risk (${analysis.riskScore}/100) affecting ${analysis.summaryCounts.filesCount} file(s) across ${analysis.summaryCounts.reposCount} repo(s).`,
    href: `/change-impact?repo=${analysis.repositoryId}&file=${encodeURIComponent(analysis.targetFile)}${analysis.targetSymbol ? `&symbol=${encodeURIComponent(analysis.targetSymbol)}` : ""}`,
    status: analysis.riskLevel === "Critical" || analysis.riskLevel === "High" ? "warning" : "success",
  });

  saveStore(store);
}

export function getImpactAnalyses(): SavedImpactAnalysis[] {
  const store = getStore();
  return store.impactAnalyses || [];
}

export function deleteImpactAnalysis(id: string): void {
  const store = getStore();
  if (!store.impactAnalyses) return;
  store.impactAnalyses = store.impactAnalyses.filter((a) => a.id !== id);
  saveStore(store);
}

export function renameImpactAnalysis(id: string, newTitle: string): void {
  const store = getStore();
  if (!store.impactAnalyses) return;
  const item = store.impactAnalyses.find((a) => a.id === id);
  if (item) {
    item.title = newTitle;
    saveStore(store);
  }
}

// ---------------------------------------------------------------------------
// Pull Request & Code Review Persistence & State Helpers
// ---------------------------------------------------------------------------

export function getPullRequests(
  repoId?: string,
  sourceFilter?: string,
  tabFilter?: string
): any[] {
  const store = getStore();
  if (!store.pullRequests) store.pullRequests = [];

  let list = [...store.pullRequests];

  if (repoId && repoId !== "all" && repoId !== "workspace_all") {
    list = list.filter((p) => (p.repositoryId || "sample-project") === repoId);
  }

  if (sourceFilter && sourceFilter !== "all") {
    list = list.filter((p) => {
      const src = p.source || "Demo";
      return src.toLowerCase() === sourceFilter.toLowerCase();
    });
  }

  if (tabFilter && tabFilter !== "all") {
    switch (tabFilter) {
      case "open":
        list = list.filter((p) => p.state === "open");
        break;
      case "needs_review":
        list = list.filter((p) => p.state === "open" && (!p.reviewStatus || p.reviewStatus === "pending"));
        break;
      case "approved":
        list = list.filter((p) => p.reviewStatus === "approved");
        break;
      case "merged":
        list = list.filter((p) => p.state === "merged");
        break;
      case "closed":
        list = list.filter((p) => p.state === "closed");
        break;
    }
  }

  return list;
}

export function getPullRequestById(idOrNumber: string | number): any | null {
  const store = getStore();
  if (!store.pullRequests) return null;
  const strId = String(idOrNumber);
  return (
    store.pullRequests.find(
      (p) => p.id === strId || String(p.number) === strId || p.id === `pr_${strId}`
    ) || null
  );
}

export function createPullRequest(data: any): any {
  const store = getStore();
  if (!store.pullRequests) store.pullRequests = [];

  const prNumber = store.pullRequests.length > 0 ? Math.max(...store.pullRequests.map((p: any) => p.number || 100)) + 1 : 101;
  const prId = data.id || `pr_${prNumber}`;

  const newPr = {
    id: prId,
    number: prNumber,
    repositoryId: data.repositoryId || "sample-project",
    source: data.source || "Demo",
    title: data.title || `Update ${data.files?.[0]?.filename || "codebase"}`,
    body: data.body || "Pull request submitted for code review via CodeAtlas.",
    author: data.author || {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    baseBranch: data.baseBranch || "main",
    headBranch: data.headBranch || `patch-${Date.now().toString(36)}`,
    baseSha: data.baseSha || "30e6d94e",
    headSha: data.headSha || "a8f7b2c1",
    state: "open",
    reviewStatus: "pending",
    riskLevel: data.riskLevel || "Low",
    riskScore: data.riskScore || 20,
    labels: data.labels || ["review-needed"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    additions: data.additions || 10,
    deletions: data.deletions || 2,
    changedFilesCount: data.files?.length || 1,
    files: data.files || [],
    checklist: [
      { id: "chk_tests", label: "Tests added and passing", checked: false },
      { id: "chk_docs", label: "Documentation updated", checked: false },
      { id: "chk_secrets", label: "No secrets or API keys exposed", checked: true },
      { id: "chk_impact", label: "Impact analysis checked", checked: false },
    ],
    timeline: [
      {
        id: `tl_${Date.now()}`,
        type: "opened",
        title: `Opened pull request #${prNumber}`,
        actor: data.author || { name: "Alex Chen", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" },
        timestamp: new Date().toISOString(),
        description: `Created PR from ${data.headBranch || "patch"} into ${data.baseBranch || "main"}.`,
      },
    ],
    inlineComments: [],
    discussions: {},
    viewedFiles: {},
  };

  store.pullRequests.unshift(newPr);

  logActivity({
    type: "pr_opened",
    title: `Opened Pull Request #${prNumber}`,
    description: `Submitted "${newPr.title}" for review in ${newPr.repositoryId}.`,
    href: `/code-review?pr=${newPr.id}`,
    status: "info",
  });

  saveStore(store);
  return newPr;
}

export function updatePullRequest(prId: string, updates: any): any | null {
  const store = getStore();
  if (!store.pullRequests) return null;
  const idx = store.pullRequests.findIndex((p: any) => p.id === prId || String(p.number) === prId);
  if (idx === -1) return null;

  store.pullRequests[idx] = {
    ...store.pullRequests[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveStore(store);
  return store.pullRequests[idx];
}

export function mergePullRequest(prId: string): { success: boolean; message: string } {
  const store = getStore();
  if (!store.pullRequests) return { success: false, message: "No pull requests found" };
  const pr = store.pullRequests.find((p: any) => p.id === prId || String(p.number) === prId);
  if (!pr) return { success: false, message: "Pull request not found" };

  // Apply patches to store.repositoryFiles
  const targetRepo = pr.repositoryId || "sample-project";
  if (!store.repositoryFiles) store.repositoryFiles = {};
  if (!store.repositoryFiles[targetRepo]) store.repositoryFiles[targetRepo] = {};

  if (Array.isArray(pr.files)) {
    for (const f of pr.files) {
      if (f.rawContent) {
        store.repositoryFiles[targetRepo][f.filename] = {
          code: f.rawContent,
          language: f.filename.endsWith(".ts") || f.filename.endsWith(".tsx") ? "typescript" : "javascript",
        };
      } else if (f.patch && store.repositoryFiles[targetRepo][f.filename]) {
        // Appended modification note
        const existingCode = store.repositoryFiles[targetRepo][f.filename].code || "";
        store.repositoryFiles[targetRepo][f.filename].code = `${existingCode}\n// Merged from PR #${pr.number}: ${pr.title}`;
      }
    }
  }

  pr.state = "merged";
  pr.reviewStatus = "approved";
  pr.updatedAt = new Date().toISOString();

  if (!pr.timeline) pr.timeline = [];
  pr.timeline.push({
    id: `tl_merge_${Date.now()}`,
    type: "merged",
    title: `Merged Pull Request #${pr.number}`,
    actor: {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    timestamp: new Date().toISOString(),
    description: `Applied diff into ${pr.baseBranch || "main"} branch and updated repository file tree.`,
  });

  logActivity({
    module: "code-review",
    action: "merge",
    type: "pr_merged",
    title: `Merged PR #${pr.number}: ${pr.title}`,
    description: `Successfully applied changes to ${pr.repositoryId} on branch ${pr.baseBranch || "main"}.`,
    href: `/code-review?pr=${pr.id}`,
    target: { type: "pr", id: pr.id, name: `PR #${pr.number}` },
    repositoryId: pr.repositoryId,
    status: "success",
    details: {
      diff: pr.diff || pr.files?.[0]?.patch || undefined,
    },
  });

  if (!store.notifications) store.notifications = [];
  store.notifications.unshift({
    id: `notif_pr_${pr.number}_${Date.now()}`,
    title: `PR #${pr.number} Merged`,
    message: `Pull Request #${pr.number} was merged into main.`,
    timestamp: new Date().toISOString(),
    read: false,
    link: `/code-review?pr=${pr.id}`,
  });

  saveStore(store);
  return { success: true, message: `PR #${pr.number} successfully merged into ${pr.baseBranch || "main"}.` };
}

export function closePullRequest(prId: string): boolean {
  const store = getStore();
  if (!store.pullRequests) return false;
  const pr = store.pullRequests.find((p: any) => p.id === prId || String(p.number) === prId);
  if (!pr) return false;

  pr.state = "closed";
  pr.updatedAt = new Date().toISOString();
  if (!pr.timeline) pr.timeline = [];
  pr.timeline.push({
    id: `tl_close_${Date.now()}`,
    type: "closed",
    title: `Closed Pull Request #${pr.number}`,
    actor: {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    timestamp: new Date().toISOString(),
  });

  logActivity({
    type: "pr_closed",
    title: `Closed PR #${pr.number}`,
    description: `Closed pull request without merging.`,
    href: `/code-review?pr=${pr.id}`,
    status: "info",
  });

  saveStore(store);
  return true;
}



export function reopenPullRequest(prId: string): boolean {
  const store = getStore();
  if (!store.pullRequests) return false;
  const pr = store.pullRequests.find((p: any) => p.id === prId || String(p.number) === prId);
  if (!pr) return false;

  pr.state = "open";
  pr.updatedAt = new Date().toISOString();
  if (!pr.timeline) pr.timeline = [];
  pr.timeline.push({
    id: `tl_reopen_${Date.now()}`,
    type: "reopened",
    title: `Reopened Pull Request #${pr.number}`,
    actor: {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    timestamp: new Date().toISOString(),
  });

  logActivity({
    type: "pr_reopened",
    title: `Reopened PR #${pr.number}`,
    description: `Reopened pull request for further review.`,
    href: `/code-review?pr=${pr.id}`,
    status: "info",
  });

  saveStore(store);
  return true;
}



export function addInlineComment(
  prId: string,
  comment: { file: string; line: number; text: string; author?: any }
): any {
  const store = getStore();
  if (!store.pullRequests) return null;
  const pr = store.pullRequests.find((p: any) => p.id === prId || String(p.number) === prId);
  if (!pr) return null;

  if (!pr.inlineComments) pr.inlineComments = [];
  const newComment = {
    id: `inline_${Date.now()}`,
    file: comment.file,
    line: comment.line,
    author: comment.author || {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    text: comment.text,
    timestamp: new Date().toISOString(),
    resolved: false,
    replies: [],
  };

  pr.inlineComments.push(newComment);

  if (!pr.timeline) pr.timeline = [];
  pr.timeline.push({
    id: `tl_comment_${Date.now()}`,
    type: "commented",
    title: `Inline comment added on ${comment.file}:${comment.line}`,
    actor: newComment.author,
    timestamp: new Date().toISOString(),
    description: comment.text.slice(0, 80),
  });

  logActivity({
    type: "review_comment_added",
    title: `Commented on PR #${pr.number}`,
    description: `Left inline comment on ${comment.file}:${comment.line}.`,
    href: `/code-review?pr=${pr.id}`,
    status: "info",
  });

  saveStore(store);
  return newComment;
}

export function replyToInlineComment(
  prId: string,
  commentId: string,
  reply: { text: string; author?: any }
): any {
  const store = getStore();
  if (!store.pullRequests) return null;
  const pr = store.pullRequests.find((p: any) => p.id === prId || String(p.number) === prId);
  if (!pr || !pr.inlineComments) return null;

  const target = pr.inlineComments.find((c: any) => c.id === commentId);
  if (!target) return null;

  if (!target.replies) target.replies = [];
  const newReply = {
    id: `reply_${Date.now()}`,
    author: reply.author || {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    text: reply.text,
    timestamp: new Date().toISOString(),
  };

  target.replies.push(newReply);
  saveStore(store);
  return newReply;
}

export function addDiscussionComment(
  prId: string,
  findingId: string,
  comment: { text: string; author?: any }
): any {
  const store = getStore();
  if (!store.pullRequests) return null;
  const pr = store.pullRequests.find((p: any) => p.id === prId || String(p.number) === prId);
  if (!pr) return null;

  if (!pr.discussions) pr.discussions = {};
  if (!pr.discussions[findingId]) {
    pr.discussions[findingId] = {
      id: `disc_${findingId}`,
      findingId,
      comments: [],
      resolved: false,
    };
  }

  const newComment = {
    id: `disc_comment_${Date.now()}`,
    author: comment.author || {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    text: comment.text,
    timestamp: new Date().toISOString(),
    reactions: {},
  };

  pr.discussions[findingId].comments.push(newComment);

  logActivity({
    type: "review_discussion_added",
    title: `Commented in Finding Discussion on PR #${pr.number}`,
    description: comment.text.slice(0, 100),
    href: `/code-review?pr=${pr.id}`,
    status: "info",
  });

  saveStore(store);
  return newComment;
}

export function resolveDiscussion(prId: string, findingId: string, resolved = true): boolean {
  const store = getStore();
  if (!store.pullRequests) return false;
  const pr = store.pullRequests.find((p: any) => p.id === prId || String(p.number) === prId);
  if (!pr || !pr.discussions || !pr.discussions[findingId]) return false;

  pr.discussions[findingId].resolved = resolved;
  saveStore(store);
  return true;
}



export function toggleChecklistItem(prId: string, checklistId: string): boolean {
  const store = getStore();
  if (!store.pullRequests) return false;
  const pr = store.pullRequests.find((p: any) => p.id === prId || String(p.number) === prId);
  if (!pr) return false;

  if (!pr.checklist) {
    pr.checklist = [
      { id: "chk_tests", label: "Tests added and passing", checked: true },
      { id: "chk_docs", label: "Documentation updated", checked: false },
      { id: "chk_secrets", label: "No secrets or API keys exposed", checked: true },
      { id: "chk_impact", label: "Impact analysis checked", checked: false },
    ];
  }

  const item = pr.checklist.find((c: any) => c.id === checklistId);
  if (!item) return false;

  item.checked = !item.checked;
  saveStore(store);
  return true;
}



export function toggleViewedFile(prId: string, filename: string): boolean {
  const store = getStore();
  if (!store.pullRequests) return false;
  const pr = store.pullRequests.find((p: any) => p.id === prId || String(p.number) === prId);
  if (!pr) return false;

  if (!pr.viewedFiles) pr.viewedFiles = {};
  pr.viewedFiles[filename] = !pr.viewedFiles[filename];
  saveStore(store);
  return true;
}



export function applyFindingSuggestion(
  prId: string,
  findingId: string,
  suggestionDiff?: string
): { success: boolean; message: string } {
  const store = getStore();
  if (!store.pullRequests) return { success: false, message: "No PR found" };
  const pr = store.pullRequests.find((p: any) => p.id === prId || String(p.number) === prId);
  if (!pr) return { success: false, message: "PR not found" };

  // Update finding status in review session if stored
  const sessionKey = `${pr.repositoryId || "sample-project"}_${pr.number}`;
  if (store.reviewSessions?.[sessionKey]) {
    const f = store.reviewSessions[sessionKey].findings?.find((x: any) => x.id === findingId);
    if (f) {
      f.status = "accepted";
      f.accepted = true;
    }
  }

  // Update PR patch if suggestionDiff is present
  if (suggestionDiff && pr.files?.[0]) {
    pr.files[0].patch = `${pr.files[0].patch || ""}\n\n# Applied Remediation:\n${suggestionDiff}`;
    pr.additions = (pr.additions || 0) + 2;
  }

  if (!pr.timeline) pr.timeline = [];
  pr.timeline.push({
    id: `tl_suggest_${Date.now()}`,
    type: "reviewed",
    title: `Applied fix suggestion for finding ${findingId}`,
    actor: {
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    },
    timestamp: new Date().toISOString(),
    description: "Code suggestion applied to PR diff.",
  });

  logActivity({
    module: "code-review",
    action: "apply",
    type: "review_suggestion_applied",
    title: `Applied Suggestion on PR #${pr.number}`,
    description: `Remediation patch applied for finding ${findingId}.`,
    href: `/code-review?pr=${pr.id}`,
    target: { type: "pr", id: pr.id, name: `PR #${pr.number}` },
    repositoryId: pr.repositoryId,
    status: "success",
    details: {
      diff: suggestionDiff || undefined,
    },
  });

  saveStore(store);
  return { success: true, message: "Suggestion applied to PR diff." };
}

export function updateFindingDecision(
  prId: string,
  findingId: string,
  status: string,
  reason?: string
): boolean {
  const store = getStore();
  if (!store.pullRequests) return false;
  const pr = store.pullRequests.find((p: any) => p.id === prId || String(p.number) === prId);
  if (!pr) return false;

  const sessionKey = `${pr.repositoryId || "sample-project"}_${pr.number}`;
  if (store.reviewSessions?.[sessionKey]) {
    const f = store.reviewSessions[sessionKey].findings?.find((x: any) => x.id === findingId);
    if (f) {
      f.status = status;
      if (status === "dismissed") f.dismissReason = reason;
      if (status === "accepted") f.accepted = true;
    }
  }

  logActivity({
    type: status === "accepted" ? "review_finding_accepted" : "review_finding_dismissed",
    title: `${status === "accepted" ? "Accepted" : "Dismissed"} Finding ${findingId}`,
    description: reason ? `Reason: ${reason}` : `Updated status to ${status}.`,
    href: `/code-review?pr=${pr.id}`,
    status: status === "accepted" ? "success" : "info",
  });

  saveStore(store);
  return true;
}

if (typeof window !== "undefined") {
  (window as any).__CODEATLAS_STORE__ = {
    getStore,
    saveStore,
    resetStore,
    logActivity,
    getAuditTrail,
    subscribe,
    emitChange,
    createWorkspace,
    reindexRepository,
    applyAgentDiffToStore,
    mergePullRequest,
  };
}
