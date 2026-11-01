import {
  AgentRun,
  AgentStep,
  AgentLogLine,
  AgentDiff,
  AgentPolicy,
  WorkflowTemplate,
  StartAgentRunRequest,
  AgentType,
} from "@/types/agent";

export const STANDARD_WORKFLOWS: WorkflowTemplate[] = [
  {
    id: "fix_bug",
    name: "Fix a bug from a description/stack trace",
    agentType: "debugging",
    description: "Analyzes stack trace frames, isolates the root cause, and generates a verified reproduction fix with regression tests.",
    defaultPrompt: "Investigate TypeError: Cannot read properties of undefined (reading 'token') reported in loginUser and synthesize a verified null-safe fix.",
    stepCount: 7,
    steps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    typicalSteps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    icon: "Bug",
  },
  {
    id: "unit_tests",
    name: "Write unit tests for a file",
    agentType: "test_generation",
    description: "Inspects functions, exported interfaces, and branch edge cases to synthesize an idiomatic, comprehensive test suite.",
    defaultPrompt: "Write full unit test coverage for src/services/auth.ts including happy path, null tokens, and error handling edge cases.",
    stepCount: 7,
    steps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    typicalSteps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    icon: "FlaskConical",
  },
  {
    id: "documentation",
    name: "Add documentation/comments",
    agentType: "documentation",
    description: "Enriches complex algorithms and exported modules with clear JSDoc / docstrings and architecture summaries.",
    defaultPrompt: "Add complete JSDoc documentation, parameter types, and inline comments explaining authentication logic in src/services/auth.ts.",
    stepCount: 7,
    steps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    typicalSteps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    icon: "BookOpen",
  },
  {
    id: "security_audit",
    name: "Security audit",
    agentType: "code_review",
    description: "Audits input handling, authorization boundaries, cryptographic routines, and dependency vulnerabilities.",
    defaultPrompt: "Perform rigorous security audit on token verification, credential deserialization, and timing attack resistance.",
    stepCount: 7,
    steps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    typicalSteps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    icon: "ShieldAlert",
  },
  {
    id: "upgrade_dependency",
    name: "Upgrade a dependency",
    agentType: "refactoring",
    description: "Checks semver release notes, updates package manifests, and modifies deprecated call sites.",
    defaultPrompt: "Upgrade axios to 1.7.2 across package manifests and verify backward compatibility for request interceptors.",
    stepCount: 7,
    steps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    typicalSteps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    icon: "ArrowUpCircle",
  },
  {
    id: "refactor_function",
    name: "Refactor a long function",
    agentType: "refactoring",
    description: "Decomposes high-complexity methods into clean, single-responsibility helper functions with minimal cyclomatic complexity.",
    defaultPrompt: "Refactor the loginUser function into modular helpers: validateCredentials, issueSession, and dispatchTelemetry.",
    stepCount: 7,
    steps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    typicalSteps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    icon: "Sparkles",
  },
  {
    id: "explain_module",
    name: "Explain a module for onboarding",
    agentType: "codebase_research",
    description: "Generates comprehensive onboarding guides, sequence diagrams, and architecture walkthroughs for newly joined engineers.",
    defaultPrompt: "Explain the architecture of the authentication service, token lifecycle, and cryptographic verification flow.",
    stepCount: 7,
    steps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    typicalSteps: ["Plan", "Read relevant files", "Analyze", "Propose changes (diff)", "Self-check", "Wait for approval", "Apply"],
    icon: "Layers",
  },
];

export const STEP_DEFINITIONS = [
  { id: "step_plan", title: "Plan", description: "Formulate task plan, scope AST definitions, and evaluate dependencies" },
  { id: "step_read_files", title: "Read relevant files", description: "Inspect targeted repository files, import graphs, and interfaces" },
  { id: "step_analyze", title: "Analyze", description: "Perform semantic AST checks, invariant validation, and contract matching" },
  { id: "step_propose_changes", title: "Propose changes (diff)", description: "Synthesize targeted unified diff patch with line-level context" },
  { id: "step_self_check", title: "Self-check", description: "Verify syntax validity, boundary conditions, and regression safety" },
  { id: "step_wait_for_approval", title: "Wait for approval", description: "Awaiting human review and explicit authorization gate", isApprovalGate: true },
  { id: "step_apply", title: "Apply", description: "Apply approved diff to repository file tree and create Pull Request" },
];

