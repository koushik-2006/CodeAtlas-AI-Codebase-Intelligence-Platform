import { DbRepository, DbRepositoryFile, DbCodeSymbol, DbCodeRelationship } from "@/types/database";
import { DbWorkspaceRepository } from "@/types/workspace";

export const MULTI_REPO_FIXTURES: {
  repositories: DbRepository[];
  files: DbRepositoryFile[];
  symbols: DbCodeSymbol[];
  relationships: DbCodeRelationship[];
  workspaceRepositories: DbWorkspaceRepository[];
} = {
  repositories: [
    {
      id: "shared-core-lib",
      userId: "usr_default",
      name: "shared-core-lib",
      owner: "acme-corp",
      description: "Internal shared TypeScript library (@acme/shared-utils) for validation, formatting, and HTTP clients.",
      visibility: "public",
      language: "TypeScript",
      defaultBranch: "main",
      url: "https://github.com/acme-corp/shared-core-lib",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 12,
      fileCount: 6,
      lastAnalyzed: "Today at 09:30 AM",
      isIndexed: true,
      connectionType: "sample",
    },
    {
      id: "auth-service",
      userId: "usr_default",
      name: "auth-service",
      owner: "acme-corp",
      description: "Backend authentication and token validation microservice exposing /api/v1/auth/session.",
      visibility: "public",
      language: "TypeScript",
      defaultBranch: "main",
      url: "https://github.com/acme-corp/auth-service",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 14,
      fileCount: 5,
      lastAnalyzed: "Today at 08:45 AM",
      isIndexed: true,
      connectionType: "sample",
    },
    {
      id: "payment-service",
      userId: "usr_default",
      name: "payment-service",
      owner: "acme-corp",
      description: "Checkout orchestrator and payment processing microservice with currency formatting.",
      visibility: "public",
      language: "TypeScript",
      defaultBranch: "main",
      url: "https://github.com/acme-corp/payment-service",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 10,
      fileCount: 5,
      lastAnalyzed: "Yesterday at 04:20 PM",
      isIndexed: true,
      connectionType: "sample",
    },
    {
      id: "secret-vault",
      userId: "usr_elena",
      name: "secret-vault",
      owner: "security-team",
      description: "Restricted confidential key management vault and security auditing infrastructure.",
      visibility: "private",
      language: "TypeScript",
      defaultBranch: "main",
      url: "https://github.com/security-team/secret-vault",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 6,
      fileCount: 3,
      lastAnalyzed: "3 days ago",
      isIndexed: true,
      connectionType: "sample",
    },
  ],

  workspaceRepositories: [
    {
      id: "wsr_team_shared_core",
      workspaceId: "ws_team_demo",
      repositoryId: "shared-core-lib",
      addedBy: "usr_default",
      addedAt: "2026-01-02T00:00:00.000Z",
    },
    {
      id: "wsr_team_auth_service",
      workspaceId: "ws_team_demo",
      repositoryId: "auth-service",
      addedBy: "usr_default",
      addedAt: "2026-01-02T00:00:00.000Z",
    },
    {
      id: "wsr_team_payment_service",
      workspaceId: "ws_team_demo",
      repositoryId: "payment-service",
      addedBy: "usr_default",
      addedAt: "2026-01-02T00:00:00.000Z",
    },
  ],

  files: [
    // --- sample-project package.json ---
    {
      id: "file_sample_package_json",
      repositoryId: "sample-project",
      path: "package.json",
      name: "package.json",
      language: "json",
      size: 420,
      content: JSON.stringify(
        {
          name: "sample-project",
          version: "1.0.0",
          private: true,
          dependencies: {
            "@acme/shared-utils": "^2.1.0",
            react: "^18.3.1",
            "react-dom": "^18.3.1",
          },
          devDependencies: {
            typescript: "^5.5.3",
            jest: "^29.7.0",
          },
        },
        null,
        2
      ),
      lineCount: 16,
    },

    // --- shared-core-lib files ---
    {
      id: "file_shared_package_json",
      repositoryId: "shared-core-lib",
      path: "package.json",
      name: "package.json",
      language: "json",
      size: 380,
      content: JSON.stringify(
        {
          name: "@acme/shared-utils",
          version: "2.1.0",
          main: "src/index.ts",
          types: "src/index.d.ts",
          dependencies: {},
          devDependencies: {
            typescript: "^5.5.3",
            jest: "^29.7.0",
          },
        },
        null,
        2
      ),
      lineCount: 14,
    },
    {
      id: "file_shared_validation",
      repositoryId: "shared-core-lib",
      path: "src/validation.ts",
      name: "validation.ts",
      language: "typescript",
      size: 890,
      content: `/**
 * Shared email and password validation utilities for Acme Corp platforms.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
}

export function validatePassword(password: string): boolean {
  return typeof password === "string" && password.length >= 8;
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, "").trim();
}`,
      lineCount: 16,
    },
    {
      id: "file_shared_formatters",
      repositoryId: "shared-core-lib",
      path: "src/formatters.ts",
      name: "formatters.ts",
      language: "typescript",
      size: 650,
      content: `/**
 * Financial and date formatting helpers.
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}`,
      lineCount: 14,
    },
    {
      id: "file_shared_client",
      repositoryId: "shared-core-lib",
      path: "src/client.ts",
      name: "client.ts",
      language: "typescript",
      size: 920,
      content: `/**
 * Resilient HTTP Client factory with retry semantics.
 */
export interface HttpClientOptions {
  timeoutMs?: number;
  retries?: number;
}

export function createHttpClient(baseUrl: string, options: HttpClientOptions = {}) {
  const { timeoutMs = 5000, retries = 3 } = options;
  return {
    async get(path: string) {
      return fetch(\`\${baseUrl}\${path}\`);
    },
    async post(path: string, body: unknown) {
      return fetch(\`\${baseUrl}\${path}\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
  };
}`,
      lineCount: 26,
    },
    {
      id: "file_shared_tests",
      repositoryId: "shared-core-lib",
      path: "tests/validation.test.ts",
      name: "validation.test.ts",
      language: "typescript",
      size: 680,
      content: `import { validateEmail, validatePassword, sanitizeInput } from "../src/validation";

describe("shared-utils: validation", () => {
  test("validateEmail correctly parses valid addresses", () => {
    expect(validateEmail("eng@acme.dev")).toBe(true);
    expect(validateEmail("invalid-email")).toBe(false);
  });

  test("sanitizeInput eliminates script tags", () => {
    expect(sanitizeInput("<script>alert(1)</script>")).toBe("alert(1)");
  });
});`,
      lineCount: 14,
    },

    // --- auth-service files ---
    {
      id: "file_auth_package_json",
      repositoryId: "auth-service",
      path: "package.json",
      name: "package.json",
      language: "json",
      size: 410,
      content: JSON.stringify(
        {
          name: "auth-service",
          version: "1.4.0",
          private: true,
          dependencies: {
            "@acme/shared-utils": "2.1.0",
            jsonwebtoken: "^9.0.2",
            bcrypt: "^5.1.1",
          },
        },
        null,
        2
      ),
      lineCount: 14,
    },
    {
      id: "file_auth_server",
      repositoryId: "auth-service",
      path: "src/server.ts",
      name: "server.ts",
      language: "typescript",
      size: 1450,
      content: `import { validateEmail } from "@acme/shared-utils";
import { authenticateSession } from "./handlers/auth";

export const AUTH_PORT = process.env.PORT || 8080;

/**
 * HTTP Endpoint: POST /api/v1/auth/session
 * Validates credentials and returns signed JWT access token.
 */
export async function handleSessionRequest(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const body = await req.json();
  if (!body.email || !validateEmail(body.email)) {
    return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400 });
  }

  const result = await authenticateSession(body.email, body.password);
  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 401,
    headers: { "Content-Type": "application/json" },
  });
}`,
      lineCount: 26,
    },
    {
      id: "file_auth_handler",
      repositoryId: "auth-service",
      path: "src/handlers/auth.ts",
      name: "auth.ts",
      language: "typescript",
      size: 1120,
      content: `import { AuthSessionResponse } from "../models/session";

export async function authenticateSession(email: string, password: string): Promise<AuthSessionResponse> {
  if (password === "secretPassword123") {
    return {
      success: true,
      token: "jwt-signed-token-acme-auth-xyz",
      userId: "usr_alex_42",
      role: "admin",
      expiresIn: 3600,
    };
  }
  return {
    success: false,
    token: "",
    error: "Invalid credentials provided",
  };
}`,
      lineCount: 20,
    },
    {
      id: "file_auth_models",
      repositoryId: "auth-service",
      path: "src/models/session.ts",
      name: "session.ts",
      language: "typescript",
      size: 550,
      content: `export interface AuthSessionRequest {
  email: string;
  password: string;
}

export interface AuthSessionResponse {
  success: boolean;
  token: string;
  userId?: string;
  role?: string;
  expiresIn?: number;
  error?: string;
}`,
      lineCount: 14,
    },
    {
      id: "file_auth_tests",
      repositoryId: "auth-service",
      path: "tests/server.test.ts",
      name: "server.test.ts",
      language: "typescript",
      size: 750,
      content: `import { handleSessionRequest } from "../src/server";

describe("auth-service: /api/v1/auth/session endpoint", () => {
  test("POST /api/v1/auth/session issues valid token for valid credentials", async () => {
    const req = new Request("http://localhost:8080/api/v1/auth/session", {
      method: "POST",
      body: JSON.stringify({ email: "alex@codeatlas.dev", password: "secretPassword123" }),
    });
    const res = await handleSessionRequest(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBe("jwt-signed-token-acme-auth-xyz");
  });
});`,
      lineCount: 18,
    },

    // --- payment-service files ---
    {
      id: "file_payment_package_json",
      repositoryId: "payment-service",
      path: "package.json",
      name: "package.json",
      language: "json",
      size: 390,
      content: JSON.stringify(
        {
          name: "payment-service",
          version: "2.0.1",
          private: true,
          dependencies: {
            "@acme/shared-utils": "^2.0.0",
            stripe: "^14.0.0",
          },
        },
        null,
        2
      ),
      lineCount: 13,
    },
    {
      id: "file_payment_checkout",
      repositoryId: "payment-service",
      path: "src/checkout.ts",
      name: "checkout.ts",
      language: "typescript",
      size: 980,
      content: `import { formatCurrency, createHttpClient } from "@acme/shared-utils";

export async function processCheckout(orderId: string, amount: number) {
  const formattedAmount = formatCurrency(amount, "USD");
  const authClient = createHttpClient(process.env.AUTH_SERVICE_URL || "https://auth.internal.acme.dev");
  
  return {
    orderId,
    formattedAmount,
    status: "authorized",
    processedAt: new Date().toISOString(),
  };
}`,
      lineCount: 16,
    },
    {
      id: "file_payment_charge",
      repositoryId: "payment-service",
      path: "src/handlers/charge.ts",
      name: "charge.ts",
      language: "typescript",
      size: 880,
      content: `/**
 * HTTP Endpoint: POST /api/v1/payments/charge
 * Deducts balance and commits payment receipt.
 */
export async function handleChargeRequest(req: Request): Promise<Response> {
  const body = await req.json();
  return new Response(JSON.stringify({ chargeId: "ch_" + Date.now(), status: "succeeded" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}`,
      lineCount: 13,
    },
    {
      id: "file_payment_tests",
      repositoryId: "payment-service",
      path: "tests/checkout.test.ts",
      name: "checkout.test.ts",
      language: "typescript",
      size: 580,
      content: `import { processCheckout } from "../src/checkout";

describe("payment-service: checkout", () => {
  test("processCheckout formats amount using shared-utils", async () => {
    const result = await processCheckout("ord_123", 49.99);
    expect(result.formattedAmount).toBe("$49.99");
    expect(result.status).toBe("authorized");
  });
});`,
      lineCount: 12,
    },

    // --- secret-vault files (unauthorized repository) ---
    {
      id: "file_secret_vault_keys",
      repositoryId: "secret-vault",
      path: "src/keys.ts",
      name: "keys.ts",
      language: "typescript",
      size: 520,
      content: `// Confidential HSM encryption secrets
export const MASTER_RSA_KEY = "CONFIDENTIAL_KEY_MATERIAL_NEVER_LEAK";
export function decryptMasterKey(): string {
  return "unauthorized-access-prevented";
}`,
      lineCount: 8,
    },
  ],

  symbols: [
    // shared-core-lib symbols
    {
      id: "sym_shared_validate_email",
      repositoryId: "shared-core-lib",
      filePath: "src/validation.ts",
      name: "validateEmail",
      type: "function",
      startLine: 4,
      endLine: 8,
      parameters: ["email: string"],
      scope: "src/validation.ts",
    },
    {
      id: "sym_shared_validate_password",
      repositoryId: "shared-core-lib",
      filePath: "src/validation.ts",
      name: "validatePassword",
      type: "function",
      startLine: 10,
      endLine: 12,
      parameters: ["password: string"],
      scope: "src/validation.ts",
    },
    {
      id: "sym_shared_format_currency",
      repositoryId: "shared-core-lib",
      filePath: "src/formatters.ts",
      name: "formatCurrency",
      type: "function",
      startLine: 4,
      endLine: 9,
      parameters: ["amount: number", "currency: string"],
      scope: "src/formatters.ts",
    },
    {
      id: "sym_shared_create_http_client",
      repositoryId: "shared-core-lib",
      filePath: "src/client.ts",
      name: "createHttpClient",
      type: "function",
      startLine: 9,
      endLine: 24,
      parameters: ["baseUrl: string", "options: HttpClientOptions"],
      scope: "src/client.ts",
    },

    // auth-service symbols
    {
      id: "sym_auth_session_endpoint",
      repositoryId: "auth-service",
      filePath: "src/server.ts",
      name: "POST /api/v1/auth/session",
      type: "endpoint",
      startLine: 10,
      endLine: 24,
      parameters: ["req: Request"],
      scope: "src/server.ts",
    },
    {
      id: "sym_auth_authenticate_session",
      repositoryId: "auth-service",
      filePath: "src/handlers/auth.ts",
      name: "authenticateSession",
      type: "function",
      startLine: 3,
      endLine: 18,
      parameters: ["email: string", "password: string"],
      scope: "src/handlers/auth.ts",
    },

    // payment-service symbols
    {
      id: "sym_payment_process_checkout",
      repositoryId: "payment-service",
      filePath: "src/checkout.ts",
      name: "processCheckout",
      type: "function",
      startLine: 3,
      endLine: 14,
      parameters: ["orderId: string", "amount: number"],
      scope: "src/checkout.ts",
    },
    {
      id: "sym_payment_charge_endpoint",
      repositoryId: "payment-service",
      filePath: "src/handlers/charge.ts",
      name: "POST /api/v1/payments/charge",
      type: "endpoint",
      startLine: 6,
      endLine: 12,
      parameters: ["req: Request"],
      scope: "src/handlers/charge.ts",
    },

    // secret-vault symbols
    {
      id: "sym_secret_decrypt",
      repositoryId: "secret-vault",
      filePath: "src/keys.ts",
      name: "decryptMasterKey",
      type: "function",
      startLine: 3,
      endLine: 5,
      parameters: [],
      scope: "src/keys.ts",
    },
  ],

  relationships: [
    // Cross-repo dependency from sample-project to shared-core-lib
    {
      id: "rel_cross_sample_to_shared",
      repositoryId: "sample-project",
      fromSymbolId: "file_sample_package_json",
      fromSymbolName: "sample-project",
      toSymbolId: "shared-core-lib",
      toSymbolName: "@acme/shared-utils",
      type: "imports",
    },
    // Cross-repo dependency from auth-service to shared-core-lib
    {
      id: "rel_cross_auth_to_shared",
      repositoryId: "auth-service",
      fromSymbolId: "sym_auth_session_endpoint",
      fromSymbolName: "POST /api/v1/auth/session",
      toSymbolId: "sym_shared_validate_email",
      toSymbolName: "validateEmail",
      type: "calls",
    },
    // Cross-repo dependency from payment-service to shared-core-lib
    {
      id: "rel_cross_payment_to_shared",
      repositoryId: "payment-service",
      fromSymbolId: "sym_payment_process_checkout",
      fromSymbolName: "processCheckout",
      toSymbolId: "sym_shared_format_currency",
      toSymbolName: "formatCurrency",
      type: "calls",
    },
    // Cross-repo configured service relationship: sample-project -> auth-service
    {
      id: "rel_cross_sample_to_auth_service",
      repositoryId: "sample-project",
      fromSymbolId: "sym_login_user",
      fromSymbolName: "loginUser",
      toSymbolId: "sym_auth_session_endpoint",
      toSymbolName: "POST /api/v1/auth/session",
      type: "calls",
    },
  ],
};
