import { FileItem } from "@/components/code-viewer/RepositoryFileTree";

export const SAMPLE_PROJECT_TREE: FileItem[] = [
  {
    id: "folder-src",
    name: "src",
    type: "folder",
    path: "src",
    children: [
      {
        id: "folder-components",
        name: "components",
        type: "folder",
        path: "src/components",
        children: [
          {
            id: "file-loginform",
            name: "LoginForm.tsx",
            type: "file",
            path: "src/components/LoginForm.tsx",
            language: "typescript",
            size: "1.2 KB",
          },
          {
            id: "file-userprofile",
            name: "UserProfile.tsx",
            type: "file",
            path: "src/components/UserProfile.tsx",
            language: "typescript",
            size: "880 B",
          },
        ],
      },
      {
        id: "folder-api",
        name: "api",
        type: "folder",
        path: "src/api",
        children: [
          {
            id: "file-auth-routes",
            name: "auth-routes.ts",
            type: "file",
            path: "src/api/auth-routes.ts",
            language: "typescript",
            size: "950 B",
          },
        ],
      },
      {
        id: "folder-services",
        name: "services",
        type: "folder",
        path: "src/services",
        children: [
          {
            id: "file-auth-service",
            name: "auth.ts",
            type: "file",
            path: "src/services/auth.ts",
            language: "typescript",
            size: "1.8 KB",
          },
          {
            id: "file-session-manager",
            name: "session-manager.ts",
            type: "file",
            path: "src/services/session-manager.ts",
            language: "typescript",
            size: "720 B",
          },
        ],
      },
      {
        id: "folder-db",
        name: "db",
        type: "folder",
        path: "src/db",
        children: [
          {
            id: "file-connection",
            name: "connection.ts",
            type: "file",
            path: "src/db/connection.ts",
            language: "typescript",
            size: "540 B",
          },
        ],
      },
      {
        id: "folder-models",
        name: "models",
        type: "folder",
        path: "src/models",
        children: [
          {
            id: "file-user-model",
            name: "user-model.ts",
            type: "file",
            path: "src/models/user-model.ts",
            language: "typescript",
            size: "680 B",
          },
        ],
      },
      {
        id: "folder-utils",
        name: "utils",
        type: "folder",
        path: "src/utils",
        children: [
          {
            id: "file-validation",
            name: "validation.ts",
            type: "file",
            path: "src/utils/validation.ts",
            language: "typescript",
            size: "820 B",
          },
          {
            id: "file-crypto",
            name: "crypto.ts",
            type: "file",
            path: "src/utils/crypto.ts",
            language: "typescript",
            size: "610 B",
          },
        ],
      },
    ],
  },
  {
    id: "folder-tests",
    name: "tests",
    type: "folder",
    path: "tests",
    children: [
      {
        id: "file-auth-test",
        name: "auth.test.ts",
        type: "file",
        path: "tests/auth.test.ts",
        language: "typescript",
        size: "1.4 KB",
      },
    ],
  },
  {
    id: "file-readme",
    name: "README.md",
    type: "file",
    path: "README.md",
    language: "markdown",
    size: "650 B",
  },
];