export function validateRunPolicy(
  policy: AgentPolicy | undefined,
  request: StartAgentRunRequest
): { allowed: boolean; reason?: string } {
  if (!policy) return { allowed: true };

  const targetPath = (request.target || "").toLowerCase();
  const templateId = request.templateId || request.workflowType || "unit_tests";

  // 1. Template Allowed Check
  if (policy.allowedTemplates && policy.allowedTemplates.length > 0) {
    if (!policy.allowedTemplates.includes(templateId)) {
      return {
        allowed: false,
        reason: `Blocked by policy: Workflow template '${templateId}' is disabled in workspace safety policies.`,
      };
    }
  }

  // 2. Blocked Paths Check
  if (policy.blockedPaths && policy.blockedPaths.length > 0) {
    for (const blocked of policy.blockedPaths) {
      const cleanBlocked = blocked.toLowerCase().trim();
      if (cleanBlocked && (targetPath.includes(cleanBlocked) || request.taskPrompt.toLowerCase().includes(cleanBlocked))) {
        return {
          allowed: false,
          reason: `Blocked by policy: Target '${request.target}' matches restricted path rule (${blocked}).`,
        };
      }
    }
  }

  // 3. Dependency Upgrade Disallowed Check
  if (templateId === "upgrade_dependency" && policy.allowDependencyUpgrades === false) {
    return {
      allowed: false,
      reason: "Blocked by policy: Automated dependency upgrades are disabled by your workspace administrator.",
    };
  }

  // 4. Max Files Limit Check
  const maxFiles = request.options?.maxFilesToChange || 1;
  if (policy.maxFilesPerRun && maxFiles > policy.maxFilesPerRun) {
    return {
      allowed: false,
      reason: `Blocked by policy: Requested changes touch ${maxFiles} files, exceeding workspace policy limit of ${policy.maxFilesPerRun} files.`,
    };
  }

  return { allowed: true };
}

export function createInitialSteps(): AgentStep[] {
  return STEP_DEFINITIONS.map((def, idx) => ({
    id: def.id,
    order: idx + 1,
    title: def.title,
    description: def.description,
    status: idx === 0 ? "running" : "pending",
    isApprovalGate: def.isApprovalGate,
    startedAt: idx === 0 ? new Date().toISOString() : undefined,
  }));
}

export function generateInitialLogs(run: Partial<AgentRun>): AgentLogLine[] {
  const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return [
    {
      id: `log_${Date.now()}_1`,
      timestamp: ts,
      level: "info",
      message: `Agent execution initialized for repository '${run.repositoryName || run.repositoryId}'.`,
      stepId: "step_plan",
    },
    {
      id: `log_${Date.now()}_2`,
      timestamp: ts,
      level: "info",
      message: `Enforcing workspace safety policy (Human approval required: ${run.requireApproval ? "YES" : "NO"}).`,
      stepId: "step_plan",
    },
    {
      id: `log_${Date.now()}_3`,
      timestamp: ts,
      level: "info",
      message: `Formulating step-by-step reasoning plan for '${run.title || run.taskPrompt}'.`,
      stepId: "step_plan",
    },
  ];
}

