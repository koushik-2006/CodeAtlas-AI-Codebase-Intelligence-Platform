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

  "src/services/auth.ts": {
    language: "typescript",
    code: `import { validateEmail } from "../utils/validation";

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

/**
 * Validates credentials and retrieves verified JWT access session.
 * Connects frontend submit to POST /auth and UserService.
 */
export async function loginUser(creds: LoginCredentials): Promise<AuthSession> {
  if (!validateEmail(creds.email)) {
    throw new Error("Invalid email format provided to auth service.");
  }

  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: creds.email,
      password: creds.password,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || \`Auth failed with status \${response.status}\`);
  }

  const data = await response.json();
  localStorage.setItem("session_token", data.token);

  return {
    token: data.token,
    userId: data.userId,
    role: data.role || "developer",
    redirectUrl: "/dashboard",
  };
}

export function verifySession(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("session_token");
  return Boolean(token && token.length > 20);
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

## Architecture Overview

- **Frontend Client:** \`src/components/LoginForm.tsx\`
- **Service Layer:** \`src/services/auth.ts\`
- **Validation Utilities:** \`src/utils/validation.ts\`
- **Test Suite:** \`tests/auth.test.ts\`

## Call Path

\`\`\`text
LoginForm.tsx
      ↓ calls
src/services/auth.ts (loginUser)
      ↓ executes
src/utils/validation.ts (validateEmail)
      ↓ dispatches HTTP
POST /api/v1/auth/session
      ↓ verified by
tests/auth.test.ts
\`\`\`
`,
  },
};