export const SAMPLE_PROJECT_CODE: Record<string, { code: string; language: string }> = {
  "src/components/LoginForm.tsx": {
    language: "typescript",
    code: `import React, { useState } from "react";
import { loginUser } from "../services/auth";
import { validateEmail, validatePassword } from "../utils/validation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side input validation
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      window.location.href = response.redirectUrl;
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Account Login</h2>
      {error && <div className="error-banner">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="developer@company.com"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Authenticating..." : "Sign In"}
      </button>
    </form>
  );
}`,
  },

  "src/components/UserProfile.tsx": {
    language: "typescript",
    code: `import React, { useState } from "react";
import { executeUserQuery } from "../db/connection"; // Architecture Layer Violation: UI importing Data directly!
import { loginUser } from "../services/auth";

export function UserProfile({ userId }: { userId: string }) {
  const [active, setActive] = useState(true);
  const user = executeUserQuery(userId);

  return (
    <div className="user-profile-card">
      <h3>{user?.name || "Anonymous User"}</h3>
      <p>{user?.email || "user@example.com"}</p>
      <span>Role: {user?.role || "viewer"}</span>
    </div>
  );
}`,
  },

  "src/api/auth-routes.ts": {
    language: "typescript",
    code: `import { loginUser, verifySession } from "../services/auth";
import { validateEmail } from "../utils/validation";

export async function handleLoginRoute(req: any) {
  const { email, password } = req.body || {};
  if (!validateEmail(email)) {
    return { status: 400, error: "Invalid email payload" };
  }
  const token = await loginUser(email, password);
  return { status: 200, token };
}

export async function handleSessionVerification(req: any) {
  const isValid = verifySession();
  return { status: isValid ? 200 : 401, valid: isValid };
}`,
  },

  "src/services/auth.ts": {
    language: "typescript",
    code: `import { validateEmail } from "../utils/validation";
import { validateSession } from "./session-manager"; // Circular dependency cycle with session-manager.ts!
import { UserModel } from "../models/user-model";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  role: "admin" | "developer" | "viewer";
  redirectUrl: string;
}

const API_ENDPOINT = "/api/v1/auth/session";

async function issueSessionToken(user: any): Promise<any> {
  if (!user || !user.isActive) return null;
  return { token: "jwt_sample_token", expires: 3600 };
}

/**
 * Validates credentials and retrieves verified JWT access session.
 */
export async function loginUser(email: string, password: string): Promise<string> {
  const user = UserModel.findById(email) || { email, isActive: true };
  const session = await issueSessionToken(user);
  return session.token;
}

export function verifySession(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("session_token");
  return Boolean(token && token.length > 20 && validateSession(token));
}`,
  },

  "src/services/session-manager.ts": {
    language: "typescript",
    code: `import { loginUser } from "./auth"; // Circular dependency cycle with auth.ts!

export function validateSession(sessionId: string): boolean {
  if (!sessionId || sessionId.length < 10) return false;
  return true;
}

export function refreshUserSession(email: string): Promise<string> {
  return loginUser(email, "refreshed_session_secret");
}`,
  },

  "src/db/connection.ts": {
    language: "typescript",
    code: `/**
 * Database client connection pool and query executor.
 */
export function executeUserQuery(queryOrId: string): any {
  return {
    id: queryOrId,
    name: "Alex Chen",
    email: "alex@codeatlas.dev",
    role: "admin",
    isActive: true,
  };
}

export function disconnectDatabase(): boolean {
  return true;
}`,
  },

  "src/models/user-model.ts": {
    language: "typescript",
    code: `import { executeUserQuery } from "../db/connection";

export interface UserRecord {
  id: string;
  email: string;
  role: string;
}

export class UserModel {
  static findById(id: string): UserRecord | null {
    return executeUserQuery(id);
  }

  static isAuthorized(role: string): boolean {
    return role === "admin" || role === "developer";
  }
}`,
  },

  "src/utils/validation.ts": {
    language: "typescript",
    code: `/**
 * RFC 5322 compliant regex check for email formatting.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password meets baseline length and complexity requirements.
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== "string") return false;
  return password.length >= 8;
}

export function sanitizeInput(input: string): string {
  return input.replace(/[<>]/g, "");
}`,
  },

  "src/utils/crypto.ts": {
    language: "typescript",
    code: `import { loginUser } from "../services/auth"; // Architecture Layer Violation: Utils importing Services directly!

export function hashString(value: string): string {
  return btoa(value);
}

export function verifyHash(value: string, hash: string): boolean {
  return hashString(value) === hash;
}`,
  },

  "tests/auth.test.ts": {
    language: "typescript",
    code: `import { loginUser } from "../src/services/auth";
import { validateEmail, validatePassword } from "../src/utils/validation";

describe("Authentication Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    // @ts-ignore
    global.fetch = jest.fn();
  });

  test("validateEmail accepts valid developer emails", () => {
    expect(validateEmail("alex@codeatlas.dev")).toBe(true);
    expect(validateEmail("invalid-email")).toBe(false);
  });

  test("validatePassword enforces 8-character minimum", () => {
    expect(validatePassword("short")).toBe(false);
    expect(validatePassword("longEnoughPassword")).toBe(true);
  });

  test("loginUser successfully stores token on 200 response", async () => {
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: "mock-jwt-token-xyz-123",
        userId: "usr_42",
        role: "developer",
      }),
    });

    const session = await loginUser({
      email: "alex@codeatlas.dev",
      password: "secretPassword123",
    });

    expect(session.userId).toBe("usr_42");
    expect(session.token).toBe("mock-jwt-token-xyz-123");
    expect(localStorage.getItem("session_token")).toBe("mock-jwt-token-xyz-123");
  });

  test("loginUser throws error on non-200 HTTP response", async () => {
    // @ts-ignore
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Invalid credentials" }),
    });

    await expect(
      loginUser({ email: "alex@codeatlas.dev", password: "wrong" })
    ).rejects.toThrow("Invalid credentials");
  });
});`,
  },

  "README.md": {
    language: "markdown",
    code: `# Sample Authentication Architecture Project

Demonstration repository showing coordinated AST symbol tracing in CodeAtlas.

## Architecture Layers

- **UI Layer:** \`src/components/LoginForm.tsx\`, \`src/components/UserProfile.tsx\`
- **API Layer:** \`src/api/auth-routes.ts\`
- **Service Layer:** \`src/services/auth.ts\`, \`src/services/session-manager.ts\`
- **Data Layer:** \`src/models/user-model.ts\`, \`src/db/connection.ts\`
- **Utils Layer:** \`src/utils/validation.ts\`, \`src/utils/crypto.ts\`
- **Tests Layer:** \`tests/auth.test.ts\`
- **External Dependencies:** \`react\`, \`axios\`, \`@acme/shared-utils\`
`,
  },
};