export function generatePlanChecklist(templateId: string, target: string): Array<{ id: string; text: string; done: boolean }> {
  switch (templateId) {
    case "unit_tests":
      return [
        { id: "p1", text: `Analyze exported interface and symbol declarations in ${target}`, done: false },
        { id: "p2", text: "Identify critical happy paths and authentication ceremonies", done: false },
        { id: "p3", text: "Isolate edge cases: missing credentials, malformed tokens, inactive accounts", done: false },
        { id: "p4", text: "Synthesize isolated unit tests with zero network side effects", done: false },
        { id: "p5", text: "Validate assertion coverage and syntax correctness", done: false },
      ];
    case "fix_bug":
      return [
        { id: "p1", text: "Correlate error stack trace with symbol line ranges", done: false },
        { id: "p2", text: "Trace variable state and null dereference vulnerabilities", done: false },
        { id: "p3", text: "Construct targeted null-safe guard and error hierarchy", done: false },
        { id: "p4", text: "Generate regression test asserting graceful failure behavior", done: false },
      ];
    case "security_audit":
      return [
        { id: "p1", text: "Inspect all external input entrypoints and deserializers", done: false },
        { id: "p2", text: "Evaluate token verification logic for timing leaks", done: false },
        { id: "p3", text: "Check session invalidation and credential lifetime limits", done: false },
        { id: "p4", text: "Propose hardened authentication guards", done: false },
      ];
    case "upgrade_dependency":
      return [
        { id: "p1", text: "Scan package manifest dependencies and lockfile constraints", done: false },
        { id: "p2", text: "Inspect semver changelog for breaking API changes", done: false },
        { id: "p3", text: "Update package manifest to target secure release", done: false },
        { id: "p4", text: "Verify caller invocations against updated signatures", done: false },
      ];
    case "refactor_function":
      return [
        { id: "p1", text: `Calculate cyclomatic complexity and branch points in ${target}`, done: false },
        { id: "p2", text: "Extract pure validation subroutines", done: false },
        { id: "p3", text: "Decouple telemetry and side effects from core business logic", done: false },
        { id: "p4", text: "Verify interface signature invariance", done: false },
      ];
    default:
      return [
        { id: "p1", text: `Map module structure and exported symbols for ${target}`, done: false },
        { id: "p2", text: "Generate detailed parameter docstrings and type annotations", done: false },
        { id: "p3", text: "Document exceptions, invariants, and sequence contracts", done: false },
      ];
  }
}

