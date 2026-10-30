import { ApiResponse } from "@/types/api";
import { AuthUser } from "@/types/auth";
import { SAMPLE_REPOSITORIES_DATA } from "@/lib/constants";
import { SAMPLE_PROJECT_TREE, SAMPLE_PROJECT_CODE } from "@/lib/sample-repository-files";
import { DEMO_REPOSITORY_INFO, DEMO_TRACE_STEPS, DEMO_GROUNDED_QUERIES, DEMO_CHANGE_IMPACT, DEMO_SYMBOL_RESOLUTION } from "./demo-data";

/**
 * Checks whether the application is running in static demo mode.
 */
export function isDemoMode(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    return true;
  }
  if (typeof window !== "undefined") {
    if ((window as any).__CODEATLAS_DEMO_MODE === true) return true;
    try {
      if (localStorage.getItem("codeatlas_demo_mode") === "true") return true;
    } catch {}
    if (window.location.hostname.endsWith("github.io")) return true;
  }
  return false;
}

export const DEMO_USER: AuthUser = {
  id: "usr_demo",
  name: "Demo User",
  email: "demo@codeatlas.dev",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  role: "Lead Systems Architect",
  provider: "demo",
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STORAGE_KEY = "codeatlas_demo_store_v2";

interface DemoStore {
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
  pullRequests: any[];
  reviewSessions: Record<string, any>;
  agentRuns: any[];
  debugInvestigations: any[];
  debugFollowUps: Record<string, any[]>;
  refactoringProposals: any[];
  notifications: any[];
  activities: any[];
  userSettings: any;
  circuitBreakers: Record<string, any>;
  alertRules: any[];
  logs: any[];
  traces: any[];
}

function getInitialStore(): DemoStore {
  const initialRepos = [
    {
      id: "sample-project",
      name: "demo-auth-service",
      owner: "codeatlas-demo",
      description: "Authentication & Session Management Architecture with AST symbol graphs and verified tests.",
      visibility: "public",
      language: "TypeScript",
      defaultBranch: "main",
      url: "https://github.com/codeatlas-demo/demo-auth-service",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 24,
      fileCount: 5,
      lastAnalyzed: "Just now",
      isIndexed: true,
      connectionType: "sample",
      loc: 1420,
    },
    ...SAMPLE_REPOSITORIES_DATA.map((r) => ({
      ...r,
      defaultBranch: r.branch || "main",
      url: `https://github.com/${r.owner}/${r.name}`,
      isIndexed: r.status === "ready",
      fileCount: r.symbolCount > 10 ? 12 : 4,
    })),
    {
      id: "shared-core-lib",
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
      symbolCount: 16,
      fileCount: 6,
      lastAnalyzed: "Today at 09:30 AM",
      isIndexed: true,
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
      defaultBranch: "main",
      url: "https://github.com/acme-corp/payment-service",
      status: "ready",
      progress: 100,
      currentStage: "Completed",
      symbolCount: 12,
      fileCount: 5,
      lastAnalyzed: "Yesterday at 04:20 PM",
      isIndexed: true,
      connectionType: "sample",
      loc: 1840,
    },
  ];

  const initialWorkspaces = [
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

  const initialMembers = {
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
  };

  const initialWorkspaceRepos = {
    ws_team_demo: [
      { id: "wsr_1", workspaceId: "ws_team_demo", repositoryId: "sample-project", addedBy: "usr_demo", addedAt: "2026-01-01T00:00:00.000Z" },
      { id: "wsr_2", workspaceId: "ws_team_demo", repositoryId: "shared-core-lib", addedBy: "usr_demo", addedAt: "2026-01-02T00:00:00.000Z" },
      { id: "wsr_3", workspaceId: "ws_team_demo", repositoryId: "payment-service", addedBy: "usr_demo", addedAt: "2026-01-02T00:00:00.000Z" },
    ],
  };

  const initialWorkspaceAnnotations = {
    ws_team_demo: [
      {
        id: "anno_1",
        workspaceId: "ws_team_demo",
        repositoryId: "sample-project",
        filePath: "src/services/auth.ts",
        startLine: 18,
        endLine: 42,
        symbolName: "loginUser",
        category: "architecture",
        content: "Core authentication gateway method. Validates user credentials, queries user database, and generates JWT session tokens.",
        authorId: "usr_demo",
        authorName: "Demo User",
        authorAvatar: DEMO_USER.avatar,
        createdAt: "2026-01-15T10:00:00.000Z",
        updatedAt: "2026-01-15T10:00:00.000Z",
      },
      {
        id: "anno_2",
        workspaceId: "ws_team_demo",
        repositoryId: "sample-project",
        filePath: "src/utils/validation.ts",
        startLine: 4,
        endLine: 15,
        symbolName: "validateEmail",
        category: "tip",
        content: "Uses RFC 5322 regex validation. Ensure input is trimmed before checking.",
        authorId: "usr_elena",
        authorName: "Elena Rostova",
        authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
        createdAt: "2026-01-16T14:20:00.000Z",
        updatedAt: "2026-01-16T14:20:00.000Z",
      },
    ],
  };

  const initialWorkspaceArtifacts = {
    ws_team_demo: [
      {
        id: "art_1",
        workspaceId: "ws_team_demo",
        repositoryId: "sample-project",
        title: "Authentication Architecture Specification",
        description: "Full call graph and API schema analysis for the authentication pipeline.",
        type: "architecture_snapshot",
        creatorId: "usr_demo",
        creatorName: "Demo User",
        creatorAvatar: DEMO_USER.avatar,
        content: "# Authentication Architecture\n\nThe authentication pipeline spans `LoginForm.tsx` -> `loginUser()` -> `validateEmail()` -> persistent database store.",
        visibility: "workspace",
        createdAt: "2026-01-10T12:00:00.000Z",
        updatedAt: "2026-01-10T12:00:00.000Z",
      },
    ],
  };

  const initialPullRequests = [
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

  const initialReviewSession = {
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
  };

  const initialAgentRuns = [
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
          hypotheses: [
            {
              id: "hyp-1",
              title: "Inactive user account returns null session record",
              explanation: "When `user.isActive === false`, the issuing service returns null instead of throwing an AuthError.",
              likelihood: "high",
              confidenceScore: 0.95,
            },
          ],
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
      steps: [],
      citations: [],
    },
  ];

  const initialDebugInvestigations = [
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
      {
        filePath: "src/components/LoginForm.tsx",
        symbolName: "handleSubmit",
        lineRange: { start: 26, end: 52 },
        complexityScore: 9,
        lineCount: 27,
        nestingDepth: 3,
        rationale: "Form submit orchestrates validation, error mapping, and navigation side-effects.",
      },
    ],
  };

  const initialRefactoringProposals = [
    {
      id: "prop_demo_1",
      repositoryId: "sample-project",
      userId: "usr_demo",
      title: "Extract email & password verification guards into standalone validator",
      operationType: "extract_function",
      filePath: "src/services/auth.ts",
      symbolName: "loginUser",
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

  return {
    workspaces: initialWorkspaces,
    workspaceMembers: initialMembers,
    workspaceRepositories: initialWorkspaceRepos,
    workspaceAnnotations: initialWorkspaceAnnotations,
    workspaceArtifacts: initialWorkspaceArtifacts,
    workspaceActivities: {},
    discussions: {
      "finding-sec-1": [
        {
          id: "disc_1",
          workspaceId: "ws_team_demo",
          repositoryId: "sample-project",
          findingId: "finding-sec-1",
          authorId: "usr_elena",
          authorName: "Elena Rostova",
          authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
          comment: "Good catch. We should add a Redis `SETNX` lock on the challenge nonce with a 120s TTL.",
          createdAt: "2026-01-21T15:00:00.000Z",
        },
      ],
    },
    decisions: {
      "finding-sec-1": {
        findingId: "finding-sec-1",
        status: "open",
        assigneeId: "usr_elena",
        updatedAt: "2026-01-21T15:00:00.000Z",
      },
    },
    invitations: [
      {
        id: "inv_1",
        workspaceId: "ws_team_demo",
        email: "invited.dev@codeatlas.dev",
        role: "member",
        token: "preview-token",
        tokenHash: "hash_preview",
        status: "pending",
        invitedBy: "usr_demo",
        invitedByName: "Demo User",
        expiresAt: "2026-12-31T23:59:59.000Z",
        createdAt: "2026-01-20T00:00:00.000Z",
      },
    ],
    repositories: initialRepos,
    pullRequests: initialPullRequests,
    reviewSessions: {
      "sample-project_101": initialReviewSession,
    },
    agentRuns: initialAgentRuns,
    debugInvestigations: initialDebugInvestigations,
    debugFollowUps: {
      inv_demo_1: [
        {
          id: "qa_1",
          investigationId: "inv_demo_1",
          question: "Can this crash happen for normal registered users?",
          answer: "No. Standard registered users always receive a valid session token upon correct password verification. This crash occurs exclusively when an account is marked as `isActive: false` (e.g. unverified email or administrative suspension).",
          createdAt: "2026-01-25T10:05:00.000Z",
        },
      ],
    },
    refactoringProposals: initialRefactoringProposals,
    notifications: [
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
    ],
    activities: [
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
    ],
    userSettings: {
      userId: "usr_demo",
      explanationStyle: "detailed",
      responseDetail: "standard",
      defaultRepoContext: "sample-project",
      preferredModel: "gemini-1.5-pro",
      useStreaming: true,
      showLineNumbers: true,
      reducedMotion: false,
      updatedAt: new Date().toISOString(),
    },
    circuitBreakers: {
      ai_provider: { name: "ai_provider", state: "CLOSED", failures: 0, lastFailure: null },
      github_api: { name: "github_api", state: "CLOSED", failures: 0, lastFailure: null },
      db_pool: { name: "db_pool", state: "CLOSED", failures: 0, lastFailure: null },
    },
    alertRules: [
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
    ],
    logs: [
      {
        id: "log_1",
        timestamp: new Date().toISOString(),
        level: "info",
        service: "codeatlas-core",
        environment: "production",
        correlationId: "req_demo_init",
        operation: "auth.session",
        outcome: "success",
        userId: "usr_demo",
        metadata: { client: "web-spa", mode: "demo" },
      },
      {
        id: "log_2",
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: "info",
        service: "ast-indexer",
        environment: "production",
        correlationId: "req_ast_index",
        operation: "indexer.parse",
        outcome: "success",
        repositoryId: "sample-project",
        metadata: { symbolsResolved: 24, relationships: 15 },
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

let memoryStore: DemoStore | null = null;

function getStore(): DemoStore {
  if (memoryStore) return memoryStore;
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        memoryStore = JSON.parse(saved);
        return memoryStore!;
      }
    } catch {}
  }
  memoryStore = getInitialStore();
  saveStore();
  return memoryStore;
}

function saveStore() {
  if (typeof window !== "undefined" && memoryStore) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
    } catch {}
  }
}

/**
 * Pure client mock router that handles any /api/* endpoint and returns typed JSON responses.
 */
export async function handleMockRequest(
  method: string,
  rawPath: string,
  body?: any,
  params?: any
): Promise<any> {
  const store = getStore();
  const normalizedMethod = (method || "GET").toUpperCase();

  // Normalize path: strip query strings, domain, and trailing slash
  let cleanPath = rawPath.replace(/^[a-z]+:\/\/[^/]+/i, "");
  if (cleanPath.includes("?")) {
    cleanPath = cleanPath.split("?")[0];
  }
  cleanPath = cleanPath.replace(/\/$/, "");
  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
  if (!cleanPath.startsWith("/api")) cleanPath = "/api" + cleanPath;

  // Convert params to URLSearchParams helper
  const searchParams =
    params instanceof URLSearchParams
      ? params
      : new URLSearchParams(
          typeof params === "object" && params !== null
            ? Object.entries(params).reduce((acc, [k, v]) => {
                if (v !== undefined && v !== null) acc[k] = String(v);
                return acc;
              }, {} as Record<string, string>)
            : {}
        );

  const timestamp = new Date().toISOString();

  // ---------------------------------------------------------------------------
  // 1. AUTHENTICATION & SESSION ENDPOINTS
  // ---------------------------------------------------------------------------
  if (cleanPath === "/api/auth/session") {
    if (normalizedMethod === "DELETE") {
      if (typeof window !== "undefined") {
        try { localStorage.setItem("codeatlas_demo_active_user", "logged_out"); } catch {}
      }
      return { success: true, message: "Logged out of demo session." };
    }
    return {
      success: true,
      authenticated: true,
      isAuthenticated: true,
      user: DEMO_USER,
      auth: {
        github: { connected: true, username: "demo-developer" },
        google: { connected: true, email: "demo@codeatlas.dev" },
      },
      timestamp,
    };
  }

  if (cleanPath === "/api/auth/login" || cleanPath === "/api/auth/google" || cleanPath === "/api/auth/register") {
    if (typeof window !== "undefined") {
      try { localStorage.removeItem("codeatlas_demo_active_user"); } catch {}
    }
    return {
      success: true,
      user: DEMO_USER,
      access_token: "demo_bearer_token_codeatlas_static",
      message: "Authenticated successfully in Demo Mode.",
      timestamp,
    };
  }

  if (cleanPath === "/api/auth/github/status") {
    return {
      success: true,
      data: {
        connected: true,
        username: "demo-developer",
        avatar: DEMO_USER.avatar,
        scopes: ["read:user", "repo", "user:email"],
        connectedAt: "2026-01-01T00:00:00.000Z",
        isConfigured: true,
        isSandbox: true,
        repoCount: store.repositories.length,
      },
      connected: true,
      username: "demo-developer",
      avatar: DEMO_USER.avatar,
      scopes: ["read:user", "repo", "user:email"],
      connectedAt: "2026-01-01T00:00:00.000Z",
      isConfigured: true,
      isSandbox: true,
      repoCount: store.repositories.length,
      timestamp,
    };
  }

  if (cleanPath === "/api/auth/github/disconnect") {
    return { success: true, data: { disconnected: true }, timestamp };
  }

  // ---------------------------------------------------------------------------
  // 2. GITHUB REST REPOSITORIES & PRS
  // ---------------------------------------------------------------------------
  if (cleanPath === "/api/github/repos") {
    const list = store.repositories.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: `${r.owner}/${r.name}`,
      owner: r.owner,
      ownerAvatar: DEMO_USER.avatar,
      description: r.description,
      visibility: r.visibility,
      language: r.language,
      defaultBranch: r.defaultBranch,
      url: r.url,
      stars: 42,
      updatedAt: r.lastAnalyzed,
      isArchived: false,
      isAlreadyIndexed: r.isIndexed,
    }));
    return {
      success: true,
      data: list,
      meta: { total: list.length, page: 1, perPage: 25, totalPages: 1, isSandbox: true },
      timestamp,
    };
  }

  if (cleanPath === "/api/github/pulls") {
    return {
      success: true,
      data: store.pullRequests,
      pullRequests: store.pullRequests,
      timestamp,
    };
  }

  const ghPrMatch = cleanPath.match(/^\/api\/github\/pulls\/(\d+)$/);
  if (ghPrMatch) {
    const prNum = parseInt(ghPrMatch[1], 10);
    const pr = store.pullRequests.find((p) => p.number === prNum) || store.pullRequests[0];
    return { success: true, data: pr, pullRequest: pr, timestamp };
  }

  // ---------------------------------------------------------------------------
  // 3. REPOSITORIES ENDPOINTS
  // ---------------------------------------------------------------------------
  if (cleanPath === "/api/repositories") {
    if (normalizedMethod === "POST") {
      const newRepo = {
        id: (body?.name || "new-repo").toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
        name: body?.name || "new-repo",
        owner: body?.owner || "you",
        description: body?.description || "Connected repository AST index.",
        visibility: body?.visibility || "private",
        language: body?.language || "TypeScript",
        defaultBranch: "main",
        url: body?.url || "https://github.com/demo/repo",
        status: "ready",
        progress: 100,
        currentStage: "Completed",
        symbolCount: 14,
        fileCount: 4,
        lastAnalyzed: "Just now",
        isIndexed: true,
        connectionType: body?.connectionType || "github",
        loc: 850,
      };
      store.repositories.unshift(newRepo);
      saveStore();
      return { success: true, data: newRepo, timestamp };
    }
    return {
      success: true,
      data: store.repositories,
      repositories: store.repositories,
      timestamp,
    };
  }

  const repoDetailMatch = cleanPath.match(/^\/api\/repositories\/([^/]+)$/);
  if (repoDetailMatch) {
    const rId = decodeURIComponent(repoDetailMatch[1]);
    if (normalizedMethod === "DELETE") {
      store.repositories = store.repositories.filter((r) => r.id !== rId);
      saveStore();
      return { success: true, message: "Repository deleted", timestamp };
    }
    const repo = store.repositories.find((r) => r.id === rId) || store.repositories[0];
    return { success: true, data: repo, timestamp };
  }

  // Repository Sub-features
  const repoKnowledgeMatch = cleanPath.match(/^\/api\/repositories\/([^/]+)\/knowledge-graph$/);
  if (repoKnowledgeMatch) {
    return {
      success: true,
      data: {
        nodes: [
          { id: "sym-1", name: "loginUser", type: "function", file: "src/services/auth.ts", line: 18, verified: true, metrics: { callers: 2, callees: 2 } },
          { id: "sym-2", name: "LoginForm", type: "component", file: "src/components/LoginForm.tsx", line: 6, verified: true, metrics: { callers: 1, callees: 1 } },
          { id: "sym-3", name: "validateEmail", type: "function", file: "src/utils/validation.ts", line: 4, verified: true, metrics: { callers: 1, callees: 0 } },
        ],
        edges: [
          { source: "sym-2", target: "sym-1", relationship: "calls", verified: true },
          { source: "sym-1", target: "sym-3", relationship: "calls", verified: true },
        ],
      },
      timestamp,
    };
  }

  const repoHealthMatch = cleanPath.match(/^\/api\/repositories\/([^/]+)\/health-insights$/);
  if (repoHealthMatch) {
    return {
      success: true,
      data: {
        score: 88,
        grade: "B+",
        criticalIssues: 0,
        warningsCount: 2,
        insights: [
          { id: "ins-1", title: "Test coverage on auth edge cases", description: "Increase unit test scenarios for inactive user logins.", severity: "info", dismissed: false },
        ],
      },
      timestamp,
    };
  }

  const repoOnboardingMatch = cleanPath.match(/^\/api\/repositories\/([^/]+)\/onboarding$/);
  if (repoOnboardingMatch) {
    return {
      success: true,
      overview: {
        id: "sample-project",
        name: "demo-auth-service",
        summary: "Production authentication & session management microservice.",
        architectureSummary: "Three-tier architecture: React form -> domain auth handler -> persistent db store.",
        primaryEntryPoints: [{ name: "loginUser", file: "src/services/auth.ts", line: 18, type: "service" }],
        keyModules: [{ name: "Auth Service", file: "src/services/auth.ts", responsibility: "Session lifecycle" }],
      },
      journey: {
        steps: [
          { id: "step-intro", title: "Understand Architecture", description: "Review 3-tier auth pipeline", completed: true },
          { id: "step-symbols", title: "Trace Primary Entry Point", description: "Follow loginUser AST call chain", completed: false },
          { id: "step-tests", title: "Run Verified Test Suite", description: "Inspect auth.test.ts assertions", completed: false },
        ],
        progress: 33,
      },
      timestamp,
    };
  }

  const repoLearningMatch = cleanPath.match(/^\/api\/repositories\/([^/]+)\/learning-path$/);
  if (repoLearningMatch) {
    return {
      success: true,
      modules: [
        {
          id: "mod-1",
          title: "Module 1: Authentication Core",
          description: "Understanding loginUser and input validation",
          steps: [{ id: "m1-s1", title: "Inspect LoginForm.tsx", completed: true }],
        },
      ],
      timestamp,
    };
  }

  const repoWorkflowMatch = cleanPath.match(/^\/api\/repositories\/([^/]+)\/workflow-trace$/);
  if (repoWorkflowMatch) {
    return {
      success: true,
      trace: {
        entryPoint: "handleSubmit",
        steps: DEMO_TRACE_STEPS,
      },
      availableEntryPoints: [
        { name: "handleSubmit", file: "src/components/LoginForm.tsx", line: 26, description: "DOM Form Submit Entry" },
        { name: "loginUser", file: "src/services/auth.ts", line: 18, description: "Domain Auth Handler" },
      ],
      timestamp,
    };
  }

  const repoSymbolNavMatch = cleanPath.match(/^\/api\/repositories\/([^/]+)\/symbols\/navigate$/);
  if (repoSymbolNavMatch) {
    return {
      success: true,
      target: {
        symbol: DEMO_SYMBOL_RESOLUTION.name,
        type: DEMO_SYMBOL_RESOLUTION.type,
        file: DEMO_SYMBOL_RESOLUTION.file,
        line: DEMO_SYMBOL_RESOLUTION.line,
        signature: DEMO_SYMBOL_RESOLUTION.signature,
        callers: [{ name: "handleSubmit", file: "src/components/LoginForm.tsx", line: 26 }],
        callees: [{ name: "validateEmail", file: "src/utils/validation.ts", line: 4 }],
      },
      timestamp,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. WORKSPACES ENDPOINTS
  // ---------------------------------------------------------------------------
  if (cleanPath === "/api/workspaces") {
    if (normalizedMethod === "POST") {
      const name = body?.name || "New Team Workspace";
      const newWs = {
        id: `ws_${Date.now()}`,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
        description: body?.description || "Collaborative engineering workspace.",
        ownerId: "usr_demo",
        isPersonal: false,
        userRole: "owner",
        memberCount: 1,
        repoCount: 0,
        settings: {
          allowMemberInvites: true,
          requireReviewDismissalReason: false,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      store.workspaces.push(newWs);
      store.workspaceMembers[newWs.id] = [
        {
          id: `mem_${Date.now()}`,
          workspaceId: newWs.id,
          userId: "usr_demo",
          role: "owner",
          joinedAt: timestamp,
          userName: DEMO_USER.name,
          userEmail: DEMO_USER.email,
          userAvatar: DEMO_USER.avatar,
        },
      ];
      saveStore();
      return { success: true, data: newWs, workspace: newWs, timestamp };
    }

    return {
      success: true,
      workspaces: store.workspaces,
      data: { workspaces: store.workspaces },
      timestamp,
    };
  }

  const wsDetailMatch = cleanPath.match(/^\/api\/workspaces\/([^/]+)$/);
  if (wsDetailMatch) {
    const wsId = wsDetailMatch[1];
    const ws = store.workspaces.find((w) => w.id === wsId) || store.workspaces[0];
    if (normalizedMethod === "PATCH") {
      Object.assign(ws, body);
      saveStore();
      return { success: true, data: ws, workspace: ws, timestamp };
    }
    return {
      success: true,
      data: {
        workspace: ws,
        members: store.workspaceMembers[wsId] || store.workspaceMembers["ws_team_demo"] || [],
        repositories: store.workspaceRepositories[wsId] || store.workspaceRepositories["ws_team_demo"] || [],
        annotations: store.workspaceAnnotations[wsId] || store.workspaceAnnotations["ws_team_demo"] || [],
        artifacts: store.workspaceArtifacts[wsId] || store.workspaceArtifacts["ws_team_demo"] || [],
        activity: [],
      },
      workspace: ws,
      members: store.workspaceMembers[wsId] || store.workspaceMembers["ws_team_demo"] || [],
      repositories: store.workspaceRepositories[wsId] || store.workspaceRepositories["ws_team_demo"] || [],
      annotations: store.workspaceAnnotations[wsId] || store.workspaceAnnotations["ws_team_demo"] || [],
      artifacts: store.workspaceArtifacts[wsId] || store.workspaceArtifacts["ws_team_demo"] || [],
      timestamp,
    };
  }

  // Workspace sub-collections
  const wsSubMatch = cleanPath.match(/^\/api\/workspaces\/([^/]+)\/(members|repositories|annotations|artifacts|activity|invitations)$/);
  if (wsSubMatch) {
    const wsId = wsSubMatch[1];
    const sub = wsSubMatch[2];

    if (normalizedMethod === "POST") {
      if (sub === "annotations") {
        const item = {
          id: `anno_${Date.now()}`,
          workspaceId: wsId,
          repositoryId: body?.repositoryId || "sample-project",
          filePath: body?.filePath || "src/services/auth.ts",
          startLine: body?.startLine || 1,
          endLine: body?.endLine || 10,
          symbolName: body?.symbolName || "function",
          category: body?.category || "architecture",
          content: body?.content || "",
          authorId: "usr_demo",
          authorName: "Demo User",
          authorAvatar: DEMO_USER.avatar,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        if (!store.workspaceAnnotations[wsId]) store.workspaceAnnotations[wsId] = [];
        store.workspaceAnnotations[wsId].unshift(item);
        saveStore();
        return { success: true, data: { annotation: item }, annotation: item, timestamp };
      }
      if (sub === "artifacts") {
        const art = {
          id: `art_${Date.now()}`,
          workspaceId: wsId,
          repositoryId: body?.repositoryId || "sample-project",
          title: body?.title || "New Architecture Artifact",
          description: body?.description || "",
          type: body?.type || "architecture_snapshot",
          creatorId: "usr_demo",
          creatorName: "Demo User",
          creatorAvatar: DEMO_USER.avatar,
          content: body?.content || "# Artifact Documentation",
          visibility: "workspace",
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        if (!store.workspaceArtifacts[wsId]) store.workspaceArtifacts[wsId] = [];
        store.workspaceArtifacts[wsId].unshift(art);
        saveStore();
        return { success: true, data: { artifact: art }, artifact: art, timestamp };
      }
      if (sub === "invitations") {
        const inv = {
          id: `inv_${Date.now()}`,
          workspaceId: wsId,
          email: body?.email,
          role: body?.role || "member",
          token: `invite-${Date.now()}`,
          status: "pending",
          invitedBy: "usr_demo",
          invitedByName: "Demo User",
          expiresAt: "2026-12-31T23:59:59.000Z",
          createdAt: timestamp,
        };
        store.invitations.unshift(inv);
        saveStore();
        return { success: true, data: { invitation: inv }, invitation: inv, timestamp };
      }
    }

    if (sub === "members") return { success: true, data: store.workspaceMembers[wsId] || store.workspaceMembers["ws_team_demo"] || [], members: store.workspaceMembers[wsId] || [], timestamp };
    if (sub === "repositories") return { success: true, data: store.workspaceRepositories[wsId] || store.workspaceRepositories["ws_team_demo"] || [], repositories: store.workspaceRepositories[wsId] || [], timestamp };
    if (sub === "annotations") return { success: true, data: store.workspaceAnnotations[wsId] || store.workspaceAnnotations["ws_team_demo"] || [], annotations: store.workspaceAnnotations[wsId] || [], timestamp };
    if (sub === "artifacts") return { success: true, data: store.workspaceArtifacts[wsId] || store.workspaceArtifacts["ws_team_demo"] || [], artifacts: store.workspaceArtifacts[wsId] || [], timestamp };
    if (sub === "activity") return { success: true, data: [], activity: [], timestamp };
    if (sub === "invitations") return { success: true, data: store.invitations.filter((i) => i.workspaceId === wsId), timestamp };
  }

  // Finding discussions & decisions
  const discMatch = cleanPath.match(/^\/api\/workspaces\/([^/]+)\/reviews\/([^/]+)\/discussions$/);
  if (discMatch) {
    const fId = searchParams.get("findingId") || body?.findingId || "finding-sec-1";
    if (normalizedMethod === "POST") {
      if (body?.comment) {
        const newComm = {
          id: `disc_${Date.now()}`,
          findingId: fId,
          authorId: "usr_demo",
          authorName: "Demo User",
          authorAvatar: DEMO_USER.avatar,
          comment: body.comment,
          createdAt: timestamp,
        };
        if (!store.discussions[fId]) store.discussions[fId] = [];
        store.discussions[fId].push(newComm);
        saveStore();
        return { success: true, data: { discussion: newComm }, timestamp };
      }
      if (body?.decision) {
        store.decisions[fId] = {
          findingId: fId,
          ...body.decision,
          updatedAt: timestamp,
        };
        saveStore();
        return { success: true, data: { decision: store.decisions[fId] }, timestamp };
      }
    }
    return {
      success: true,
      data: {
        discussions: store.discussions[fId] || [],
        decision: store.decisions[fId] || { findingId: fId, status: "open" },
      },
      timestamp,
    };
  }

  // Invitations
  const invMatch = cleanPath.match(/^\/api\/invitations\/([^/]+)$/);
  if (invMatch) {
    const tok = invMatch[1];
    const inv = store.invitations.find((i) => i.token === tok) || store.invitations[0];
    if (normalizedMethod === "POST") {
      inv.status = "accepted";
      saveStore();
      return { success: true, message: "Invitation accepted", timestamp };
    }
    return {
      success: true,
      data: {
        invitation: inv,
        workspace: store.workspaces.find((w) => w.id === inv.workspaceId) || store.workspaces[0],
      },
      invitation: inv,
      timestamp,
    };
  }

  // ---------------------------------------------------------------------------
  // 5. AI ASSISTANT, CODELENS, AND DEBUG
  // ---------------------------------------------------------------------------
  if (cleanPath === "/api/assistant/query" || cleanPath === "/assistant/query") {
    await delay(500);
    const q = (body?.question || "").toLowerCase();
    let canned = DEMO_GROUNDED_QUERIES[0];
    if (q.includes("database") || q.includes("store") || q.includes("persistence")) {
      canned = DEMO_GROUNDED_QUERIES[1];
    } else if (q.includes("test") || q.includes("coverage") || q.includes("verify")) {
      canned = DEMO_GROUNDED_QUERIES[2];
    }
    return {
      success: true,
      data: {
        answer: canned.answer,
        sources: canned.citations.map((c) => ({
          file: c.file,
          lineRange: `${c.lineRange[0]}-${c.lineRange[1]}`,
          startLine: c.lineRange[0],
          endLine: c.lineRange[1],
          snippet: c.snippet,
          symbol: c.symbolName,
          reason: "Verified AST call graph edge",
        })),
        confirmedFacts: [
          "Authentication initiates at src/components/LoginForm.tsx:26",
          "loginUser() validates password hash and issues session tokens",
          "Automated tests in tests/auth.test.ts assert status 200 OK",
        ],
        inferredFacts: ["Access tokens are stored in client localStorage for subsequent Bearer authorization headers"],
        confidence: "supported",
      },
      answer: canned.answer,
      timestamp,
    };
  }

  if (cleanPath === "/api/codelens/explain" || cleanPath === "/codelens/explain") {
    await delay(450);
    const code = body?.code || "";
    const lang = body?.language || "typescript";
    return {
      success: true,
      data: {
        summary: "This snippet implements authentication input validation and session credential verification.",
        language: lang.toUpperCase(),
        purpose: "Authentication & Credential Verification Handler",
        lineByLine: code.trim().split("\n").slice(0, 10).map((text: string, idx: number) => ({
          line: idx + 1,
          text,
          explanation: text.trim().startsWith("import")
            ? "Module dependency import"
            : text.includes("function")
            ? "Function declaration and parameter binding"
            : "Logical statement evaluation",
        })),
        keyFunctions: [{ name: "loginUser()", description: "Primary credential verification routine", scope: "Module" }],
        keyVariables: [{ name: "credentials", type: "LoginCredentials", description: "Supplied email and password payload" }],
        algorithmLogic: "1. Validate email syntax.\n2. Ingest user credentials.\n3. Verify password hash.\n4. Return session token.",
        potentialIssues: ["Ensure password hashing uses constant-time comparison to prevent timing attacks."],
        complexity: { time: "O(1) constant-time execution", space: "O(1) auxiliary space" },
        isSimulated: true,
      },
      timestamp,
    };
  }

  if (cleanPath === "/api/codelens/extract" || cleanPath === "/codelens/extract") {
    await delay(600);
    return {
      success: true,
      data: {
        code: `// Extracted via CodeLens Vision OCR\nexport async function authenticate(token: string) {\n  return jwt.verify(token, SECRET);\n}`,
        confidence: 0.94,
        languageDetected: "TypeScript",
        lineCount: 4,
      },
      timestamp,
    };
  }

  // Debug Investigations
  if (cleanPath === "/api/debug/history") {
    return {
      success: true,
      data: { investigations: store.debugInvestigations },
      investigations: store.debugInvestigations,
      timestamp,
    };
  }

  const debugHistMatch = cleanPath.match(/^\/api\/debug\/history\/([^/]+)$/);
  if (debugHistMatch) {
    const invId = debugHistMatch[1];
    const inv = store.debugInvestigations.find((i) => i.id === invId) || store.debugInvestigations[0];
    if (normalizedMethod === "DELETE") {
      store.debugInvestigations = store.debugInvestigations.filter((i) => i.id !== invId);
      saveStore();
      return { success: true, message: "Investigation deleted", timestamp };
    }
    return {
      success: true,
      data: {
        investigation: inv,
        followUps: store.debugFollowUps[invId] || [],
      },
      investigation: inv,
      followUps: store.debugFollowUps[invId] || [],
      timestamp,
    };
  }

  if (cleanPath === "/api/debug/investigate") {
    await delay(700);
    const newInv = {
      id: `inv_${Date.now()}`,
      userId: "usr_demo",
      repositoryId: body?.repositoryId || "sample-project",
      title: body?.errorTitle || "Runtime Crash Analysis",
      stackTrace: body?.stackTrace || "Error: Crash occurred at runtime",
      parsedFrames: store.debugInvestigations[0].parsedFrames,
      hypotheses: store.debugInvestigations[0].hypotheses,
      proposedFixes: store.debugInvestigations[0].proposedFixes,
      testRecommendations: store.debugInvestigations[0].testRecommendations,
      createdAt: timestamp,
      status: "analyzed",
    };
    store.debugInvestigations.unshift(newInv);
    saveStore();
    return { success: true, data: { investigation: newInv }, investigation: newInv, timestamp };
  }

  if (cleanPath === "/api/debug/follow-up") {
    await delay(450);
    const invId = body?.investigationId || "inv_demo_1";
    const newQA = {
      id: `qa_${Date.now()}`,
      investigationId: invId,
      question: body?.question || "How to prevent this error?",
      answer: "Apply a null-coalescing guard or early return check before accessing the property. This guarantees type safety across all caller permutations.",
      createdAt: timestamp,
    };
    if (!store.debugFollowUps[invId]) store.debugFollowUps[invId] = [];
    store.debugFollowUps[invId].push(newQA);
    saveStore();
    return { success: true, data: { followUp: newQA }, followUp: newQA, timestamp };
  }

  if (cleanPath === "/api/debug/apply-patch") {
    return { success: true, message: "Patch applied successfully to working tree.", timestamp };
  }

  // ---------------------------------------------------------------------------
  // 6. REFACTORING & TECHNICAL DEBT
  // ---------------------------------------------------------------------------
  if (cleanPath === "/api/refactoring/quality" || cleanPath === "/refactoring/quality") {
    return {
      success: true,
      data: { debtOverview: getInitialStore().debugInvestigations ? initialDebtOverview(store) : {} },
      debtOverview: initialDebtOverview(store),
      timestamp,
    };
  }

  if (cleanPath === "/api/refactoring/proposals" || cleanPath === "/refactoring/proposals") {
    return {
      success: true,
      data: { proposals: store.refactoringProposals },
      proposals: store.refactoringProposals,
      timestamp,
    };
  }

  if (cleanPath === "/api/refactoring/rename-preview") {
    return {
      success: true,
      data: {
        affectedFiles: ["src/services/auth.ts", "src/components/LoginForm.tsx", "tests/auth.test.ts"],
        occurrences: 9,
        diffPreview: `@@ -18,2 +18,2 @@\n-export async function loginUser(email, pass)\n+export async function ${body?.newName || "authenticateUser"}(email, pass)`,
      },
      timestamp,
    };
  }

  // ---------------------------------------------------------------------------
  // 7. CODE REVIEW & CHANGE IMPACT
  // ---------------------------------------------------------------------------
  if (cleanPath === "/api/review/analyze") {
    await delay(600);
    return {
      success: true,
      data: { session: store.reviewSessions["sample-project_101"] },
      session: store.reviewSessions["sample-project_101"],
      timestamp,
    };
  }

  if (cleanPath === "/api/review/session") {
    const sess = store.reviewSessions["sample-project_101"];
    return { success: true, data: { session: sess }, session: sess, timestamp };
  }

  if (cleanPath === "/api/review/finding") {
    return { success: true, message: "Finding updated", timestamp };
  }

  if (cleanPath === "/api/review/publish-comment") {
    return { success: true, message: "Comment published to GitHub pull request.", timestamp };
  }

  if (cleanPath === "/api/impact/analyze") {
    await delay(500);
    return {
      success: true,
      data: {
        symbol: "loginUser",
        file: "src/services/auth.ts",
        riskLevel: "High",
        riskScore: 82,
        affectedEndpoints: [{ method: "POST", path: "/auth", file: "src/services/auth.ts", line: 18 }],
        affectedComponents: [{ name: "LoginForm.tsx", file: "src/components/LoginForm.tsx", callerLine: 28 }],
        affectedServices: [{ name: "UserService", file: "src/services/auth.ts", line: 38 }],
        testsToRerun: [{ name: "testLoginSuccess", file: "tests/auth.test.ts", line: 18, status: "needs-update" }],
        recommendation: "Modifying loginUser parameter signature will immediately invalidate LoginForm.tsx and auth.test.ts.",
      },
      timestamp,
    };
  }

  // ---------------------------------------------------------------------------
  // 8. ARCHITECTURE GRAPH & PATHS
  // ---------------------------------------------------------------------------
  if (cleanPath === "/api/architecture/graph") {
    return {
      success: true,
      data: {
        repositoryId: "sample-project",
        nodes: [
          { id: "node-login-form", name: "LoginForm", type: "Source file", file: "src/components/LoginForm.tsx", line: 1, callers: ["Browser UI"], callees: ["POST /auth", "validateEmail()"], color: "#6C4DFF" },
          { id: "node-api-auth", name: "POST /auth", type: "API endpoint", file: "src/services/auth.ts", line: 18, callers: ["LoginForm"], callees: ["loginUser()"], color: "#00D69F" },
          { id: "node-login-user", name: "loginUser()", type: "Function", file: "src/services/auth.ts", line: 18, callers: ["POST /auth"], callees: ["validateEmail()", "UserService"], color: "#3178C6" },
          { id: "node-validate-email", name: "validateEmail()", type: "Function", file: "src/utils/validation.ts", line: 4, callers: ["loginUser()", "LoginForm"], callees: [], color: "#FFA114" },
          { id: "node-user-service", name: "UserService", type: "Service", file: "src/services/auth.ts", line: 44, callers: ["loginUser()"], callees: ["db.users"], color: "#FF5E7E" },
          { id: "node-db-users", name: "users (store)", type: "Database", file: "src/services/auth.ts", line: 44, callers: ["UserService"], callees: [], color: "#A0AEC0" },
          { id: "node-auth-test", name: "tests/auth.test.ts", type: "Test suite", file: "tests/auth.test.ts", line: 1, callers: [], callees: ["loginUser()"], color: "#00E5FF" },
        ],
        edges: [
          { id: "e1", source: "node-login-form", target: "node-api-auth", label: "API calls", type: "API calls" },
          { id: "e2", source: "node-login-form", target: "node-validate-email", label: "Function calls", type: "Function calls" },
          { id: "e3", source: "node-api-auth", target: "node-login-user", label: "Function calls", type: "Function calls" },
          { id: "e4", source: "node-login-user", target: "node-user-service", label: "Function calls", type: "Function calls" },
          { id: "e5", source: "node-user-service", target: "node-db-users", label: "Data access", type: "Data access" },
          { id: "e6", source: "node-auth-test", target: "node-login-user", label: "Test coverage", type: "Test coverage" },
        ],
      },
      timestamp,
    };
  }

  if (cleanPath === "/api/architecture/path") {
    const src = searchParams.get("source") || "node-login-form";
    const tgt = searchParams.get("target") || "node-db-users";
    return {
      success: true,
      data: {
        found: true,
        sourceId: src,
        targetId: tgt,
        length: 4,
        steps: [
          { nodeId: "node-login-form", nodeName: "LoginForm", nodeType: "Source file", file: "src/components/LoginForm.tsx", relationshipToNext: "API calls" },
          { nodeId: "node-api-auth", nodeName: "POST /auth", nodeType: "API endpoint", file: "src/services/auth.ts", relationshipToNext: "Function calls" },
          { nodeId: "node-login-user", nodeName: "loginUser()", nodeType: "Function", file: "src/services/auth.ts", relationshipToNext: "Function calls" },
          { nodeId: "node-user-service", nodeName: "UserService", nodeType: "Service", file: "src/services/auth.ts", relationshipToNext: "Data access" },
          { nodeId: "node-db-users", nodeName: "users (store)", nodeType: "Database", file: "src/services/auth.ts" },
        ],
      },
      timestamp,
    };
  }

  if (cleanPath === "/api/architecture/dependencies") {
    const nId = searchParams.get("nodeId") || "node-login-user";
    return {
      success: true,
      data: {
        nodeId: nId,
        nodeName: "loginUser()",
        file: "src/services/auth.ts",
        directDependencies: [{ id: "node-validate-email", name: "validateEmail()", type: "Function", file: "src/utils/validation.ts" }],
        directDependents: [{ id: "node-api-auth", name: "POST /auth", type: "API endpoint", file: "src/services/auth.ts" }],
        transitiveDependencies: ["node-db-users"],
        dependencyDepth: 2,
        isCircular: false,
        linkedTests: [{ name: "testLoginSuccess", file: "tests/auth.test.ts", line: 18 }],
        relatedEndpoints: [{ name: "POST /auth", file: "src/services/auth.ts" }],
        relatedDatabase: [{ name: "users", file: "src/services/auth.ts" }],
      },
      timestamp,
    };
  }

  // ---------------------------------------------------------------------------
  // 9. MULTI-REPO INTELLIGENCE
  // ---------------------------------------------------------------------------
  if (cleanPath === "/api/multi-repo/repositories") {
    return {
      success: true,
      data: {
        repositories: store.repositories.slice(0, 4).map((r) => ({
          id: r.id,
          name: r.name,
          owner: r.owner,
          language: r.language,
          symbolCount: r.symbolCount,
          fileCount: r.fileCount,
          lastAnalyzed: r.lastAnalyzed,
          status: r.status,
        })),
      },
      repositories: store.repositories.slice(0, 4),
      timestamp,
    };
  }

  if (cleanPath === "/api/multi-repo/search") {
    return {
      success: true,
      data: {
        query: searchParams.get("q") || "validateEmail",
        totalMatches: 3,
        results: [
          { repositoryId: "sample-project", repositoryName: "demo-auth-service", file: "src/utils/validation.ts", line: 4, symbol: "validateEmail", snippet: "export function validateEmail(email: string): boolean" },
          { repositoryId: "shared-core-lib", repositoryName: "shared-core-lib", file: "src/validators.ts", line: 12, symbol: "validateEmail", snippet: "export const validateEmail = (val: string) => /.../.test(val)" },
        ],
      },
      timestamp,
    };
  }

  if (cleanPath === "/api/multi-repo/dependencies") {
    return {
      success: true,
      data: {
        nodes: [
          { id: "repo-sample", label: "demo-auth-service", type: "repository" },
          { id: "repo-shared", label: "shared-core-lib", type: "repository" },
          { id: "repo-payment", label: "payment-service", type: "repository" },
        ],
        edges: [
          { source: "repo-sample", target: "repo-shared", label: "imports @acme/shared-utils" },
          { source: "repo-payment", target: "repo-shared", label: "imports @acme/shared-utils" },
        ],
      },
      timestamp,
    };
  }

  if (cleanPath === "/api/multi-repo/duplicates") {
    return {
      success: true,
      data: [
        {
          symbolName: "validateEmail",
          similarity: 0.92,
          occurrences: [
            { repositoryId: "sample-project", file: "src/utils/validation.ts", line: 4 },
            { repositoryId: "shared-core-lib", file: "src/validators.ts", line: 12 },
          ],
          suggestion: "Consolidate duplicate validateEmail into @acme/shared-utils library.",
        },
      ],
      timestamp,
    };
  }

  if (cleanPath === "/api/multi-repo/services") {
    return {
      success: true,
      data: [
        { name: "POST /auth", repository: "demo-auth-service", file: "src/services/auth.ts", line: 18, consumers: ["payment-service", "frontend-spa"] },
      ],
      timestamp,
    };
  }

  if (cleanPath === "/api/multi-repo/technology-insights") {
    return {
      success: true,
      data: {
        languages: [{ name: "TypeScript", count: 3, percentage: 75 }, { name: "Python", count: 1, percentage: 25 }],
        frameworks: ["Next.js", "Express", "Jest", "FastAPI"],
        outdatedDependencies: 2,
      },
      timestamp,
    };
  }

  if (cleanPath === "/api/multi-repo/query") {
    await delay(500);
    return {
      success: true,
      answer: "The shared authentication contract across repositories is defined in `demo-auth-service` via `POST /auth`. Both `payment-service` and client SPAs consume this endpoint with Bearer JWT tokens.",
      citations: [
        { repositoryName: "demo-auth-service", file: "src/services/auth.ts", line: 18 },
      ],
      timestamp,
    };
  }

  // ---------------------------------------------------------------------------
  // 10. AGENT WORKSPACE ENDPOINTS
  // ---------------------------------------------------------------------------
  if (cleanPath === "/api/agents" || cleanPath === "/agents") {
    return {
      success: true,
      agents: [
        { type: "codebase_research", name: "Codebase Research Agent", tagline: "Evidence-backed deep repository exploration and Q&A", iconName: "Search", badgeColor: "cyan", defaultTools: ["search_codebase", "retrieve_source_context"], capabilities: ["AST symbol discovery", "Cross-file references"] },
        { type: "debugging", name: "Debugging Agent", tagline: "Stack trace correlation and hypothesis-driven root-cause analysis", iconName: "Bug", badgeColor: "coral", defaultTools: ["parse_stack_trace", "retrieve_source_context"], capabilities: ["Multi-runtime stack trace parsing", "Reproduction test synthesis"] },
        { type: "code_review", name: "Code Review Agent", tagline: "Correctness defect detection and security analysis", iconName: "ShieldAlert", badgeColor: "brand", defaultTools: ["diff_analyzer", "retrieve_source_context"], capabilities: ["Correctness defect identification", "PR security audit"] },
      ],
      tools: [
        { id: "search_codebase", name: "Search Codebase", category: "search" },
        { id: "retrieve_source_context", name: "Retrieve Source Context", category: "source" },
      ],
      timestamp,
    };
  }

  if (cleanPath === "/api/agents/workflows" || cleanPath === "/agents/workflows") {
    return {
      success: true,
      workflows: [
        { id: "investigate_bug", name: "Investigate a Bug", agentType: "debugging", description: "Parse stack traces, verify source lines, formulate root cause hypotheses.", stepCount: 5 },
        { id: "review_change", name: "Review a Change", agentType: "code_review", description: "Review repository diffs, audit security posture, and report evidence-grounded findings.", stepCount: 3 },
      ],
      timestamp,
    };
  }

  if (cleanPath === "/api/agents/runs" || cleanPath === "/agents/runs") {
    if (normalizedMethod === "POST") {
      const newRun = {
        id: `run_${Date.now()}`,
        agentType: body?.agentType || "debugging",
        repositoryId: body?.repositoryId || "sample-project",
        userId: "usr_demo",
        status: "running",
        objective: body?.objective || "Automated analysis run",
        currentStepIndex: 1,
        totalSteps: 4,
        createdAt: timestamp,
        updatedAt: timestamp,
        steps: [
          { id: "s-1", order: 1, title: "Initialize context and tools", status: "completed" },
          { id: "s-2", order: 2, title: "Inspect target AST symbols", status: "running" },
          { id: "s-3", order: 3, title: "Formulate findings", status: "pending" },
          { id: "s-4", order: 4, title: "Generate recommendations", status: "pending" },
        ],
        citations: [],
        findings: [],
      };
      store.agentRuns.unshift(newRun);
      saveStore();
      return { success: true, data: { run: newRun }, run: newRun, timestamp };
    }
    return {
      success: true,
      data: { runs: store.agentRuns },
      runs: store.agentRuns,
      timestamp,
    };
  }

  const agentRunDetailMatch = cleanPath.match(/^\/api\/agents\/runs\/([^/]+)$/);
  if (agentRunDetailMatch) {
    const runId = agentRunDetailMatch[1];
    const run = store.agentRuns.find((r) => r.id === runId) || store.agentRuns[0];
    return { success: true, data: { run }, run, timestamp };
  }

  // ---------------------------------------------------------------------------
  // 11. TELEMETRY, HEALTH, SETTINGS & ACTIVITIES
  // ---------------------------------------------------------------------------
  if (cleanPath === "/api/telemetry/metrics" || cleanPath === "/telemetry/metrics") {
    return {
      success: true,
      data: {
        timestamp,
        p95LatencyMs: 38,
        requestsPerMinute: 142,
        activeConnections: 18,
        errorRatePercent: 0.02,
        memoryUsageMb: 256,
        cacheHitRate: 0.94,
        aiCostTodayUsd: 0.42,
        circuitBreakers: store.circuitBreakers,
      },
      timestamp,
    };
  }

  if (cleanPath === "/api/health") {
    return {
      status: "healthy",
      service: "codeatlas-static-demo",
      uptimeSeconds: 86400,
      timestamp,
    };
  }

  if (cleanPath === "/api/telemetry/alerts") {
    if (normalizedMethod === "POST") {
      return { success: true, message: "Alert state updated", timestamp };
    }
    return {
      success: true,
      data: { rules: store.alertRules, incidents: [] },
      rules: store.alertRules,
      incidents: [],
      timestamp,
    };
  }

  if (cleanPath === "/api/telemetry/circuit-breaker") {
    if (normalizedMethod === "POST") {
      const { name, action } = body || {};
      if (store.circuitBreakers[name]) {
        store.circuitBreakers[name].state = action === "reset" ? "CLOSED" : "OPEN";
        saveStore();
      }
      return { success: true, message: "Circuit breaker updated", timestamp };
    }
    return { success: true, data: store.circuitBreakers, timestamp };
  }

  if (cleanPath === "/api/telemetry/logs") {
    return {
      success: true,
      data: { logs: store.logs },
      logs: store.logs,
      timestamp,
    };
  }

  if (cleanPath === "/api/telemetry/traces") {
    return {
      success: true,
      data: { traces: store.traces },
      traces: store.traces,
      timestamp,
    };
  }

  if (cleanPath === "/api/activity") {
    if (normalizedMethod === "POST") {
      const newAct = {
        id: `act_${Date.now()}`,
        userId: "usr_demo",
        ...body,
        timestamp,
      };
      store.activities.unshift(newAct);
      saveStore();
      return { success: true, data: newAct, timestamp };
    }
    return { success: true, data: store.activities, timestamp };
  }

  if (cleanPath === "/api/notifications") {
    if (normalizedMethod === "PATCH") {
      store.notifications.forEach((n) => (n.read = true));
      saveStore();
      return { success: true, timestamp };
    }
    return {
      success: true,
      data: {
        notifications: store.notifications,
        unreadCount: store.notifications.filter((n) => !n.read).length,
      },
      timestamp,
    };
  }

  if (cleanPath === "/api/settings") {
    if (normalizedMethod === "POST") {
      if (body?.settings) Object.assign(store.userSettings, body.settings);
      saveStore();
      return { success: true, data: store.userSettings, timestamp };
    }
    return {
      success: true,
      data: {
        profile: {
          id: DEMO_USER.id,
          name: DEMO_USER.name,
          email: DEMO_USER.email,
          avatar: DEMO_USER.avatar,
          role: DEMO_USER.role,
        },
        settings: store.userSettings,
        integrations: {
          github: {
            connected: true,
            username: "demo-developer",
            scopes: ["read:user", "repo"],
            connectedAt: "2026-01-01T00:00:00.000Z",
            isSandbox: true,
          },
          ai: {
            gemini: { configured: true, model: "gemini-1.5-pro", status: "operational" },
            claude: { configured: true, model: "claude-3-5-sonnet", status: "operational" },
          },
        },
      },
      timestamp,
    };
  }

  if (cleanPath === "/api/search") {
    const q = (searchParams.get("q") || "").toLowerCase();
    const matches = [
      {
        title: "loginUser",
        type: "symbol",
        filePath: "src/services/auth.ts",
        line: 18,
        description: "Primary authentication handler function",
        preview: "export async function loginUser(email, password) { ... }",
      },
      {
        title: "LoginForm",
        type: "component",
        filePath: "src/components/LoginForm.tsx",
        line: 1,
        description: "React client form component",
        preview: "export function LoginForm() { ... }",
      },
      {
        title: "validateEmail",
        type: "symbol",
        filePath: "src/utils/validation.ts",
        line: 4,
        description: "Email regex validation routine",
        preview: "export function validateEmail(email: string): boolean { ... }",
      },
    ].filter((m) => !q || m.title.toLowerCase().includes(q) || m.filePath.toLowerCase().includes(q));

    return {
      success: true,
      data: {
        query: q,
        total: matches.length,
        results: matches,
      },
      timestamp,
    };
  }

  // Fallback for any unknown /api/* endpoint: return safe successful empty mock envelope
  return {
    success: true,
    data: {},
    message: `Mock response for ${normalizedMethod} ${cleanPath}`,
    timestamp,
  };
}

function initialDebtOverview(store: DemoStore) {
  return {
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
      {
        filePath: "src/components/LoginForm.tsx",
        symbolName: "handleSubmit",
        lineRange: { start: 26, end: 52 },
        complexityScore: 9,
        lineCount: 27,
        nestingDepth: 3,
        rationale: "Form submit orchestrates validation, error mapping, and navigation side-effects.",
      },
    ],
  };
}

// Global client fetch interceptor for static demo mode
if (typeof window !== "undefined") {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = typeof input === "string" ? input : (input as any)?.url || input.toString();

    // Check if demo mode is active and if the URL is an internal API endpoint
    if (isDemoMode() && (urlStr.startsWith("/api/") || urlStr.includes("/api/"))) {
      const cleanPath = urlStr.startsWith("http") ? new URL(urlStr).pathname : urlStr.split("?")[0];
      const searchStr = urlStr.includes("?") ? urlStr.split("?")[1] : "";
      const queryParams = new URLSearchParams(searchStr);
      const method = (init?.method || "GET").toUpperCase();

      let reqBody: any = undefined;
      if (init?.body) {
        if (typeof init.body === "string") {
          try {
            reqBody = JSON.parse(init.body);
          } catch {
            reqBody = init.body;
          }
        } else {
          reqBody = init.body;
        }
      }

      try {
        const mockResult = await handleMockRequest(method, cleanPath, reqBody, queryParams);
        return new Response(JSON.stringify(mockResult), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err?.message || "Mock error" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return originalFetch(input, init);
  };
}