export function synthesizeDiff(
  templateId: string,
  targetFile: string,
  originalCode: string | undefined,
  instructions: string,
  feedback?: string
): AgentDiff {
  const file = targetFile || "src/services/auth.ts";

  if (templateId === "unit_tests") {
    const testFile = file.includes("test") ? file : `tests/${file.split("/").pop()?.replace(/\.(ts|js|go|py)$/, ".test.$1") || "auth.test.ts"}`;
    const orig = originalCode || `import { describe, it, expect } from "vitest";\n\ndescribe("Auth Service", () => {\n  it.todo("needs unit tests");\n});\n`;
    
    const extraTests = feedback ? `\n  it("handles feedback adjustments: ${feedback}", () => {\n    expect(true).toBe(true);\n  });` : "";
    
    const newCode = `import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginUser, validateEmail, issueSession } from "../${file}";

describe("Authentication & Token Issuance Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loginUser()", () => {
    it("successfully issues token for verified active credentials", async () => {
      const result = await loginUser("alex@codeatlas.dev", "valid-password");
      expect(result).toBeDefined();
      expect(result.token).toMatch(/^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$/);
      expect(result.user.email).toBe("alex@codeatlas.dev");
    });

    it("throws explicit AuthError when user is null or undefined", async () => {
      await expect(loginUser("", "")).rejects.toThrow("Invalid credentials");
    });

    it("safely rejects inactive or suspended accounts without dereferencing null", async () => {
      await expect(loginUser("disabled@codeatlas.dev", "valid-password")).rejects.toThrow(
        "Account is inactive"
      );
    });
  });

  describe("validateEmail()", () => {
    it("accepts valid RFC-compliant emails", () => {
      expect(validateEmail("developer@company.com")).toBe(true);
      expect(validateEmail("team.lead+testing@codeatlas.io")).toBe(true);
    });

    it("rejects malformed inputs and script injection attempts", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("plainaddress")).toBe(false);
      expect(validateEmail("<script>alert(1)</script>@test.com")).toBe(false);
    });
  });${extraTests}
});
`;
    const patch = `@@ -1,4 +1,42 @@
-import { describe, it, expect } from "vitest";
-
-describe("Auth Service", () => {
-  it.todo("needs unit tests");
-});
+import { describe, it, expect, vi, beforeEach } from "vitest";
+import { loginUser, validateEmail, issueSession } from "../${file}";
+
+describe("Authentication & Token Issuance Suite", () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+  });
+
+  describe("loginUser()", () => {
+    it("successfully issues token for verified active credentials", async () => {
+      const result = await loginUser("alex@codeatlas.dev", "valid-password");
+      expect(result).toBeDefined();
+      expect(result.token).toMatch(/^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*$/);
+      expect(result.user.email).toBe("alex@codeatlas.dev");
+    });
+
+    it("throws explicit AuthError when user is null or undefined", async () => {
+      await expect(loginUser("", "")).rejects.toThrow("Invalid credentials");
+    });
+
+    it("safely rejects inactive or suspended accounts without dereferencing null", async () => {
+      await expect(loginUser("disabled@codeatlas.dev", "valid-password")).rejects.toThrow(
+        "Account is inactive"
+      );
+    });
+  });
+
  describe("validateEmail()", () => {
    it("accepts valid RFC-compliant emails", () => {
      expect(validateEmail("developer@company.com")).toBe(true);
      expect(validateEmail("team.lead+testing@codeatlas.io")).toBe(true);
    });

    it("rejects malformed inputs and script injection attempts", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("plainaddress")).toBe(false);
      expect(validateEmail("<script>alert(1)</script>@test.com")).toBe(false);
    });
  });
});`;
    return {
      file: testFile,
      originalContent: orig,
      newContent: newCode,
      patch,
      additions: 42,
      deletions: 4,
    };
  }

  if (templateId === "fix_bug") {
    const orig = originalCode || `export async function loginUser(email: string, pass: string) {\n  const user = await findUserByEmail(email);\n  const session = issueToken(user);\n  return { token: session.token, user };\n}\n`;
    const newCode = `export async function loginUser(email: string, pass: string) {\n  if (!email || !pass) {\n    throw new AuthError("Email and password are required.");\n  }\n  const user = await findUserByEmail(email);\n  if (!user || user.status !== "active") {\n    throw new AuthError("Account inactive or invalid credentials.");\n  }\n  const session = issueToken(user);\n  if (!session || !session.token) {\n    throw new AuthError("Session generation failed.");\n  }\n  return { token: session.token, user };\n}\n`;
    const patch = `@@ -1,5 +1,15 @@
 export async function loginUser(email: string, pass: string) {
+  if (!email || !pass) {
+    throw new AuthError("Email and password are required.");
+  }
   const user = await findUserByEmail(email);
+  if (!user || user.status !== "active") {
+    throw new AuthError("Account inactive or invalid credentials.");
+  }
   const session = issueToken(user);
+  if (!session || !session.token) {
+    throw new AuthError("Session generation failed.");
+  }
   return { token: session.token, user };
 }`;
    return {
      file,
      originalContent: orig,
      newContent: newCode,
      patch,
      additions: 10,
      deletions: 0,
    };
  }

  if (templateId === "upgrade_dependency") {
    const orig = originalCode || `{\n  "dependencies": {\n    "axios": "^1.6.2"\n  }\n}`;
    const newCode = orig.replace(/"\^?1\.[0-6]\.\d+"/, `"^1.7.2"`);
    const patch = `@@ -2,3 +2,3 @@\n   "dependencies": {\n-    "axios": "^1.6.2"\n+    "axios": "^1.7.2"\n   }`;
    return {
      file: file.includes("package.json") ? file : "package.json",
      originalContent: orig,
      newContent: newCode,
      patch,
      additions: 1,
      deletions: 1,
    };
  }

  // Default / Refactor / Documentation
  const orig = originalCode || `export function processData(input: any) {\n  return input;\n}\n`;
  const newCode = `/**\n * Process and sanitize data payload.\n * @param input Raw payload object\n * @returns Normalized data structure\n */\nexport function processData(input: any) {\n  if (!input) return null;\n  return { ...input, timestamp: Date.now() };\n}\n`;
  const patch = `@@ -1,3 +1,8 @@\n+/**\n+ * Process and sanitize data payload.\n+ * @param input Raw payload object\n+ * @returns Normalized data structure\n+ */\n export function processData(input: any) {\n+  if (!input) return null;\n-  return input;\n+  return { ...input, timestamp: Date.now() };\n }`;

  return {
    file,
    originalContent: orig,
    newContent: newCode,
    patch,
    additions: 7,
    deletions: 1,
  };
}
